import { setTimeout as delay } from 'node:timers/promises'

import xior, { isXiorError } from 'xior'

import env from '#start/env'

/** Release of the catalog a repository of the build service is built for. */
export type ObsRelease = {
  name: string
  version: string | null
}

/** Repository the openSUSE Build Service publishes, read from its API. */
export type ObsRepository = {
  /** Project that builds and publishes the repository. */
  project: string
  /** Repository of the project, which the build service names after the release it is built for. */
  repository: string
  /** URL the repository is published under. */
  baseUrl: string
  /** Architectures the repository carries packages for. */
  arches: string[]
  /** Configuration file of the repository, which zypper reads. */
  configUrl: string
  /** Who publishes the repository. */
  source: string
  /** Releases of the catalog the repository is built for, which more than one name may stand for. */
  releases: ObsRelease[]
}

/** State of an import from the build service, which is reported while it runs. */
export type ObsProgress = {
  /** Repository names of the build service that stand for a release of the catalog. */
  names: number
  /** Repositories the publish area carries for them. */
  repositories: number
  /** Repositories whose published files were read. */
  read: number
  /** Lookups that failed, whose repositories are missing from the import. */
  failures: number
}

export type ObsImportOptions = {
  /**
   * Project to read instead of the whole service, e.g. `home:guoyunhe`; the projects nested under
   * it are read as well.
   */
  project?: string
  /** Number of requests sent at the same time. */
  concurrency?: number
  onRepository: (repository: ObsRepository) => Promise<void>
  /** Called for a repository name that stands for releases and carries published repositories. */
  onReleases?: (releases: ObsRelease[]) => void
  /** Releases the caller takes repositories for; a name of another one is only reported. */
  takesReleases?: (releases: ObsRelease[]) => boolean
  /**
   * Called for every published repository whose files were read, with its path in the download
   * tree.
   */
  onRead?: (path: string) => void
  onProgress?: (progress: ObsProgress) => void
  /** Called for a lookup that failed, which leaves repositories out of the import. */
  onFailure?: (url: string, error: unknown) => void
}

/** Where the API of the build service answers, which every read of an import goes through. */
const apiRoot = 'https://api.opensuse.org'

/** Where the build service publishes the repositories, which the catalog syncs packages from. */
const downloadRoot = 'https://download.opensuse.org/repositories/'

/** Published repositories one lookup of a repository name reads at once. */
const publishedLimit = 10000

/**
 * Namespaces left out of the import. The projects under them build the releases of the
 * distributions themselves, which the catalog does not take its repositories from.
 */
const ignoredNamespaces = ['openSUSE', 'Debian', 'Arch']

/**
 * Name the build service nests the projects of a package branch under (`home:someone:branches:*`).
 * A branch copies a package of another project, so it is not a project the catalog imports from.
 */
const branchDirectory = 'branches'

/** Headers a read of the API sends, which answers XML. */
const apiHeaders = { Accept: 'application/xml', 'User-Agent': 'curl/8.0' }

/** Headers a read of the download server sends, which carries the files of a repository. */
const downloadHeaders = { Accept: '*/*', 'User-Agent': 'curl/8.0' }

/**
 * Architectures a repository can be published for, which is also how its package directories are
 * named.
 */
const architectureNames = [
  'aarch64',
  'armv6l',
  'armv7l',
  'i586',
  'loongarch64',
  'ppc',
  'ppc64',
  'ppc64le',
  'riscv64',
  's390x',
  'x86_64',
]

/**
 * Releases of the catalog a repository name of the build service stands for, read from the
 * repository paths the build service shows for a project
 * (`https://build.opensuse.org/project/repositories/<project>`). A bare version number is the name
 * of a repository openSUSE Leap and SUSE Linux Enterprise of that version share, a service pack of
 * SUSE Linux Enterprise names the release of its series (`SLE_15_SP1` is 15.1), and the releases
 * the catalog does not carry are resolved to nothing rather than being linked to a release of
 * another series.
 */
function obsReleases(repository: string): ObsRelease[] {
  if (repository === 'openSUSE_Tumbleweed') {
    return [{ name: 'openSUSE Tumbleweed', version: null }]
  }

  const leap = repository.match(/^openSUSE_Leap_(\d+\.\d+)$/)
  if (leap) return [{ name: 'openSUSE Leap', version: leap[1] }]

  const servicePack = repository.match(/^SLE_(\d+)_SP(\d+)$/)
  if (servicePack) return sleReleases(`${servicePack[1]}.${servicePack[2]}`)

  const series = repository.match(/^SLE_(\d+)$/)
  if (series) return sleReleases(`${series[1]}.0`)

  const shared = repository.match(/^(\d+\.\d+)$/)
  if (shared) {
    return [{ name: 'openSUSE Leap', version: shared[1] }, ...sleReleases(shared[1])]
  }

  return []
}

function sleReleases(version: string): ObsRelease[] {
  return [{ name: 'SUSE Linux Enterprise', version }]
}

/** Repository the publish area carries under a repository name, before its files are read. */
type ObsPublishedRepository = {
  project: string
  repository: string
  baseUrl: string
  releases: ObsRelease[]
}

/** Repository the publish area reports for a repository name, as its search answers it. */
type ObsRepoInfo = {
  project: string
  repository: string
  /** URL the API says the repository is published under, which may lie beside the download tree. */
  downloadUrl: string | null
}

/** Reads a path of the build service API. */
type ObsReader = (path: string) => Promise<string>

/**
 * Read the repositories the build service publishes for the releases of the catalog. The API of the
 * build service answers this rather than its download tree being walked, which took an hour and
 * more for the whole service: the search reports every repository name of the service at once, and
 * the publish area tells which projects carry a repository under such a name, at which URL, and
 * which architectures it was published for. Only the repositories built for a release of the
 * catalog are reported, since the other ones could not be linked to anything the catalog holds.
 */
export async function eachObsRepository(options: ObsImportOptions): Promise<ObsProgress> {
  const read = obsReader()
  const concurrency = options.concurrency ?? 8
  const progress: ObsProgress = { names: 0, repositories: 0, read: 0, failures: 0 }

  // The repository names that stand for a release of the catalog are the only ones worth a lookup; a
  // name of a release the catalog does not carry is reported instead, so that it can be added to it
  const defined = await definedRepositoryNames(read)
  const names = defined.filter((name) => obsReleases(name).length > 0)
  progress.names = names.length

  // What the publish area carries under those names, which is where the projects that publish a
  // repository for a release of the catalog come from
  const published: ObsPublishedRepository[] = []
  await eachWithin(names, concurrency, async (name) => {
    let found: ObsRepoInfo[]
    try {
      found = await publishedRepositories(read, name)
    } catch (error) {
      progress.failures += 1
      options.onFailure?.(publishedLookup(name), error)
      return
    }

    const wanted = found.filter((entry) => wantedProject(options.project, entry.project))
    if (wanted.length === 0) return

    const releases = obsReleases(name)
    options.onReleases?.(releases)
    progress.repositories += wanted.length

    // A repository of a release the caller does not take could never be stored, so its files are
    // not read either; how many of them the service carries is still worth knowing
    if (options.takesReleases && !options.takesReleases(releases)) {
      options.onProgress?.(progress)
      return
    }

    for (const entry of wanted) {
      const baseUrl = publishUrl(entry.project, entry.repository)
      // A repository published beside the download tree cannot be synced from there, and the
      // download tree is what the path of a repository is known from
      if (!publishedUnder(entry.downloadUrl, baseUrl)) {
        progress.failures += 1
        options.onFailure?.(baseUrl, new Error(`Published at ${entry.downloadUrl ?? 'nowhere'}`))
        continue
      }

      published.push({
        project: entry.project,
        repository: entry.repository,
        baseUrl,
        releases,
      })
    }

    options.onProgress?.(progress)
  })

  // The architectures a repository was published for are the directories it carries, which is what a
  // release of the catalog is linked by
  await eachWithin(published, concurrency, async (entry) => {
    const address = publishedAddress(entry.project, entry.repository)
    let listed: string[]
    try {
      listed = parseEntries(await read(address))
    } catch (error) {
      progress.failures += 1
      options.onFailure?.(`${apiRoot}${address}`, error)
      return
    }

    progress.read += 1
    options.onRead?.(publishPath(entry.project, entry.repository))

    // A repository that cannot be stored must not end an import that has thousands of them left
    try {
      await options.onRepository({
        ...entry,
        configUrl: `${entry.baseUrl}${entry.project}.repo`,
        source: obsSource(entry.project),
        arches: listed.filter((name) => architectureNames.includes(name)),
      })
    } catch (error) {
      progress.failures += 1
      options.onFailure?.(entry.baseUrl, error)
      return
    }

    options.onProgress?.(progress)
  })

  return progress
}

/** Configuration file of a repository as the build service publishes it next to the packages. */
export async function obsRepoConfig(configUrl: string): Promise<string | null> {
  try {
    const content = await readText(configUrl, downloadHeaders)
    const trimmed = content.trim()
    return trimmed || null
  } catch {
    return null
  }
}

/**
 * Read a path of the API with the credentials of the environment, which the build service asks for
 * on all of its endpoints.
 */
function obsReader(): ObsReader {
  const user = env.get('OBS_USER')
  const password = env.get('OBS_PASSWORD')?.release()
  if (!user || !password) {
    throw new Error('Reading the build service needs OBS_USER and OBS_PASSWORD in the environment')
  }

  const credentials = Buffer.from(`${user}:${password}`).toString('base64')
  return (path) =>
    readText(`${apiRoot}${path}`, { ...apiHeaders, Authorization: `Basic ${credentials}` })
}

/** Repository names the build service defines anywhere, which its releases are picked out of. */
async function definedRepositoryNames(read: ObsReader): Promise<string[]> {
  const xml = await read('/search/repository/id?match=*')
  return [...new Set(attributeValues(xml, 'repository', 'name'))]
}

/** Address the publish area is asked at for the repositories that carry a repository name. */
function publishedLookup(repository: string) {
  const match = `repository='${repository}'`
  return `${apiRoot}/search/published/repoinfo/id?match=${match}&limit=${publishedLimit}`
}

/**
 * Repositories the publish area carries under a repository name, with the URL they are published
 * at.
 */
async function publishedRepositories(read: ObsReader, repository: string): Promise<ObsRepoInfo[]> {
  const match = `repository='${repository}'`
  const xml = await read(
    `/search/published/repoinfo/id?match=${match}&limit=${publishedLimit}&withdownloadurl=1`,
  )

  const head = xml.slice(0, xml.indexOf('>') + 1)
  if (attributeValue(head, 'limited') === 'true') {
    throw new Error(`More than ${publishedLimit} repositories carry the name`)
  }
  return parseRepoInfo(xml)
}

/** Path of a published repository within the API, which keeps the colons of a project name literal. */
function publishedAddress(project: string, repository: string) {
  const name = (value: string) => encodeURIComponent(value).replace(/%3A/g, ':')
  return `/published/${name(project)}/${name(repository)}`
}

/** Path of a project within the download tree, whose directories are its name up to the last colon. */
function projectPath(project: string) {
  const segments = project.split(':').filter(Boolean)
  return segments.map((segment, index) => (index < segments.length - 1 ? `${segment}:` : segment))
}

/** URL a repository of a project is published under, which the catalog syncs packages from. */
function publishUrl(project: string, repository: string) {
  return `${downloadRoot}${projectPath(project).join('/')}/${repository}/`
}

/** Path of a repository within the download tree, which is what an import is watched by. */
function publishPath(project: string, repository: string) {
  return `/${projectPath(project).join('/')}/${repository}/`
}

/** Whether a project lies in a namespace the catalog does not take repositories from. */
function ignoredProject(project: string) {
  const segments = project.split(':')
  return segments.length > 1 && ignoredNamespaces.includes(segments[0])
}

/** Whether a project belongs to a package branch, which copies a package of another project. */
function branchedProject(project: string) {
  return project.split(':').slice(0, -1).includes(branchDirectory)
}

/** Whether a project of the publish area is one the catalog takes its repositories from. */
function wantedProject(wanted: string | undefined, project: string) {
  if (wanted) {
    const scope = wanted.replace(/:+$/, '')
    // A scope names a project, or every project of a namespace when it ends with a colon, which is
    // how the download tree nests the projects
    if (wanted.endsWith(':')) {
      if (!project.startsWith(`${scope}:`)) return false
    } else if (project !== scope) {
      return false
    }

    // A branch below the scope is left out, unless the scope names one itself
    return !branchedProject(project.slice(scope.length + 1))
  }

  return !ignoredProject(project) && !branchedProject(project)
}

/** Whether a repository is published at the path the download tree holds for it. */
function publishedUnder(downloadUrl: string | null, expected: string) {
  if (!downloadUrl) return false

  try {
    const published = new URL(downloadUrl)
    const wanted = new URL(expected)
    // The API escapes characters the download tree spells out (`c_c++`), so the paths are compared
    // after decoding
    const path = decodeURIComponent(published.pathname)
    return published.host === wanted.host && path === wanted.pathname
  } catch {
    return false
  }
}

/** Who publishes a repository, which the namespace its project lives in names. */
function obsSource(project: string) {
  if (project.startsWith('home:')) return 'user'
  if (project.startsWith('isv:')) return 'vendor'
  return 'community'
}

/** Run a handler for every entry, with the given number of them at the same time. */
async function eachWithin<T>(
  entries: T[],
  concurrency: number,
  handler: (entry: T) => Promise<void>,
) {
  const queue = [...entries]
  const worker = async () => {
    for (let entry = queue.shift(); entry !== undefined; entry = queue.shift()) {
      await handler(entry)
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker))
}

/**
 * Read a file of the API or of the download server. Both are shared, so a request that fails on the
 * way (the connection, or an error of the server itself) is worth another try, while an answer that
 * says the file is not there is not.
 */
async function readText(
  url: string,
  headers: Record<string, string>,
  attempts = 3,
): Promise<string> {
  let failure: unknown
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await xior.get<string>(url, {
        headers,
        timeout: 30000,
      })
      return typeof response.data === 'string' ? response.data : ''
    } catch (error) {
      failure = error
      const status = isXiorError(error) ? error.response?.status : undefined
      if (status && status < 500) throw answerError(url, error)
      await delay(250 * attempt)
    }
  }
  throw failure
}

/** An answer that says no, which the summary the API writes about it explains better than the code. */
function answerError(url: string, error: unknown) {
  const body = isXiorError(error) ? error.response?.data : undefined
  const found = typeof body === 'string' ? body.match(/<summary>([\s\S]*?)<\/summary>/)?.[1] : ''
  const message = found ? found.replace(/\s+/g, ' ').trim() : `Unable to read ${url}`
  return new Error(message, { cause: error })
}

/** Names of the entries of a directory the API answers for. */
function parseEntries(xml: string) {
  return attributeValues(xml, 'entry', 'name')
}

/** Repositories the publish area reports, as its search writes them. */
function parseRepoInfo(xml: string): ObsRepoInfo[] {
  const found: ObsRepoInfo[] = []
  for (const match of xml.matchAll(/<repoinfo\b([^>]*)>/g)) {
    const project = attributeValue(match[1], 'project')
    const repository = attributeValue(match[1], 'repository')
    if (!project || !repository) continue

    found.push({
      project,
      repository,
      downloadUrl: attributeValue(match[1], 'downloadurl') ?? null,
    })
  }
  return found
}

/** Values of an attribute of every element of that name, which the API quotes either way. */
function attributeValues(xml: string, element: string, attribute: string) {
  const values: string[] = []
  for (const match of xml.matchAll(new RegExp(`<${element}\\b([^>]*)>`, 'g'))) {
    const value = attributeValue(match[1], attribute)
    if (value !== undefined) values.push(value)
  }
  return values
}

/** Value of an attribute of an element, or nothing when the element does not carry it. */
function attributeValue(attributes: string, name: string): string | undefined {
  return attributes.match(new RegExp(`\\b${name}=(['"])(.*?)\\1`))?.[2]
}
