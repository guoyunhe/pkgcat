import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { open } from 'node:fs/promises'
import { basename, extname } from 'node:path'
import { pipeline } from 'node:stream/promises'

import { Exception } from '@adonisjs/core/exceptions'

import {
  decompress as decompressMetadata,
  decompressChunks,
  decompressStream,
} from '#utils/compression'
import { splitDebDescription, splitDebVersion } from '#utils/deb'
import { readTarEntries, type TarEntry } from '#utils/tar'

export const uploadedPackageTypes = ['deb', 'rpm', 'appimage'] as const

export type UploadedPackageType = (typeof uploadedPackageTypes)[number]

export type ExtractedPackageFile = {
  type: UploadedPackageType
  name: string
  version: string | null
  release: string | null
  arch: string | null
  license: string | null
  summary: string | null
  description: string | null
  size: number
  checksum: string
  checksumType: 'sha256'
}

type PackageMetadata = {
  name: string
  version: string | null
  release: string | null
  arch: string | null
  license: string | null
  summary: string | null
  description: string | null
}

type ArEntry = {
  name: string
  data: Buffer
}

type RpmHeaderEntry = {
  tag: number
  type: number
  offset: number
  count: number
}

type RpmHeader = {
  entries: RpmHeaderEntry[]
  store: Buffer
  end: number
}

const arMagic = '!<arch>\n'
const rpmMagic = Buffer.from([0xed, 0xab, 0xee, 0xdb])
const elfMagic = Buffer.from([0x7f, 0x45, 0x4c, 0x46])
const appImageMagic = Buffer.from([0x41, 0x49])

// Everything we read (ar entries, RPM headers, ELF header) lives at the beginning of the file.
const maxHeadSize = 32 * 1024 * 1024

/** Limit of the RPM header, which keeps a damaged package from being read as a huge one. */
const maxRpmHeaderEntries = 100_000
const maxRpmHeaderDataSize = 32 * 1024 * 1024
const rpmHeaderEntrySize = 16

// RPM header tags we read. Name, version, release, arch and license are plain strings, while the
// summary and description are localized strings (the first value is the C locale).
const rpmTags = {
  name: 1000,
  version: 1001,
  release: 1002,
  summary: 1004,
  description: 1005,
  license: 1014,
  arch: 1022,
  payloadFormat: 1124,
  payloadCompressor: 1125,
} as const
const rpmStringType = 6
const rpmI18nStringType = 9

/** Length of the fixed part of a SVR4 "newc" cpio entry, which is followed by the file name. */
const cpioHeaderSize = 110

/** Length of the RPM lead, which precedes the signature header. */
const rpmLeadSize = 96

/** Length of the intro of an RPM header: magic, version, reserved, index count and data size. */
const rpmHeaderIntroSize = 16

/** Compression of an RPM payload, named the way the package header names it. */
const rpmPayloadExtensions: Record<string, string> = {
  gzip: '.gz',
  gz: '.gz',
  zstd: '.zst',
  xz: '.xz',
  lzma: '.xz',
  none: '',
}

/** First bytes of an RPM payload, which tell where the payload begins and how it is compressed. */
const rpmPayloadMagics: Record<string, number[]> = {
  '.gz': [0x1f, 0x8b],
  '.zst': [0x28, 0xb5, 0x2f, 0xfd],
  '.xz': [0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00],
  '': [0x30, 0x37, 0x30, 0x37],
}

/** Paths inside a package carry a leading `./` or `/`; they are compared without it. */
export function normalizePackagePath(path: string) {
  return path.trim().replace(/^\.?\//, '')
}

/**
 * Regular expression of a package path pattern: `*` matches one path segment and `**` matches any
 * number of them, so a file can be looked up without knowing the directory layout of the package.
 */
function compilePackagePattern(pattern: string) {
  const source = normalizePackagePath(pattern)
    .split('/')
    .map((segment) => {
      if (segment === '**') return '.*'
      return segment
        .split('*')
        .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('[^/]*')
    })
    .join('/')

  return new RegExp(`^${source}$`)
}

const elfMachines: Record<number, string> = {
  3: 'i386',
  8: 'mips',
  20: 'ppc',
  21: 'ppc64',
  22: 's390x',
  40: 'arm',
  42: 'superh',
  50: 'ia64',
  62: 'x86_64',
  183: 'aarch64',
  243: 'riscv64',
}

const appImageArchNames: Record<string, string> = {
  amd64: 'x86_64',
  arm64: 'aarch64',
  armhf: 'arm',
  armv7l: 'arm',
  i686: 'i386',
  x86_64: 'x86_64',
  aarch64: 'aarch64',
  i386: 'i386',
}

export default class PackageFileExtractor {
  /**
   * Read a deb, rpm or AppImage file and extract the metadata used to create a package entry: the
   * package format, its name, version, release and architecture, its license, summary and
   * description, plus the size and the checksum of the uploaded bytes.
   */
  async extract(filePath: string, fileName: string): Promise<ExtractedPackageFile> {
    const handle = await open(filePath, 'r')

    try {
      const stats = await handle.stat()
      const head = Buffer.alloc(Math.min(stats.size, maxHeadSize))
      if (head.length > 0) await handle.read(head, 0, head.length, 0)

      const type = this.detectType(head, fileName)
      const metadata = await this.parse(type, head, fileName)

      return {
        type,
        ...metadata,
        size: stats.size,
        checksum: await this.hashFile(filePath),
        checksumType: 'sha256',
      }
    } finally {
      await handle.close()
    }
  }

  /**
   * Read files from an in-memory deb or rpm package, keyed by the path that was asked for. The
   * payload is decompressed in memory and only the wanted files are kept, so a package can be read
   * without being written to disk.
   */
  async readFiles(
    type: UploadedPackageType,
    data: Buffer,
    wantedPaths: string[],
  ): Promise<Map<string, Buffer>> {
    const originals = new Map(wantedPaths.map((path) => [normalizePackagePath(path), path]))
    const result = new Map<string, Buffer>()
    if (originals.size === 0) return result

    const entries = await this.readPackageEntries(type, data, (path) => originals.has(path))
    for (const entry of entries) {
      const path = originals.get(normalizePackagePath(entry.name))
      if (path && !result.has(path)) result.set(path, entry.data)
    }

    return result
  }

  /**
   * Read every file of an in-memory deb or rpm package whose path matches one of the patterns,
   * keyed by the path inside the package. Patterns may use `*` for one path segment and `**` for
   * any number of them.
   */
  async readMatchingFiles(
    type: UploadedPackageType,
    data: Buffer,
    patterns: string[],
  ): Promise<Map<string, Buffer>> {
    const matchers = patterns.map(compilePackagePattern)
    if (matchers.length === 0) return new Map()

    const entries = await this.readPackageEntries(type, data, (path) =>
      matchers.some((matcher) => matcher.test(path)),
    )
    return new Map(entries.map((entry) => [normalizePackagePath(entry.name), entry.data]))
  }

  /**
   * Read every file of a package whose path matches one of the patterns while the package is being
   * downloaded, keyed by the path inside the package. Packages of a repository are up to hundreds
   * of megabytes, so the archive is never held in memory as a whole.
   */
  async readMatchingFilesFromStream(
    type: UploadedPackageType,
    chunks: AsyncIterable<Buffer>,
    patterns: string[],
  ): Promise<Map<string, Buffer>> {
    const matchers = patterns.map(compilePackagePattern)
    if (matchers.length === 0) return new Map()
    const match = (path: string) => matchers.some((matcher) => matcher.test(path))

    // Only the rpm payload can be walked while it is read; the other formats are archives that
    // have to be decompressed before their entries can be found
    const entries =
      type === 'rpm'
        ? await this.readRpmStreamEntries(chunks, match)
        : await this.readPackageEntries(type, await collectChunks(chunks), match)

    return new Map(entries.map((entry) => [normalizePackagePath(entry.name), entry.data]))
  }

  /**
   * Read the files of an RPM that is still being downloaded. The headers are read first, which name
   * the compression of the payload that follows; the payload is then decompressed and walked as it
   * arrives, so that neither the package nor its payload is held in memory.
   */
  private async readRpmStreamEntries(
    chunks: AsyncIterable<Buffer>,
    match: (path: string) => boolean,
  ): Promise<TarEntry[]> {
    const reader = new ChunkReader(chunks[Symbol.asyncIterator]())

    // RPM layout: a 96 byte lead, the signature header (padded to 8 bytes) and the main header
    if (!(await reader.skip(rpmLeadSize))) {
      throw new Exception('Not a valid RPM package: the signature header is malformed', {
        status: 422,
      })
    }

    const signature = await this.readStreamedRpmHeader(reader)
    if (!signature) {
      throw new Exception('Not a valid RPM package: the signature header is malformed', {
        status: 422,
      })
    }

    const signaturePadding = (8 - (signature.end % 8)) % 8
    if (signaturePadding > 0 && !(await reader.skip(signaturePadding))) {
      throw new Exception('Not a valid RPM package: the header is malformed', { status: 422 })
    }

    const header = await this.readStreamedRpmHeader(reader)
    if (!header) {
      throw new Exception('Not a valid RPM package: the header is malformed', { status: 422 })
    }

    const format = this.readRpmString(header, rpmTags.payloadFormat)
    if (format && format !== 'cpio') {
      throw new Exception(`Unsupported RPM payload format: ${format}`, { status: 422 })
    }

    const compressor = this.readRpmString(header, rpmTags.payloadCompressor)
    // The payload either follows the header directly or is padded to an 8 byte boundary, which the
    // signature it begins with tells apart
    const headerPadding = (8 - (header.end % 8)) % 8
    if (headerPadding > 0) {
      const padding = await reader.collect(headerPadding)
      if (!padding) {
        throw new Exception('Not a valid RPM package: the payload is missing', { status: 422 })
      }
      if (payloadStartsAt(padding, compressor)) reader.unread(padding)
    }

    const extension = rpmPayloadExtensions[(compressor ?? 'gzip').toLowerCase()]
    if (extension === undefined) {
      throw new Exception(`Unsupported RPM payload compression: ${compressor}`)
    }

    try {
      return await readCpioEntries(decompressChunks(reader.remaining(), extension), match)
    } catch (error) {
      throw new Exception(
        `Unable to decompress the RPM payload${error instanceof Error ? `: ${error.message}` : ''}`,
        { status: 422 },
      )
    }
  }

  /** One RPM header of the stream, which intro names the size of the index and of the data store. */
  private async readStreamedRpmHeader(reader: ChunkReader): Promise<RpmHeader | null> {
    const intro = await reader.collect(rpmHeaderIntroSize)
    if (!intro) return null

    const indexCount = intro.readUInt32BE(8)
    const dataSize = intro.readUInt32BE(12)
    if (indexCount > maxRpmHeaderEntries || dataSize > maxRpmHeaderDataSize) return null

    const rest = await reader.collect(indexCount * rpmHeaderEntrySize + dataSize)
    if (!rest) return null

    return this.readRpmHeader(Buffer.concat([intro, rest]), 0)
  }

  private async readPackageEntries(
    type: UploadedPackageType,
    data: Buffer,
    match: (path: string) => boolean,
  ): Promise<TarEntry[]> {
    switch (type) {
      case 'rpm':
        return this.readRpmFileEntries(data, match)
      case 'deb':
        return this.readDebFileEntries(data, match)
      default:
        throw new Exception('AppImage packages do not expose their files', { status: 422 })
    }
  }

  /**
   * Package archives are parsed from the beginning of the file, so only the head is kept in memory.
   * The checksum is computed by streaming the whole file.
   */
  private async hashFile(filePath: string) {
    const hash = createHash('sha256')
    await pipeline(createReadStream(filePath), hash)
    return hash.digest('hex')
  }

  private async readDebFileEntries(data: Buffer, match: (path: string) => boolean) {
    const entries = this.readArEntries(data)
    const dataEntry = entries.find((entry) => /^data\.tar(\.(gz|xz|zst))?$/.test(entry.name))
    if (!dataEntry) {
      throw new Exception('Not a valid Debian package: the data archive is missing', {
        status: 422,
      })
    }

    const archive = await this.decompress(dataEntry.data, extname(dataEntry.name))
    return readTarEntries(archive).filter((entry) => match(normalizePackagePath(entry.name)))
  }

  private async readRpmFileEntries(
    data: Buffer,
    match: (path: string) => boolean,
  ): Promise<TarEntry[]> {
    // RPM layout: a 96 byte lead, the signature header (padded to 8 bytes) and the main header.
    const signature = this.readRpmHeader(data, 96)
    if (!signature) {
      throw new Exception('Not a valid RPM package: the signature header is malformed', {
        status: 422,
      })
    }

    const header = this.readRpmHeader(data, signature.end + ((8 - (signature.end % 8)) % 8))
    if (!header) {
      throw new Exception('Not a valid RPM package: the header is malformed', { status: 422 })
    }

    const format = this.readRpmString(header, rpmTags.payloadFormat)
    if (format && format !== 'cpio') {
      throw new Exception(`Unsupported RPM payload format: ${format}`, { status: 422 })
    }

    const compressor = this.readRpmString(header, rpmTags.payloadCompressor)
    const offsets = [header.end, header.end + ((8 - (header.end % 8)) % 8)]
    let lastError: unknown = null

    for (const offset of new Set(offsets)) {
      try {
        return await readCpioEntries(this.payloadStream(data.subarray(offset), compressor), match)
      } catch (error) {
        lastError = error
      }
    }

    throw new Exception(
      `Unable to decompress the RPM payload${
        lastError instanceof Error ? `: ${lastError.message}` : ''
      }`,
      { status: 422 },
    )
  }

  /**
   * Decompress a payload while it is being read. The payload of a package is several times larger
   * than the package itself — the `thunderbird` rpm of AlmaLinux 10 is 110 MB and unpacks to about
   * 300 MB — so holding it in memory as a whole is what makes reading a large repository
   * expensive.
   */
  private payloadStream(payload: Buffer, compressor: string | null) {
    const extension = rpmPayloadExtensions[(compressor ?? 'gzip').toLowerCase()]
    if (extension === undefined) {
      throw new Exception(`Unsupported RPM payload compression: ${compressor}`)
    }

    return decompressStream(payload, extension)
  }

  private detectType(data: Buffer, fileName: string): UploadedPackageType {
    if (data.length >= arMagic.length && data.subarray(0, 8).toString('latin1') === arMagic) {
      return 'deb'
    }
    if (data.length >= 4 && data.subarray(0, 4).equals(rpmMagic)) return 'rpm'
    if (
      data.length >= 12 &&
      data.subarray(0, 4).equals(elfMagic) &&
      data[8] === appImageMagic[0] &&
      data[9] === appImageMagic[1] &&
      (data[10] === 1 || data[10] === 2)
    ) {
      return 'appimage'
    }

    // Fall back to the file extension so that an invalid file gets a precise error message
    // instead of a generic "unsupported format" one.
    const extension = extname(fileName).toLowerCase()
    if (extension === '.deb') return 'deb'
    if (extension === '.rpm') return 'rpm'
    if (extension === '.appimage') return 'appimage'

    throw new Exception(
      `Unsupported package file: expected one of ${uploadedPackageTypes.join(', ')}`,
      { status: 422 },
    )
  }

  private async parse(
    type: UploadedPackageType,
    data: Buffer,
    fileName: string,
  ): Promise<PackageMetadata> {
    if (type === 'deb') return this.parseDeb(data)
    if (type === 'rpm') return this.parseRpm(data)
    return this.parseAppImage(data, fileName)
  }

  private async parseDeb(data: Buffer): Promise<PackageMetadata> {
    const entries = this.readArEntries(data)
    const controlEntry = entries.find((entry) => /^control\.tar(\.(gz|xz|zst))?$/.test(entry.name))
    if (!controlEntry) {
      throw new Exception('Not a valid Debian package: the control archive is missing', {
        status: 422,
      })
    }

    const controlArchive = await this.decompress(controlEntry.data, extname(controlEntry.name))
    const controlFile = readTarEntries(controlArchive).find((entry) => entry.name === 'control')
    if (!controlFile) {
      throw new Exception('Not a valid Debian package: the control file is missing', {
        status: 422,
      })
    }

    const fields = this.parseControlFields(controlFile.data.toString('utf8'))
    const name = fields.Package
    if (!name) {
      throw new Exception('Not a valid Debian package: the Package field is missing', {
        status: 422,
      })
    }

    const version = splitDebVersion(fields.Version)
    const description = splitDebDescription(fields.Description)
    return {
      name,
      version: version.version,
      release: version.release,
      arch: fields.Architecture ? this.fromDebArch(fields.Architecture) : null,
      license: fields.License ?? null,
      summary: description.summary,
      description: description.description,
    }
  }

  private parseRpm(data: Buffer): PackageMetadata {
    // RPM layout: a 96 byte lead, the signature header (padded to 8 bytes) and the main header.
    const signature = this.readRpmHeader(data, 96)
    if (!signature) {
      throw new Exception('Not a valid RPM package: the signature header is malformed', {
        status: 422,
      })
    }

    const header = this.readRpmHeader(data, signature.end + ((8 - (signature.end % 8)) % 8))
    if (!header) {
      throw new Exception('Not a valid RPM package: the header is malformed', { status: 422 })
    }

    const name = this.readRpmString(header, rpmTags.name)
    if (!name) {
      throw new Exception('Not a valid RPM package: the name tag is missing', { status: 422 })
    }

    return {
      name,
      version: this.readRpmString(header, rpmTags.version),
      release: this.readRpmString(header, rpmTags.release),
      arch: this.readRpmString(header, rpmTags.arch),
      license: this.readRpmLocalizedString(header, rpmTags.license),
      summary: this.readRpmLocalizedString(header, rpmTags.summary),
      description: this.readRpmLocalizedString(header, rpmTags.description),
    }
  }

  private parseAppImage(data: Buffer, fileName: string): PackageMetadata {
    const appImageType = data[10]
    if (appImageType !== 1 && appImageType !== 2) {
      throw new Exception('Not a valid AppImage file', { status: 422 })
    }

    // The AppImage payload is a compressed (squashfs) filesystem, so the metadata is taken from
    // the file name and the ELF header instead of the embedded desktop entry.
    const name = this.parseAppImageName(fileName)
    return {
      name: name.name,
      version: name.version,
      release: null,
      arch: this.readElfArch(data) ?? name.arch,
      license: null,
      summary: null,
      description: null,
    }
  }

  private parseAppImageName(fileName: string) {
    const base = basename(fileName).replace(/\.appimage$/i, '')
    const archNames = Object.keys(appImageArchNames).join('|')
    const archMatch = base.match(new RegExp(`(?:^|[-_\\s])(${archNames})(?=$|[-_\\s.])`, 'i'))
    const archToken = archMatch?.[1] ?? null
    const versionMatch = base.match(/(?:^|[-_\s])v?(\d[\d.]*(?:[-+~][\w.]+)?)(?=$|[-_\s])/i)

    let version: string | null = null
    let name = base

    if (versionMatch) {
      version = versionMatch[1]
      name = base.slice(0, versionMatch.index ?? 0).replace(/[-_\s]+$/, '')
    }
    if (archToken) {
      if (version) {
        version =
          version.replace(new RegExp(`[-+~]${this.escapeRegExp(archToken)}$`, 'i'), '') || null
      }
      name = name.replace(new RegExp(`[-_\\s]*${this.escapeRegExp(archToken)}$`, 'i'), '')
    }

    return {
      name: name || base,
      version,
      arch: archToken ? appImageArchNames[archToken.toLowerCase()] : null,
    }
  }

  private escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  private readElfArch(data: Buffer): string | null {
    if (data.length < 20 || !data.subarray(0, 4).equals(elfMagic)) return null
    const littleEndian = data[5] !== 2
    const machine = littleEndian ? data.readUInt16LE(18) : data.readUInt16BE(18)
    return elfMachines[machine] ?? null
  }

  private readArEntries(data: Buffer): ArEntry[] {
    const entries: ArEntry[] = []
    let offset = arMagic.length

    while (offset + 60 <= data.length) {
      const header = data.subarray(offset, offset + 60)
      if (header.subarray(58, 60).toString('latin1') !== '`\n') break

      const rawName = header.subarray(0, 16).toString('latin1').trim()
      const size = Number.parseInt(header.subarray(48, 58).toString('latin1').trim(), 10)
      if (!rawName || !Number.isInteger(size) || size < 0) break

      offset += 60
      let name = rawName.replace(/\/+$/, '')
      let contents = data.subarray(offset, offset + size)

      // BSD variants store the file name in the first bytes of the entry itself.
      const embeddedName = name.match(/^#1\/(\d+)$/)
      if (embeddedName) {
        const nameLength = Number.parseInt(embeddedName[1], 10)
        name = contents.subarray(0, nameLength).toString('utf8').replace(/\0+$/, '')
        contents = contents.subarray(nameLength)
      }

      entries.push({ name, data: contents })
      offset += size + (size % 2)
    }

    return entries
  }

  private parseControlFields(content: string): Record<string, string> {
    const fields: Record<string, string> = {}
    let current: string | null = null

    for (const line of content.split('\n')) {
      if (!line.trim()) {
        current = null
        continue
      }
      // Continuation lines start with a space; a lone "dot" line stands for an empty line.
      if (/^\s/.test(line)) {
        if (!current) continue
        const continued = line.replace(/^\s/, '')
        fields[current] += `\n${continued === '.' ? '' : continued}`
        continue
      }
      const separator = line.indexOf(':')
      if (separator === -1) continue
      current = line.slice(0, separator).trim()
      fields[current] = line.slice(separator + 1).trim()
    }

    return fields
  }

  private readRpmHeader(data: Buffer, offset: number): RpmHeader | null {
    if (offset + 16 > data.length) return null
    if (data[offset] !== 0x8e || data[offset + 1] !== 0xad || data[offset + 2] !== 0xe8) return null
    if (data[offset + 3] !== 0x01) return null

    const indexCount = data.readUInt32BE(offset + 8)
    const dataSize = data.readUInt32BE(offset + 12)
    if (indexCount > maxRpmHeaderEntries || offset + 16 + indexCount * 16 > data.length) return null

    const entries: RpmHeaderEntry[] = []
    let position = offset + 16
    for (let index = 0; index < indexCount; index++) {
      entries.push({
        tag: data.readUInt32BE(position),
        type: data.readUInt32BE(position + 4),
        offset: data.readUInt32BE(position + 8),
        count: data.readUInt32BE(position + 12),
      })
      position += 16
    }

    return {
      entries,
      store: data.subarray(position, Math.min(position + dataSize, data.length)),
      end: position + dataSize,
    }
  }

  private readRpmString(header: RpmHeader, tag: number): string | null {
    const entry = header.entries.find((row) => row.tag === tag && row.type === rpmStringType)
    return entry ? this.readRpmStoreString(header, entry.offset) : null
  }

  /**
   * Summary, description and license can be stored as localized strings, in which case several
   * translations are packed into the store and the first one is the C locale.
   */
  private readRpmLocalizedString(header: RpmHeader, tag: number): string | null {
    const entry = header.entries.find(
      (row) => row.tag === tag && (row.type === rpmStringType || row.type === rpmI18nStringType),
    )
    return entry ? this.readRpmStoreString(header, entry.offset) : null
  }

  private readRpmStoreString(header: RpmHeader, offset: number): string | null {
    if (offset >= header.store.length) return null

    const end = header.store.indexOf(0, offset)
    const value = header.store
      .subarray(offset, end === -1 ? header.store.length : end)
      .toString('utf8')
      .trim()

    return value || null
  }

  private async decompress(data: Buffer, extension: string): Promise<Buffer> {
    return decompressMetadata(data, extension)
  }

  private fromDebArch(arch: string) {
    switch (arch) {
      case 'amd64':
        return 'x86_64'
      case 'arm64':
        return 'aarch64'
      case 'ppc64el':
        return 'ppc64le'
      default:
        return arch
    }
  }
}

/**
 * RPM payloads are SVR4 "newc" cpio archives with one entry per file. Entries are walked by their
 * declared lengths and only the files that are wanted are kept, so that a payload that is much
 * larger than the package it belongs to is never held in memory.
 */
async function readCpioEntries(
  chunks: AsyncIterable<Buffer>,
  match: (path: string) => boolean,
): Promise<TarEntry[]> {
  const reader = new ChunkReader(chunks[Symbol.asyncIterator]())
  const entries: TarEntry[] = []
  // Offset of the entry inside the payload, which the padding of the entries is aligned to
  let position = 0

  while (true) {
    const header = await reader.collect(cpioHeaderSize)
    if (!header) break

    const magic = header.subarray(0, 6).toString('latin1')
    if (magic !== '070701' && magic !== '070702') break

    const readHex = (at: number) =>
      Number.parseInt(header.subarray(at, at + 8).toString('latin1'), 16)
    const fileSize = readHex(54)
    const nameSize = readHex(94)
    if (!Number.isInteger(fileSize) || !Number.isInteger(nameSize) || nameSize < 1) break

    // The name is stored with its terminating NUL, which the next entry is aligned after
    const name = await reader.collect(nameSize)
    if (!name) break
    const path = name.subarray(0, nameSize - 1).toString('utf8')
    position += cpioHeaderSize + nameSize

    const namePadding = (4 - (position % 4)) % 4
    if (namePadding > 0 && !(await reader.skip(namePadding))) break
    position += namePadding

    if (path === 'TRAILER!!!') break

    if (match(normalizePackagePath(path))) {
      const data = await reader.collect(fileSize)
      if (!data) break
      entries.push({ name: path, data })
    } else if (!(await reader.skip(fileSize))) {
      break
    }

    position += fileSize
    const dataPadding = (4 - (position % 4)) % 4
    if (dataPadding > 0 && !(await reader.skip(dataPadding))) break
    position += dataPadding
  }

  return entries
}

/**
 * Reads a stream of chunks piece by piece, so that a payload that is larger than memory can be
 * walked through: an entry that is not wanted is skipped instead of being held.
 */
class ChunkReader {
  private chunk: Buffer = Buffer.alloc(0)
  private offset = 0

  constructor(private readonly chunks: AsyncIterator<Buffer>) {}

  /** Exactly `size` bytes of the stream, or `null` when it ends before them. */
  async collect(size: number): Promise<Buffer | null> {
    const parts: Buffer[] = []
    let missing = size

    while (missing > 0) {
      const piece = await this.read(missing)
      if (!piece) return null
      parts.push(piece)
      missing -= piece.length
    }

    if (parts.length === 0) return Buffer.alloc(0)
    return parts.length === 1 ? parts[0] : Buffer.concat(parts, size)
  }

  /** Advance the stream by `size` bytes, or report that it ends before them. */
  async skip(size: number): Promise<boolean> {
    let missing = size

    while (missing > 0) {
      const piece = await this.read(missing)
      if (!piece) return false
      missing -= piece.length
    }

    return true
  }

  /** Put bytes back at the front of the stream, which the caller did not need after all. */
  unread(piece: Buffer) {
    if (piece.length === 0) return

    const rest = this.chunk.subarray(this.offset)
    this.chunk = rest.length > 0 ? Buffer.concat([piece, rest]) : piece
    this.offset = 0
  }

  /** The bytes that have not been read yet, as a stream. */
  async *remaining(): AsyncGenerator<Buffer> {
    while (true) {
      const piece = await this.read(Number.MAX_SAFE_INTEGER)
      if (!piece) return
      yield piece
    }
  }

  /** At most `size` bytes of the stream, or `null` when it has ended. */
  private async read(size: number): Promise<Buffer | null> {
    while (this.offset >= this.chunk.length) {
      const next = await this.chunks.next()
      if (next.done) return null
      this.chunk = next.value
      this.offset = 0
    }

    const piece = this.chunk.subarray(this.offset, this.offset + size)
    this.offset += piece.length
    return piece
  }
}

/**
 * Whether the bytes given begin the payload, instead of being the padding of the RPM header. A
 * prefix shorter than the signature cannot be told apart, and counts as the payload.
 */
function payloadStartsAt(prefix: Buffer, compressor: string | null) {
  const extension = rpmPayloadExtensions[(compressor ?? 'gzip').toLowerCase()] ?? ''
  const magic = rpmPayloadMagics[extension] ?? []

  for (let index = 0; index < Math.min(prefix.length, magic.length); index++) {
    if (prefix[index] !== magic[index]) return false
  }

  return true
}

/** The whole stream as one buffer, for the archives that have to be read as a whole. */
async function collectChunks(chunks: AsyncIterable<Buffer>): Promise<Buffer> {
  const parts: Buffer[] = []
  for await (const piece of chunks) parts.push(piece)
  return Buffer.concat(parts)
}
