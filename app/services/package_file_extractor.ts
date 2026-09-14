import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { open } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { basename, extname } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import type { ReadableStream as WebReadableStream } from 'node:stream/web'
import { gunzipSync, zstdDecompressSync } from 'node:zlib'

import { Exception } from '@adonisjs/core/exceptions'

import { splitDebDescription, splitDebVersion } from '../utils/deb.js'
import { readTarEntries, type TarEntry } from '../utils/tar.js'

// The package is a webpack UMD bundle and does not expose its named exports to the ESM loader.
const require = createRequire(import.meta.url)
const { XzReadableStream } = require('xz-decompress') as typeof import('xz-decompress')

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
    const payload = await this.decompressRpmPayload(data, header, compressor)
    return this.readCpioEntries(payload, match)
  }

  /**
   * The payload follows the main header. Some tools pad the header to an 8 byte boundary, so the
   * offsets are tried until the payload can be decompressed.
   */
  private async decompressRpmPayload(data: Buffer, header: RpmHeader, compressor: string | null) {
    const offsets = [header.end, header.end + ((8 - (header.end % 8)) % 8)]
    let lastError: unknown = null

    for (const offset of new Set(offsets)) {
      try {
        return await this.decompressPayload(data.subarray(offset), compressor)
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

  private async decompressPayload(payload: Buffer, compressor: string | null) {
    switch ((compressor ?? 'gzip').toLowerCase()) {
      case 'gzip':
      case 'gz':
        return gunzipSync(payload)
      case 'zstd':
        return zstdDecompressSync(payload)
      case 'xz':
      case 'lzma':
        return this.decompress(payload, '.xz')
      case 'none':
        return payload
      default:
        throw new Exception(`Unsupported RPM payload compression: ${compressor}`)
    }
  }

  /**
   * RPM payloads are SVR4 "newc" cpio archives with one entry per file. Entries are walked by their
   * declared lengths and only the matching files are kept.
   */
  private readCpioEntries(data: Buffer, match: (path: string) => boolean) {
    const entries: TarEntry[] = []
    let offset = 0

    while (offset + cpioHeaderSize <= data.length) {
      const magic = data.subarray(offset, offset + 6).toString('latin1')
      if (magic !== '070701' && magic !== '070702') break

      const readHex = (at: number) =>
        Number.parseInt(data.subarray(offset + at, offset + at + 8).toString('latin1'), 16)
      const fileSize = readHex(54)
      const nameSize = readHex(94)
      if (!Number.isInteger(fileSize) || !Number.isInteger(nameSize) || nameSize < 1) break

      const name = data
        .subarray(offset + cpioHeaderSize, offset + cpioHeaderSize + nameSize - 1)
        .toString('utf8')
      offset += cpioHeaderSize + nameSize
      offset += (4 - (offset % 4)) % 4

      const contents = data.subarray(offset, offset + fileSize)
      offset += fileSize
      offset += (4 - (offset % 4)) % 4

      if (name === 'TRAILER!!!') break
      if (match(normalizePackagePath(name))) entries.push({ name, data: contents })
    }

    return entries
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
    if (indexCount > 100_000 || offset + 16 + indexCount * 16 > data.length) return null

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
    if (extension === '.gz') return gunzipSync(data)
    if (extension === '.zst') return zstdDecompressSync(data)
    if (extension === '.xz') {
      // "xz-decompress" expects the global (WHATWG) ReadableStream type, which differs from the
      // "node:stream/web" one once the DOM lib is part of the program (client project).
      const compressed = Readable.toWeb(
        Readable.from([data]),
      ) as unknown as ReadableStream<Uint8Array>
      const stream = new XzReadableStream(compressed)
      const chunks: Buffer[] = []
      for await (const chunk of Readable.fromWeb(
        stream as unknown as WebReadableStream<Uint8Array>,
      )) {
        chunks.push(Buffer.from(chunk as Uint8Array))
      }
      return Buffer.concat(chunks)
    }
    return data
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
