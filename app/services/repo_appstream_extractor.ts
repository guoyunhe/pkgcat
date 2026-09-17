import { basename } from 'node:path'
import type { Readable } from 'node:stream'

import {
  DEFAULT_LOCALE,
  parseAppStreamComponent,
  type Component,
  type ComponentType,
  type Localized,
  type RichText,
  type UrlType,
} from '@guoyunhe/appstream'
import { XMLBuilder, XMLParser } from 'fast-xml-parser'
import sharp from 'sharp'
import xior, { isXiorError } from 'xior'
import { parse as parseYaml } from 'yaml'

import Pkg from '#models/pkg'
import type Repo from '#models/repo'
import PackageFileExtractor, { normalizePackagePath } from '#services/package_file_extractor'
import RepoPackageExtractor from '#services/repo_package_extractor'
import type { ResolvedDebSource, RepoPackageType } from '#services/repo_package_extractor'
import {
  compressionExtension,
  compressionOf,
  decompress,
  decompressChunks,
  decompressStream,
  isCompression,
} from '#utils/compression'
import { decodeJpegXl, isJpegXl } from '#utils/jxl'
import { collectGarbage } from '#utils/memory'
import { pacmanFileListName, pacmanFileListSuffix } from '#utils/pacman'
import { collectChunks } from '#utils/streams'
import { eachTarEntry, readTarEntries } from '#utils/tar'
import { eachXmlElement } from '#utils/xml'

/** Icon of a component, named the way the AppStream icon archive stores it. */
export type AppstreamIcon = {
  name: string
  width: number | null
  height: number | null
}

/** Parts of the file list a repository publishes, which is scanned as bytes instead of as XML. */
const filelistPackageTag = Buffer.from('<package')
const filelistPackageClose = Buffer.from('</package>')
const filelistFileTag = Buffer.from('<file')
const filelistFileClose = Buffer.from('</file>')
const filelistNameAttribute = /\bname="([^"]*)"/
const tagEndByte = 0x3e
/**
 * Length of the text that is kept when a tag is split between two chunks: a tag of the document may
 * begin with any of them, and the longest is `</package>`.
 */
const filelistTagOverlap =
  Math.max(
    filelistPackageTag.length,
    filelistPackageClose.length,
    filelistFileTag.length,
    filelistFileClose.length,
  ) - 1
/** Longest path a file list may name; anything longer is not a metadata file. */
const filelistPathLimit = 4096
/** Bytes of a file list that are scanned before the garbage collector is asked to run. */
const filelistCollectionInterval = 4 * 1024 * 1024

/**
 * An AppStream component a repository publishes, together with the XML it was read from and the
 * icons the repository icon archive may hold for it.
 */
export type ExtractedApp = {
  /** Component ID, without the legacy `.desktop` suffix older catalogs identify it by. */
  appstreamId: string
  /** Component metadata, as `@guoyunhe/appstream` parsed it. */
  component: Component
  /** AppStream XML of the component, stored as `appstreamContent`. */
  content: string
  /** Icons declared by the metadata, largest first. */
  icons: AppstreamIcon[]
}

/** An application together with the icon its package installs, when it ships a matching one. */
export type PackagedApp = {
  app: ExtractedApp
  icon: Buffer | null
}

/** Package a metadata file is read from, which the synchronization reads from the catalog. */
export type PackagedSource = {
  type: RepoPackageType
  name: string
  downloadUrl: string | null
}

/** An AppStream component a package announces through its file list, without any metadata. */
export type InferredComponent = {
  appstreamId: string
  /** Repository packages that ship the component metadata file, with its path inside the package. */
  files: Array<{ pkgName: string; path: string }>
}

/** AppStream component types that describe an application users can install. */
export const desktopAppTypes: ComponentType[] = ['desktop', 'desktop-application']

/**
 * Component type an application is stored under. `desktop` is the name AppStream used before the
 * type was split into `desktop-application` and its siblings, and it is not a type of the
 * specification any more, so catalogs that still announce it are stored under the modern name.
 */
export function canonicalAppType(type: ComponentType): ComponentType {
  return type === 'desktop' ? 'desktop-application' : type
}

/** Identity of an icon inside the icon archive, e.g. `128x128/app.png`. */
export function iconKey(icon: AppstreamIcon) {
  return `${icon.width ?? 0}x${icon.height ?? 0}/${icon.name}`
}

/** Latest version the component announces (`<releases><release/>`), or `null` when it has none. */
export function appstreamVersion(component: Component) {
  return component.releases?.items[0]?.version.trim() || null
}

/** Homepage the component declares, or `null` when it declares none. */
export function appstreamHomepage(component: Component) {
  return component.urls.find((url) => url.type === 'homepage')?.url.trim() || null
}

/** Directories packages store their AppStream metadata file in. */
const appstreamFileDirectories = ['/usr/share/metainfo/', '/usr/share/appdata/']

/** Directory both of them sit in, which a file list is narrowed down by before its paths are read. */
const appstreamFileRoot = '/usr/share/'

/** Suffixes of an AppStream metadata file; the rest of the file name is the AppStream ID. */
const appstreamFileSuffixes = ['.metainfo.xml', '.appdata.xml']

/**
 * Whether the bytes read so far can still become the path of a metadata file. A file list names
 * every file of the repository, so a path is only turned into a string when it is one of the
 * directories AppStream metadata lives in.
 */
function startsWithAppstreamDirectory(path: Buffer) {
  let start = 0
  while (start < path.length && path[start] !== 0x2f) {
    if (
      path[start] !== 0x20 &&
      path[start] !== 0x09 &&
      path[start] !== 0x0a &&
      path[start] !== 0x0d
    ) {
      return false
    }
    start += 1
  }

  return appstreamFileDirectories.some((directory) => {
    for (let index = 0; start + index < path.length && index < directory.length; index++) {
      if (path[start + index] !== directory.charCodeAt(index)) return false
    }
    return true
  })
}

/**
 * Component ID of a component. Legacy `appdata.xml` files identified a component by the name of its
 * desktop file, so the `.desktop` suffix they carry is dropped; modern IDs cannot have it.
 */
export function canonicalAppstreamId(id: string) {
  return id.endsWith('.desktop') ? id.slice(0, -'.desktop'.length) : id
}

/** Whether two component IDs name the same component. */
function isSameAppstreamId(left: string, right: string) {
  return canonicalAppstreamId(left) === canonicalAppstreamId(right)
}

/**
 * Component IDs a stored application may carry: the canonical one and the legacy `.desktop` form,
 * which older catalogs identify a component by.
 */
export function appstreamIdVariants(id: string) {
  const canonical = canonicalAppstreamId(id)
  return canonical === id ? [id, `${id}.desktop`] : [id, canonical]
}

/**
 * Key a component ID is looked up under. Catalogs spell the same identifier with different casing
 * (`org.naev.Naev` against `org.naev.naev`), and the database compares the unique `appstream_id`
 * column case-insensitively, so the lookups that decide between insert and update have to as well.
 */
export function appstreamIdKey(id: string) {
  return canonicalAppstreamId(id).toLowerCase()
}

/**
 * AppStream ID carried by a metadata file path. Packages name their application in the file name,
 * so `/usr/share/metainfo/org.videolan.vlc.appdata.xml` declares `org.videolan.vlc`. Paths that are
 * not AppStream metadata return `null`.
 */
function appstreamFileId(path: string): string | null {
  const trimmed = path.trim()
  if (!appstreamFileDirectories.some((directory) => trimmed.startsWith(directory))) return null

  const name = basename(trimmed)
  for (const suffix of appstreamFileSuffixes) {
    if (!name.endsWith(suffix)) continue
    const id = name.slice(0, -suffix.length).trim()
    return id ? canonicalAppstreamId(id) : null
  }
  return null
}

/** Debian AppStream icon archives, largest first. */
const debIconArchives = [
  'icons-128x128@2.tar.gz',
  'icons-128x128.tar.gz',
  'icons-64x64@2.tar.gz',
  'icons-64x64.tar.gz',
  'icons-48x48@2.tar.gz',
  'icons-48x48.tar.gz',
]

const requestHeaders = { Accept: '*/*', 'User-Agent': 'curl/8.0' }

/**
 * Icon of a DEP-11 component, as the YAML documents of deb repositories declare it. The sizes are
 * `unknown` because YAML has no types of its own: they are read as numbers where they are used.
 */
type Dep11Icon = {
  name?: unknown
  width?: unknown
  height?: unknown
}

/**
 * Component of a DEP-11 document (`Components-<arch>.yml.gz`). DEP-11 carries the AppStream catalog
 * metadata in YAML instead of XML, and names its fields differently.
 */
type Dep11Record = {
  Type?: ComponentType
  ID?: string
  Package?: string
  ProjectLicense?: string
  Name?: Localized<string>
  Summary?: Localized<string>
  Description?: Localized<RichText>
  Icon?: { cached?: Dep11Icon | Dep11Icon[] }
  Categories?: string | string[]
  Url?: Partial<Record<UrlType, string>>
  /**
   * Releases of the component. DEP-11 is YAML, so a version is only text when the document writes
   * it as text: `49.0` written unquoted is the number `49` to a YAML parser.
   */
  Releases?: { version?: unknown } | Array<{ version?: unknown }>
}

/**
 * DEP-11 value as the text the format declares it to be. A document that writes a value the YAML
 * parser reads as another type (see `parseDep11`) is coerced rather than dropped, and a value that
 * carries no text at all is left out by returning an empty string.
 */
function dep11Text(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'bigint') return String(value)
  return ''
}

/** DEP-11 value as the number the format declares it to be, or `null` when it holds none. */
function dep11Number(value: unknown): number | null {
  const text = dep11Text(value)
  if (!text) return null

  const parsed = Number(text)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * DEP-11 keys untranslated values by `C`; AppStream leaves `xml:lang` off them, which
 * `@guoyunhe/appstream` reports as `DEFAULT_LOCALE`. Both become the same key.
 */
function dep11Localized(values: Localized<string> | undefined): Localized<string> {
  const localized: Localized<string> = {}
  for (const [locale, value] of Object.entries(values ?? {})) {
    const trimmed = dep11Text(value)
    if (trimmed) localized[locale === 'C' ? DEFAULT_LOCALE : locale] = trimmed
  }
  return localized
}

/** DEP-11 stores the categories as a YAML list, or as a single string for one category. */
function dep11Categories(value: string | string[] | undefined): string[] {
  if (!value) return []
  const codes = (Array.isArray(value) ? value : [value])
    .map((code) => (typeof code === 'string' ? code.trim() : ''))
    .filter((code) => code !== '')
  return [...new Set(codes)]
}

/** Version of the release DEP-11 announces first, or `null` when it announces none. */
function dep11Version(record: Dep11Record) {
  const releases = record.Releases
  const release = Array.isArray(releases) ? releases[0] : releases
  return dep11Text(release?.version) || null
}

/** Icons DEP-11 declares as cached, which name a file in the AppStream icon archive. */
function dep11Icons(record: Dep11Record): Array<Dep11Icon & { name: string }> {
  const cached = record.Icon?.cached
  return (Array.isArray(cached) ? cached : [cached])
    .filter((icon) => dep11Text(icon?.name) !== '')
    .map((icon) => ({
      name: dep11Text(icon?.name),
      width: dep11Number(icon?.width),
      height: dep11Number(icon?.height),
    }))
}

/**
 * Icons the component declares, largest first. A cached icon names a file in the AppStream icon
 * archive, while a stock icon names a themed icon; both are kept so that the icon can also be found
 * inside the package, which is where repositories without a catalog keep it.
 */
function declaredIcons(component: Component): AppstreamIcon[] {
  const icons: AppstreamIcon[] = []

  for (const icon of component.icons) {
    if (icon.type !== undefined && icon.type !== 'cached' && icon.type !== 'stock') continue
    icons.push({
      name: icon.type === 'cached' ? basename(icon.value) : icon.value,
      width: icon.width ?? null,
      height: icon.height ?? null,
    })
  }

  return icons.sort((a, b) => iconSize(b) - iconSize(a))
}

/** Extracted app of a parsed component, with the XML it was read from. */
function toExtractedApp(component: Component, content: string): ExtractedApp {
  return {
    appstreamId: canonicalAppstreamId(component.id),
    component,
    content,
    icons: declaredIcons(component),
  }
}

export default class RepoAppstreamExtractor {
  /** Parser for the repository metadata that is not AppStream, such as `repodata/repomd.xml`. */
  private xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (tagName) => tagName === 'data',
  })

  private xmlBuilder = new XMLBuilder({
    attributeNamePrefix: '@_',
    format: true,
    ignoreAttributes: false,
    suppressEmptyNode: true,
  })

  /**
   * Read the AppStream metadata a repository publishes. Returns an empty list for repositories that
   * do not carry any (many third party repositories only ship packages).
   */
  async extract(repo: Repo, options: { arch?: string } = {}): Promise<ExtractedApp[]> {
    if (repo.type === 'rpm') return this.extractRpm(repo)
    if (repo.type === 'deb') return this.extractDeb(repo, options.arch ?? null)
    if (repo.type === 'pacman') return this.extractPacman(repo)

    return []
  }

  /**
   * Read the requested icons from the icon archive of the repository. Icons are matched on their
   * file name and, when the archive stores several sizes in separate directories (an rpm icon
   * archive, and the catalog package of a pacman repository), on the declared size. A pacman icon
   * is a JPEG XL file, which is decoded into a PNG the catalog can store.
   */
  async readIcons(repo: Repo, icons: AppstreamIcon[]): Promise<Map<string, Buffer>> {
    const wanted = new Map(icons.map((icon) => [iconKey(icon), icon]))
    const result = new Map<string, Buffer>()
    if (wanted.size === 0) return result

    for (const url of await this.iconArchiveUrls(repo)) {
      const archive = await this.download(url, { optional: true })
      if (!archive) continue

      const entries = await readTarEntries(await decompress(archive, compressionExtension(url)))
      for (const [key, icon] of wanted) {
        if (result.has(key)) continue
        const entry = this.findIconEntry(entries, key, icon)
        if (entry) result.set(key, isJpegXl(entry) ? await decodeJpegXl(entry) : entry)
      }

      if (result.size === wanted.size) break
    }

    return result
  }

  private findIconEntry(
    entries: Array<{ name: string; data: Buffer }>,
    key: string,
    icon: AppstreamIcon,
  ) {
    const exact = entries.find((entry) => entry.name === key)
    if (exact) return exact.data

    const candidates = entries.filter((entry) => basename(entry.name) === icon.name)
    if (candidates.length === 0) return null

    const size = `${icon.width}x${icon.height}`
    const sized = candidates.find(
      (entry) => entry.name.startsWith(`${size}/`) || entry.name.includes(`/${size}/`),
    )
    if (sized) return sized.data

    return candidates.reduce((largest, entry) =>
      entry.data.length > largest.data.length ? entry : largest,
    ).data
  }

  /**
   * Read the AppStream catalog of a pacman repository. The catalog of one repository is
   * `/usr/share/swcatalog/xml/<repository>.xml.gz` inside the catalog package of the repository,
   * next to the icons of the components.
   */
  private async extractPacman(repo: Repo): Promise<ExtractedApp[]> {
    const name = new RepoPackageExtractor().pacmanSource(repo).name
    const url = await this.pacmanCatalogPackageUrl(repo)
    if (!url) return []

    const apps: ExtractedApp[] = []
    const stream = await this.downloadStream(url)
    try {
      const archive = decompressChunks(stream, compressionExtension(url))
      for await (const entry of eachTarEntry(archive)) {
        if (!isPacmanCatalog(entry.name, name)) continue

        const content = await collectChunks(entry.data)
        // The catalog holds every component of the repository in one document, so the components are
        // read one at a time, keeping the XML each was read from
        const xml = decompressStream(content, compressionOf(content))
        for await (const element of eachXmlElement(xml, 'component')) {
          const component = parseAppStreamComponent(element)
          if (component) apps.push(toExtractedApp(component, element))
        }
      }
    } finally {
      stream.destroy()
    }

    return apps
  }

  /**
   * Package a pacman repository publishes its AppStream catalog in: `archlinux-appstream-data` (and
   * its counterparts), which is rebuilt with every catalog, so its file name carries the date of
   * the rebuild. That is why the package is looked up among the packages the synchronization stored
   * of the repository instead of being built from a name; a repository that publishes no such
   * package carries no catalog at all.
   */
  private async pacmanCatalogPackageUrl(repo: Repo) {
    const dataPackage = await Pkg.query()
      .where('repoId', repo.id)
      .whereILike('name', '%appstream-data')
      .orderBy('id', 'desc')
      .select('id', 'downloadUrl')
      .first()

    return dataPackage?.downloadUrl ?? null
  }

  private async extractRpm(repo: Repo): Promise<ExtractedApp[]> {
    const hrefs = await this.repomdHrefs(repo)
    const appdata = hrefs.get('appdata')
    if (!appdata) return []

    // A catalog holds every component of the repository in one document, which is several times
    // larger than the components the extractor returns — the one of openSUSE Tumbleweed unpacks to
    // 31 MB — so the components are read one at a time, keeping the XML each was read from
    const apps: ExtractedApp[] = []
    const elements = this.eachMetadataElement(joinUrl(repo.baseUrl, appdata), 'component')
    for await (const element of elements) {
      const component = parseAppStreamComponent(element)
      if (component) apps.push(toExtractedApp(component, element))
    }

    return apps
  }

  /**
   * AppStream components inferred from the file list of an RPM repository. Repositories that do not
   * publish AppStream metadata still name their applications in the files their packages ship:
   * `/usr/share/metainfo/<id>.metainfo.xml` carries the AppStream ID in its file name, which is
   * enough to link the packages to an application.
   */
  async inferredComponents(repo: Repo): Promise<InferredComponent[]> {
    if (repo.type === 'pacman') return this.inferredPacmanComponents(repo)
    if (repo.type !== 'rpm') return []

    const hrefs = await this.repomdHrefs(repo)
    const filelists = hrefs.get('filelists')
    if (!filelists) return []

    const components = new Map<string, Map<string, string>>()
    const files = this.eachAppstreamFile(joinUrl(repo.baseUrl, filelists))
    for await (const file of files) {
      const appstreamId = appstreamFileId(file.path)
      if (!appstreamId) continue

      const byPkg = components.get(appstreamId) ?? new Map<string, string>()
      byPkg.set(file.pkgName, file.path)
      components.set(appstreamId, byPkg)
    }

    return [...components].map(([appstreamId, paths]) => ({
      appstreamId,
      files: [...paths].map(([pkgName, path]) => ({ pkgName, path })),
    }))
  }

  /**
   * AppStream components inferred from the file list of a pacman repository. The file list
   * (`<repo>.files`) is one compressed tar holding the files of every package of the repository,
   * one entry per package, which names its metadata files the same way an RPM file list does. The
   * entries of one package are small, so each of them is read as it is reached instead of being
   * scanned byte by byte.
   */
  private async inferredPacmanComponents(repo: Repo): Promise<InferredComponent[]> {
    const source = new RepoPackageExtractor().pacmanSource(repo)
    const data = await this.download(joinUrl(source.url, `${source.name}.files`), {
      optional: true,
    })
    if (!data) return []

    const components = new Map<string, Map<string, string>>()
    const archive = decompressStream(data, compressionOf(data))
    for await (const entry of eachTarEntry(archive)) {
      if (!entry.name.endsWith(pacmanFileListSuffix)) continue

      const pkgName = pacmanFileListName(entry.name.slice(0, -pacmanFileListSuffix.length))
      const content = await collectChunks(entry.data)
      for (const line of content.toString('utf8').split('\n')) {
        const named = line.trim()
        // The document names the files of a package under a `%FILES%` header, one path per line,
        // without the leading separator an rpm file list carries
        if (!named || named.startsWith('%')) continue

        const path = named.startsWith('/') ? named : `/${named}`
        if (!path.startsWith(appstreamFileRoot)) continue

        const appstreamId = appstreamFileId(path)
        if (!appstreamId) continue

        const byPkg = components.get(appstreamId) ?? new Map<string, string>()
        byPkg.set(pkgName, path)
        components.set(appstreamId, byPkg)
      }
    }

    return [...components].map(([appstreamId, paths]) => ({
      appstreamId,
      files: [...paths].map(([pkgName, path]) => ({ pkgName, path })),
    }))
  }

  /**
   * Read the metadata file paths a file list names, together with the package that ships each of
   * them. The file list names every file of every package of the repository in one document, which
   * unpacks to hundreds of megabytes — 625 MB for AlmaLinux 8 `BaseOS`, 875 MB for Fedora 42 — so
   * the document is scanned as bytes while it is decompressed: neither the document nor the element
   * of one package ever becomes a string, which is what would take most of the memory of a
   * synchronization.
   */
  private async *eachAppstreamFile(url: string): AsyncGenerator<{ pkgName: string; path: string }> {
    const data = await this.download(url, { optional: true })
    if (!data) return

    const chunks = decompressStream(data, compressionExtension(url))
    // The text of the document is joined in buffers that are reused — one for the text that is
    // being scanned and one for the path that is being read — so that scanning a document of
    // hundreds of megabytes allocates neither for every piece of it nor for every file it names
    let carry = Buffer.alloc(0)
    let window = Buffer.alloc(0)
    let path = Buffer.alloc(0)
    let pathLength = 0
    let pkgName: string | null = null
    let readingPath = false
    let position = 0
    let collected = filelistCollectionInterval

    for await (const chunk of chunks) {
      const piece = chunk as Buffer
      const size = carry.length + piece.length
      if (window.length < size) {
        window = Buffer.allocUnsafe(Math.max(size, window.length * 2, 64 * 1024))
      }
      carry.copy(window, 0)
      piece.copy(window, carry.length)
      const buffer = window.subarray(0, size)
      let cursor = 0
      // End of the package that is being read: `null` while it has not been searched for in this
      // text, and `-1` when it was searched for and is not there
      let packageEnd: number | null = null

      while (true) {
        if (pkgName === null) {
          const start = buffer.indexOf(filelistPackageTag, cursor)
          if (start < 0) {
            cursor = Math.max(cursor, buffer.length - filelistTagOverlap)
            break
          }

          const end = buffer.indexOf(tagEndByte, start)
          if (end < 0) {
            cursor = start
            break
          }

          const attributes = buffer.subarray(start, end).toString('latin1')
          pkgName = filelistNameAttribute.exec(attributes)?.[1] ?? ''
          packageEnd = null
          cursor = end + 1
          continue
        }

        if (!readingPath) {
          const fileAt = buffer.indexOf(filelistFileTag, cursor)
          if (packageEnd === null) packageEnd = buffer.indexOf(filelistPackageClose, cursor)
          if (packageEnd >= 0 && (fileAt < 0 || packageEnd < fileAt)) {
            cursor = packageEnd + filelistPackageClose.length
            pkgName = null
            packageEnd = null
            continue
          }
          if (fileAt < 0) {
            cursor = Math.max(cursor, buffer.length - filelistTagOverlap)
            break
          }

          const end = buffer.indexOf(tagEndByte, fileAt)
          if (end < 0) {
            cursor = fileAt
            break
          }

          readingPath = true
          pathLength = 0
          cursor = end + 1
          continue
        }

        const end = buffer.indexOf(filelistFileClose, cursor)
        // The path is only read up to the end of its tag, so that a `</file>` split between two
        // chunks is still found in the text that arrives next
        const stop = end < 0 ? Math.max(cursor, buffer.length - filelistTagOverlap) : end
        const room = filelistPathLimit - pathLength
        const take = Math.min(stop - cursor, room)
        if (take > 0) {
          if (path.length < pathLength + take) {
            path = Buffer.allocUnsafe(Math.max(pathLength + take, path.length * 2))
          }
          buffer.copy(path, pathLength, cursor, cursor + take)
          pathLength += take
        }
        cursor = stop
        if (end < 0) break

        readingPath = false
        cursor = end + filelistFileClose.length
        // The path only becomes a string when it names a metadata file, which the bytes tell
        const named = path.subarray(0, pathLength)
        if (pkgName && startsWithAppstreamDirectory(named)) {
          yield { pkgName, path: named.toString('utf8').trim() }
        }
      }

      // Text that has not been resolved yet, which a tag split between two chunks is found in
      const tail = buffer.subarray(cursor)
      if (carry.length < tail.length) carry = Buffer.allocUnsafe(tail.length)
      tail.copy(carry, 0)
      carry = carry.subarray(0, tail.length)

      // A document of hundreds of megabytes is read in thousands of pieces, whose memory is only
      // released when the garbage collector runs
      position += size
      if (position >= collected) {
        collectGarbage()
        collected = position + filelistCollectionInterval
      }
    }
  }

  /**
   * Read the AppStream metadata of an application from the metadata file its package ships.
   * Repositories that publish no AppStream catalog only carry the metadata inside the packages, so
   * the package itself is downloaded first and its payload is searched for the metadata file and,
   * when the metadata does not name a file in an icon archive, for the icon as well.
   */
  async readPackagedApp(
    pkg: PackagedSource,
    path: string,
    appstreamId: string,
  ): Promise<PackagedApp | null> {
    if (!pkg.downloadUrl) return null

    // The package is read while it is still being downloaded, because a package of a repository is
    // up to hundreds of megabytes against the few kilobytes of metadata it is read for
    const archive = await this.downloadStream(pkg.downloadUrl)
    let files: Map<string, Buffer>
    try {
      files = await new PackageFileExtractor().readMatchingFilesFromStream(pkg.type, archive, [
        path,
        ...packagedIconPatterns,
      ])
    } finally {
      archive.destroy()
    }

    const content = files.get(normalizePackagePath(path))
    if (!content) return null

    const xml = content.toString('utf8')
    const component = parseAppStreamComponent(xml)
    if (!component || !isSameAppstreamId(component.id, appstreamId)) return null

    return {
      app: toExtractedApp(component, xml),
      icon: await packagedIcon(files, declaredIcons(component), appstreamId, pkg.name),
    }
  }

  private async extractDeb(repo: Repo, archOverride: string | null): Promise<ExtractedApp[]> {
    const apps = new Map<string, ExtractedApp>()

    for (const target of this.debDep11Targets(repo, archOverride)) {
      const url = `${target.directory}/Components-${target.arch}.yml.gz`
      const content = await this.downloadText(url, { optional: true })
      if (!content) continue

      for (const app of this.parseDep11(content)) {
        if (!apps.has(app.appstreamId)) apps.set(app.appstreamId, app)
      }
    }

    return [...apps.values()]
  }

  /** `dists/<suite>/<component>/dep11` directories of a deb repository, with their architecture. */
  private debDep11Targets(repo: Repo, archOverride: string | null) {
    const packages = new RepoPackageExtractor()
    const sources: ResolvedDebSource[] = packages.debSources(repo, archOverride)
    const targets: Array<{ directory: string; arch: string }> = []

    for (const source of sources) {
      if (source.suite === '.' || source.suite === './') continue
      for (const component of source.components) {
        targets.push({
          directory: joinUrl(source.uri, `dists/${source.suite}/${component}/dep11`),
          arch: source.arch,
        })
      }
    }

    return targets
  }

  private async repomdHrefs(repo: Repo) {
    const hrefs = new Map<string, string>()
    const repomd = await this.downloadText(joinUrl(repo.baseUrl, 'repodata/repomd.xml'), {
      optional: true,
    })
    if (!repomd) return hrefs

    const parsed = this.xmlParser.parse(repomd) as {
      repomd?: { data?: Array<{ '@_type'?: string; location?: { '@_href'?: string } }> }
    }
    for (const entry of parsed.repomd?.data ?? []) {
      const href = entry.location?.['@_href']
      if (entry['@_type'] && href) hrefs.set(entry['@_type'], href)
    }
    return hrefs
  }

  private async iconArchiveUrls(repo: Repo) {
    // A pacman repository publishes the icons of its catalog as JPEG XL files of the catalog
    // package, next to the catalog itself
    if (repo.type === 'pacman') {
      const url = await this.pacmanCatalogPackageUrl(repo)
      return url ? [url] : []
    }

    if (repo.type === 'rpm') {
      const hrefs = await this.repomdHrefs(repo)
      const href = hrefs.get('appdata-icons')
      return href ? [joinUrl(repo.baseUrl, href)] : []
    }

    const directories = this.debDep11Targets(repo, null).map((target) => target.directory)
    const urls: string[] = []
    for (const archive of debIconArchives) {
      for (const directory of directories) urls.push(`${directory}/${archive}`)
    }
    return urls
  }

  /**
   * DEP-11 documents are separated by `---`, so each component is parsed on its own. DEP-11 is
   * YAML, so the record is written back into AppStream XML and parsed with `@guoyunhe/appstream`,
   * which keeps the stored `appstreamContent` and the extracted metadata in sync.
   *
   * The documents are read with the `failsafe` schema, which reads every scalar as the text the
   * format declares it to be: the default schema turns a version upstream announces as `49.0` into
   * the number `49`, losing the rest of it.
   */
  private parseDep11(content: string): ExtractedApp[] {
    const apps: ExtractedApp[] = []

    for (const document of content.split(/\n---\n/)) {
      if (!document.includes('ID:') || document.includes('File: DEP-11')) continue

      const record = parseYaml(document, { schema: 'failsafe' }) as Dep11Record | null
      if (!record?.ID) continue

      const xml = this.dep11Xml(record)
      const component = parseAppStreamComponent(xml)
      if (component) apps.push(toExtractedApp(component, xml))
    }

    return apps
  }

  /**
   * The package detail page reads `appstreamContent` as AppStream XML, so the DEP-11 fields are
   * written back into that shape.
   */
  private dep11Xml(record: Dep11Record) {
    const localizedNodes = (values: Localized<string> | undefined) => {
      const entries = Object.entries(dep11Localized(values))
      return entries.length === 0
        ? undefined
        : entries.map(([locale, value]) => ({ '#text': value, '@_xml:lang': locale }))
    }

    const categories = dep11Categories(record.Categories)
    const version = dep11Version(record)
    const icon = dep11Icons(record)

    const component: Record<string, unknown> = {
      '@_type': record.Type ?? 'desktop-application',
      id: canonicalAppstreamId(record.ID ?? ''),
      pkgname: record.Package,
      name: localizedNodes(record.Name),
      summary: localizedNodes(record.Summary),
      description: localizedNodes(record.Description),
      project_license: record.ProjectLicense,
      categories: categories.length > 0 ? { category: categories } : undefined,
      url: record.Url?.homepage
        ? { '#text': record.Url.homepage, '@_type': 'homepage' }
        : undefined,
      releases: version ? { release: { '@_version': version } } : undefined,
      icon:
        icon.length > 0
          ? icon.map((entry) => ({
              '#text': entry.name,
              '@_type': 'cached',
              '@_width': entry.width ?? undefined,
              '@_height': entry.height ?? undefined,
            }))
          : undefined,
    }

    for (const [key, value] of Object.entries(component)) {
      if (value === undefined || value === null || value === '') delete component[key]
    }

    return `${this.xmlBuilder.build({ component })}\n`
  }

  private async downloadText(url: string, options: { optional?: boolean } = {}) {
    const data = await this.download(url, options)
    if (!data) return null

    const content = await decompress(data, compressionExtension(url))
    return content.toString('utf8')
  }

  /**
   * Read the elements of a metadata document of a repository one at a time, decompressing it on the
   * way, so that a document that is too large to be held as a whole can still be read.
   */
  private async *eachMetadataElement(url: string, tag: string): AsyncGenerator<string> {
    const data = await this.download(url, { optional: true })
    if (!data) return
    yield* eachXmlElement(decompressStream(data, compressionExtension(url)), tag)
  }

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
      throw new Error(`Unable to download ${url}${status ? ` (${status})` : ''}`, { cause: error })
    }
  }

  /** Read a file of a repository without holding it in memory, which packages are read through. */
  private async downloadStream(url: string): Promise<Readable> {
    try {
      const response = await xior.get<Readable>(url, {
        responseType: 'stream',
        headers: requestHeaders,
      })
      return response.data
    } catch (error) {
      const status = isXiorError(error) ? error.response?.status : undefined
      throw new Error(`Unable to download ${url}${status ? ` (${status})` : ''}`, { cause: error })
    }
  }
}

function iconSize(icon: AppstreamIcon) {
  return Math.min(icon.width ?? 0, icon.height ?? 0)
}

/** Whether a path inside a pacman package is the AppStream catalog of a repository. */
function isPacmanCatalog(path: string, name: string) {
  const catalog = `usr/share/swcatalog/xml/${name}.xml`
  return path === catalog || path === `${catalog}.gz`
}

/** Extensions of icons that can be stored as an image, tried when the metadata names a themed icon. */
const iconFileExtensions = ['.png', '.svg']

/** Directories a package installs its icons in, searched when the metadata names the icon file. */
const packagedIconPatterns = ['/usr/share/icons/**/apps/*', '/usr/share/pixmaps/*']

type IconCandidate = { data: Buffer; vector: boolean; pixels: number }

/**
 * Icon of a component inside the package payload. The metadata names either the icon file or a
 * themed icon, and packages also name the icon after the application, so those names are matched
 * against the icons the package installs, whether it puts them in a themed directory or in the
 * shared `/usr/share/pixmaps` one.
 */
async function packagedIcon(
  files: Map<string, Buffer>,
  icons: AppstreamIcon[],
  appstreamId: string,
  pkgName: string,
): Promise<Buffer | null> {
  const wanted = iconBaseNames(icons, appstreamId, pkgName)
  let best: IconCandidate | null = null

  for (const [path, data] of files) {
    if (!wanted.has(basename(path).toLowerCase())) continue

    const pixels = await iconPixels(data)
    if (pixels === null) continue

    const candidate = { data, vector: path.toLowerCase().endsWith('.svg'), pixels }
    if (!best || isBetterIcon(candidate, best)) best = candidate
  }

  return best?.data ?? null
}

/** Vector icons win because they scale, then the icon with more pixels, then the larger file. */
function isBetterIcon(candidate: IconCandidate, best: IconCandidate) {
  if (candidate.vector !== best.vector) return candidate.vector
  if (candidate.pixels !== best.pixels) return candidate.pixels > best.pixels
  return candidate.data.length > best.data.length
}

/**
 * Pixels an icon covers, read from the image itself. Measuring keeps the icons that carry no size
 * in their path, such as the ones in `/usr/share/pixmaps`, comparable with the icons stored in a
 * sized themed directory. Data that is not an image, a symlink for example, has no size.
 */
async function iconPixels(data: Buffer): Promise<number | null> {
  try {
    const { width, height } = await sharp(data).metadata()
    return width && height ? width * height : null
  } catch {
    return null
  }
}

/** File names the icon may have, taken from the metadata and from the application name. */
function iconBaseNames(icons: AppstreamIcon[], appstreamId: string, pkgName: string) {
  const names = new Set<string>()
  const add = (name: string | null | undefined) => {
    const base = basename(name?.trim() ?? '').toLowerCase()
    if (!base) return

    names.add(base)
    if (iconFileExtensions.some((extension) => base.endsWith(extension))) return
    for (const extension of iconFileExtensions) names.add(`${base}${extension}`)
  }

  for (const icon of icons) add(icon.name)
  // An application is named either by its full AppStream ID, which is also the name of its desktop
  // file and often of its icon, or by the last segment of that ID.
  add(appstreamId)
  add(appstreamId.split('.').pop())
  add(pkgName)
  return names
}

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}
