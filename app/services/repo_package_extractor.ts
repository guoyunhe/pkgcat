import { XMLParser } from 'fast-xml-parser'
import xior, { isXiorError } from 'xior'

import type Repo from '#models/repo'
import {
  compressionExtension,
  compressionOf,
  decompress,
  decompressStream,
  isCompression,
} from '#utils/compression'
import { splitDebDescription, splitDebVersion } from '#utils/deb'
import { pacmanDescFields, splitPacmanVersion } from '#utils/pacman'
import { collectChunks } from '#utils/streams'
import { eachTarEntry } from '#utils/tar'
import { eachXmlElement } from '#utils/xml'

export type RepoPackageType = 'rpm' | 'deb' | 'pacman'

export type ExtractedPackage = {
  type: RepoPackageType
  name: string
  version: string | null
  release: string | null
  arch: string | null
  license: string | null
  summary: string | null
  description: string | null
  downloadUrl: string
  checksum: string | null
  checksumType: string | null
  size: number | null
}

export type ExtractOptions = {
  arch?: string
}

export type DebSource = {
  uri: string
  suite: string
  components: string[]
  arch: string | null
}

/** A pacman repository as its configuration states it: its section and the server holding it. */
export type PacmanSource = {
  name: string
  url: string
}

/** A deb source with its architecture resolved, ready to build metadata URLs from. */
export type ResolvedDebSource = {
  uri: string
  suite: string
  components: string[]
  arch: string
}

type XmlDataEntry = {
  '@_type'?: string
  location?: { '@_href'?: string }
}

type XmlChecksum =
  | string
  | {
      '#text'?: string
      '@_type'?: string
    }
  | undefined

type XmlRpmPackage = {
  name?: string
  arch?: string
  version?: { '@_ver'?: string; '@_rel'?: string }
  summary?: unknown
  description?: unknown
  location?: { '@_href'?: string }
  checksum?: XmlChecksum
  size?: { '@_package'?: string }
  format?: Record<string, unknown>
}

const requestHeaders = { Accept: '*/*', 'User-Agent': 'curl/8.0' }

function text(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const trimmed = String(value).trim()
  return trimmed ? trimmed : null
}

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

/** Last segment of a URL, which names a repository that states no configuration of its own. */
function lastPathSegment(url: string) {
  const segments = url.replace(/\/+$/, '').split('/')
  return decodeURIComponent(segments[segments.length - 1] ?? '')
}

/**
 * Source and debug packages carry no application and are never installed directly, so they are left
 * out of the catalog. Debug packages are recognized by the suffix Fedora and openSUSE use, while
 * source RPMs are published with the `src` architecture.
 */
function isSourceOrDebugPackage(name: string | undefined, arch: string | undefined) {
  return arch === 'src' || /-(debuginfo|debugsource)$/.test(name ?? '')
}

function parseDebStanzas(content: string): Record<string, string>[] {
  return content
    .split(/\n\s*\n/)
    .map((block) => {
      const fields: Record<string, string> = {}
      let currentKey: string | null = null
      for (const line of block.split('\n')) {
        // Indented lines continue the previous field, which is how deb packages carry the long
        // description. A lone "dot" line stands for an empty line.
        if (/^\s/.test(line)) {
          if (!currentKey) continue
          const continued = line.replace(/^\s/, '')
          fields[currentKey] += `\n${continued === '.' ? '' : continued}`
          continue
        }
        if (!line.includes(':')) continue
        const separator = line.indexOf(':')
        const key = line.slice(0, separator)
        const value = line.slice(separator + 1).trim()
        if (!key) continue
        fields[key] = value
        currentKey = key
      }
      return fields
    })
    .filter((fields) => fields.Package && fields.Filename)
}

/**
 * Some XML metadata values carry attributes (e.g. `xml:lang`), which turns them into objects, and
 * the parser may return a list of translations. Take the first usable text.
 */
function readXmlText(value: unknown): string | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = readXmlText(item)
      if (found) return found
    }
    return null
  }
  if (value && typeof value === 'object') {
    return text((value as { '#text'?: unknown })['#text'])
  }
  return text(value)
}

export default class RepoPackageExtractor {
  private xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (tagName) => tagName === 'data' || tagName === 'package',
  })

  /**
   * Read the packages of a repository one at a time. A repository holds tens of thousands of
   * packages with their descriptions, which the caller writes to the catalog as they arrive instead
   * of holding the whole repository in memory.
   */
  async *extract(repo: Repo, options: ExtractOptions = {}): AsyncGenerator<ExtractedPackage> {
    if (repo.type === 'rpm') {
      yield* this.extractRpm(repo)
      return
    }
    if (repo.type === 'deb') {
      yield* this.extractDeb(repo, options.arch ?? null)
      return
    }
    if (repo.type === 'pacman') {
      yield* this.extractPacman(repo)
      return
    }

    throw new Error(`Unsupported repository type "${repo.type}": expected "rpm", "deb" or "pacman"`)
  }

  private async *extractRpm(repo: Repo): AsyncGenerator<ExtractedPackage> {
    const repomdUrl = joinUrl(repo.baseUrl, 'repodata/repomd.xml')
    const repomd = await this.downloadText(repomdUrl)
    const parsedRepomd = this.xmlParser.parse(repomd) as unknown as {
      repomd?: { data?: XmlDataEntry[] }
    }
    const entries = parsedRepomd.repomd?.data ?? []
    const primaryEntry = entries.find((entry) => entry['@_type'] === 'primary')
    const href = primaryEntry?.location?.['@_href']
    if (!href) throw new Error(`Primary package metadata not found in ${repomdUrl}`)

    // The primary metadata of a large repository unpacks to hundreds of megabytes — 429 MB for
    // AlmaLinux 8 `BaseOS` — so the packages are read one at a time instead of as one document
    for await (const element of this.eachMetadataElement(joinUrl(repo.baseUrl, href), 'package')) {
      const parsed = this.xmlParser.parse(element) as unknown as { package?: XmlRpmPackage[] }
      const entry = parsed.package?.[0]
      if (!entry) continue

      const pkg = this.readRpmPackage(repo, entry)
      if (pkg) yield pkg
    }
  }

  /** One `<package>` element of the primary metadata as a catalog package. */
  private readRpmPackage(repo: Repo, entry: XmlRpmPackage): ExtractedPackage | null {
    if (isSourceOrDebugPackage(entry.name, entry.arch)) return null

    const location = entry.location?.['@_href']
    if (!entry.name || !location) return null

    const checksum = this.readChecksum(entry.checksum)
    return {
      type: 'rpm',
      name: entry.name,
      version: text(entry.version?.['@_ver']),
      release: text(entry.version?.['@_rel']),
      arch: text(entry.arch),
      license: readXmlText(entry.format?.['rpm:license'] ?? entry.format?.license),
      summary: readXmlText(entry.summary),
      description: readXmlText(entry.description),
      downloadUrl: joinUrl(repo.baseUrl, location),
      checksum: checksum.checksum,
      checksumType: checksum.checksumType,
      size: this.readNumber(entry.size?.['@_package']),
    }
  }

  /**
   * Read the packages of a pacman repository. Such a repository publishes one database of metadata
   * (`<repo>.db`) instead of a document per package, which is a compressed tar holding the `desc`
   * file of every package. The database of a large repository is a few megabytes, so it is read as
   * one buffer and walked entry by entry.
   */
  private async *extractPacman(repo: Repo): AsyncGenerator<ExtractedPackage> {
    const source = this.pacmanSource(repo)
    const data = await this.download(joinUrl(source.url, `${source.name}.db`))
    const archive = decompressStream(data, compressionOf(data))

    for await (const entry of eachTarEntry(archive)) {
      if (!entry.name.endsWith('/desc')) continue

      const content = await collectChunks(entry.data)
      const fields = pacmanDescFields(content.toString('utf8'))
      const pkg = this.readPacmanPackage(source, fields)
      if (pkg) yield pkg
    }
  }

  /** The `desc` file of one package of a pacman database, as a catalog package. */
  private readPacmanPackage(
    source: PacmanSource,
    fields: Record<string, string>,
  ): ExtractedPackage | null {
    const name = fields.NAME
    const filename = fields.FILENAME
    if (!name || !filename) return null

    const version = splitPacmanVersion(fields.VERSION)
    return {
      type: 'pacman',
      name,
      version: version.version,
      release: version.release,
      arch: text(fields.ARCH),
      // A package may be licensed under several terms, which the database lists one per line
      license: text(fields.LICENSE?.replace(/\n/g, ', ')),
      // A pacman database carries no long description, only the one line summary
      summary: text(fields.DESC),
      description: null,
      downloadUrl: joinUrl(source.url, filename),
      checksum: text(fields.SHA256SUM) ?? text(fields.MD5SUM),
      checksumType: text(fields.SHA256SUM) ? 'sha256' : text(fields.MD5SUM) ? 'md5' : null,
      size: this.readNumber(fields.CSIZE),
    }
  }

  /**
   * Pacman repository as its configuration states it: the section name and the server it is read
   * from, which is what the database of the repository is looked up on. The configuration is a
   * pacman.conf section (`[core]` followed by `Server = https://…`), and its server may name the
   * repository and the architecture the way a mirrorlist does (`$repo`, `$arch`). A repository that
   * states no section is read from its base URL, whose last segment names it.
   */
  pacmanSource(repo: Repo): PacmanSource {
    const parsed = this.parsePacmanConfig(repo.configContent)
    const name = parsed?.name ?? lastPathSegment(repo.baseUrl)
    let url = (parsed?.url ?? repo.baseUrl).replace(/\$repo/g, name)

    if (url.includes('$arch')) {
      const arch = repo.distros?.[0]?.arch
      if (!arch) {
        throw new Error(
          `The server of ${repo.name} names $arch, which no served distribution states`,
        )
      }
      url = url.replace(/\$arch/g, arch)
    }

    return { name, url: url.replace(/\/+$/, '') }
  }

  /**
   * The first section of a pacman configuration that names a server, since a repository is
   * configured by one section of it.
   */
  private parsePacmanConfig(configContent: string | null): { name: string; url: string } | null {
    if (!configContent) return null

    let name: string | null = null
    for (const rawLine of configContent.split('\n')) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue

      const section = /^\[([^\]]+)\]$/.exec(line)
      if (section) {
        name = section[1].trim()
        continue
      }

      const server = /^Server\s*=\s*(\S+)/i.exec(line)
      if (server && name) return { name, url: server[1] }
    }

    return null
  }

  private async *extractDeb(
    repo: Repo,
    archOverride: string | null,
  ): AsyncGenerator<ExtractedPackage> {
    const sources = this.debSources(repo, archOverride)
    const seen = new Set<string>()

    for (const source of sources) {
      const indexUrls =
        source.suite === '.' || source.suite === './'
          ? [joinUrl(source.uri, 'Packages')]
          : source.components.map((component) =>
              joinUrl(
                source.uri,
                `dists/${source.suite}/${component}/binary-${source.arch}/Packages`,
              ),
            )

      for (const url of indexUrls) {
        // A suite publishes its index gzipped, but the update streams and the security archive of
        // Debian only carry the xz one. A suite with no index at all is simply empty, as apt also
        // treats it.
        const content =
          (await this.downloadText(`${url}.gz`, { optional: true })) ??
          (await this.downloadText(`${url}.xz`, { optional: true }))
        if (content === null) continue
        for (const stanza of parseDebStanzas(content)) {
          const version = splitDebVersion(stanza.Version)
          const arch = text(stanza.Architecture)
          const description = splitDebDescription(stanza.Description)
          const key = `${stanza.Package}|${stanza.Version}|${arch ?? ''}`
          if (seen.has(key)) continue
          seen.add(key)
          yield {
            type: 'deb',
            name: stanza.Package,
            version: version.version,
            release: version.release,
            arch: arch ? this.fromDebArch(arch) : null,
            license: text(stanza.License),
            summary: description.summary,
            description: description.description,
            downloadUrl: joinUrl(source.uri, stanza.Filename),
            checksum: stanza.SHA256 ?? stanza.SHA1 ?? stanza.MD5sum ?? null,
            checksumType: stanza.SHA256
              ? 'sha256'
              : stanza.SHA1
                ? 'sha1'
                : stanza.MD5sum
                  ? 'md5'
                  : null,
            size: this.readNumber(stanza.Size),
          }
        }
      }
    }
  }

  /**
   * Deb lines of the repository, applied to the architecture a sync was asked for (or the one the
   * source declares), so AppStream metadata can be located next to the packages. The architecture
   * is given in its platform form (`x86_64`) and mapped to the deb form (`amd64`).
   */
  debSources(repo: Repo, platformArch: string | null = null): ResolvedDebSource[] {
    const requestedArch = platformArch ? this.toDebArch(platformArch) : null
    const parsed = this.parseDebSources(repo.configContent)
    const matching = parsed.filter((source) => this.sameBase(source.uri, repo.baseUrl))
    const selected = matching.length > 0 ? matching : parsed

    if (selected.length === 0) {
      // No deb line available: assume a flat repository with Packages.gz at the root.
      return [
        {
          uri: repo.baseUrl.replace(/\/+$/, ''),
          suite: './',
          components: [],
          arch: requestedArch ?? 'amd64',
        },
      ]
    }

    return selected.map((source) => ({
      uri: source.uri.replace(/\/+$/, ''),
      suite: source.suite,
      components: source.components,
      arch: requestedArch ?? source.arch ?? 'amd64',
    }))
  }

  private parseDebSources(configContent: string | null): DebSource[] {
    if (!configContent) return []
    const sources: DebSource[] = []

    for (const rawLine of configContent.split('\n')) {
      const line = rawLine.trim()
      if (!line.startsWith('deb ')) continue

      let rest = line.slice(4).trim()
      let optionArch: string | null = null

      if (rest.startsWith('[')) {
        const end = rest.indexOf(']')
        if (end === -1) continue
        const options = rest.slice(1, end).split(/\s+/)
        rest = rest.slice(end + 1).trim()
        const archOption = options.find((option) => option.startsWith('arch='))
        optionArch = archOption?.slice('arch='.length).split(',')[0] ?? null
      }

      const [uri, suite, ...components] = rest.split(/\s+/)
      if (!uri || !suite) continue
      if (suite !== '.' && suite !== './' && components.length === 0) continue

      sources.push({ uri, suite, components, arch: optionArch })
    }

    return sources
  }

  private readChecksum(node: XmlChecksum): {
    checksum: string | null
    checksumType: string | null
  } {
    if (typeof node === 'string') return { checksum: text(node), checksumType: null }
    if (node) {
      return {
        checksum: text(node['#text']),
        checksumType: text(node['@_type']),
      }
    }
    return { checksum: null, checksumType: null }
  }

  private readNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  /**
   * Architecture of a package as Debian spells it. Only the architectures whose Debian name differs
   * from the platform one have to be listed (`s390x` and `riscv64` are the same in both).
   */
  private toDebArch(arch: string) {
    switch (arch) {
      case 'x86_64':
        return 'amd64'
      case 'aarch64':
        return 'arm64'
      case 'ppc64le':
        return 'ppc64el'
      default:
        return arch
    }
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

  private sameBase(uri: string, baseUrl: string) {
    const normalize = (value: string) => value.replace(/\/+$/, '').replace(/^https?:/, '')
    return normalize(uri) === normalize(baseUrl)
  }

  private async downloadText(url: string): Promise<string>
  private async downloadText(url: string, options: { optional: true }): Promise<string | null>
  private async downloadText(
    url: string,
    options: { optional?: boolean } = {},
  ): Promise<string | null> {
    if (/\.(zck|bz2)$/.test(url)) {
      throw new Error(`Unsupported repository metadata compression: ${url}`)
    }

    const data = options.optional
      ? await this.download(url, { optional: true })
      : await this.download(url)
    if (!data) return null

    const content = await decompress(data, compressionExtension(url))
    return content.toString('utf8')
  }

  /**
   * Read the elements of a metadata document one at a time, decompressing it on the way. Everything
   * this extractor reads from such a document is a package of its own.
   */
  private async *eachMetadataElement(url: string, tag: string): AsyncGenerator<string> {
    const data = await this.download(url)
    yield* eachXmlElement(decompressStream(data, compressionExtension(url)), tag)
  }

  private async download(url: string): Promise<Buffer>
  private async download(url: string, options: { optional: true }): Promise<Buffer | null>
  private async download(
    url: string,
    options: { optional?: boolean } = {},
  ): Promise<Buffer | null> {
    try {
      const response = await xior.get<ArrayBuffer>(url, {
        responseType: 'arraybuffer',
        headers: requestHeaders,
      })
      const data = Buffer.from(response.data)
      // A path a repository does not have may be answered with an HTML page instead of a 404, which
      // is not the metadata this asked for and is read as the same as the file being absent
      if (options.optional && !isCompression(data, compressionExtension(url))) return null
      return data
    } catch (error) {
      const status = isXiorError(error) ? error.response?.status : undefined
      if (options.optional && (status === 404 || status === 410)) return null
      throw new Error(`Unable to download ${url}${status ? ` (${status})` : ''}`, {
        cause: error,
      })
    }
  }
}
