import { setTimeout as delay } from 'node:timers/promises'

import xior, { isXiorError } from 'xior'

/** Release of the catalog a repository of the build service is built for. */
export type ObsRelease = {
  name: string
  version: string | null
}

/** Repository the openSUSE Build Service publishes, read from its public download tree. */
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
  /** Release of the catalog the repository is built for. */
  release: ObsRelease
}

/** State of a walk through the download tree, which is reported while it runs. */
export type ObsWalkProgress = {
  /** Directories read so far. */
  directories: number
  /** Repositories of a release of the catalog found so far. */
  repositories: number
  /** Listings that could not be read, and are therefore missing from the walk. */
  failures: number
}

export type ObsWalkOptions = {
  /** Project to read instead of the whole tree, e.g. `home:guoyunhe`. */
  project?: string
  /** Number of directory listings read at the same time. */
  concurrency?: number
  onRepository: (repository: ObsRepository) => Promise<void>
  onProgress?: (progress: ObsWalkProgress) => void
  /** Called for a listing that could not be read, which leaves its repositories out of the walk. */
  onFailure?: (url: string, error: unknown) => void
}

const downloadRoot = 'https://download.opensuse.org/repositories/'

/**
 * Namespaces left out of the walk. The projects under them build the releases of the distributions
 * themselves, which the catalog does not take its repositories from.
 */
const ignoredNamespaces = ['openSUSE:', 'Debian:', 'Arch:']

const requestHeaders = { Accept: '*/*', 'User-Agent': 'curl/8.0' }

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

/** Directories of a published repository that hold no further repository. */
const packageDirectoryNames = [...architectureNames, 'gpg', 'noarch', 'repodata', 'src']

const sle15: ObsRelease = { name: 'SUSE Linux Enterprise', version: '15.7' }
const leap16: ObsRelease = { name: 'openSUSE Leap', version: '16.0' }

/**
 * Releases of the catalog, keyed by the repository name the build service gives them. The names are
 * read from the repository paths the build service shows for a project
 * (`https://build.opensuse.org/project/repositories/<project>`), where a plain version number is
 * what it uses for openSUSE Leap (`16.0`) and for the 15 series of SUSE Linux Enterprise (`15.7`,
 * which is the service pack 7, since openSUSE Leap ends at 15.6).
 */
const obsReleases: Record<string, ObsRelease> = {
  openSUSE_Tumbleweed: { name: 'openSUSE Tumbleweed', version: null },
  'openSUSE_Leap_16.0': leap16,
  '16.0': leap16,
  SLE_16: { name: 'SUSE Linux Enterprise', version: '16.0' },
  SLE_15: sle15,
  '15.7': sle15,
  // A service pack of a series installs what the release of the series installs, which is the one
  // the catalog carries
  ...Object.fromEntries(
    [1, 2, 3, 4, 5, 6, 7].map((servicePack) => [`SLE_15_SP${servicePack}`, sle15]),
  ),
}

type DirectoryEntry = { name: string; directory: boolean }

/**
 * Read the published repositories of the build service, which the download tree holds for every
 * project: the tree nests the projects by their name, and a directory that carries repository
 * metadata is one of them. Only the repositories built for a release of the catalog are reported,
 * since the other ones could not be linked to anything the catalog holds.
 */
export async function eachObsRepository(options: ObsWalkOptions): Promise<ObsWalkProgress> {
  const concurrency = options.concurrency ?? 8
  const progress: ObsWalkProgress = { directories: 0, repositories: 0, failures: 0 }
  const queue: string[][] = [options.project ? projectPath(options.project) : []]

  const worker = async () => {
    for (let path = queue.shift(); path !== undefined; path = queue.shift()) {
      let entries: DirectoryEntry[]
      try {
        entries = parseEntries(await readDirectory(path))
      } catch (error) {
        progress.failures += 1
        options.onFailure?.(directoryUrl(path), error)
        continue
      }
      progress.directories += 1

      if (isRepository(entries)) {
        const repository = readRepository(path, entries)
        if (repository) {
          progress.repositories += 1
          await options.onRepository(repository)
        }
        // The directories of a repository carry its packages, never another repository
      } else {
        queue.push(...subProjects(path, entries))
      }

      options.onProgress?.(progress)
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker))
  return progress
}

/** Configuration file of a repository as the build service publishes it next to the packages. */
export async function obsRepoConfig(configUrl: string): Promise<string | null> {
  try {
    const content = (await readText(configUrl)).trim()
    return content || null
  } catch {
    return null
  }
}

/** Path of a project within the download tree, whose directories are its name up to the last colon. */
function projectPath(project: string) {
  const segments = project.split(':')
  const name = segments.pop() ?? ''
  return [...segments.map((segment) => `${segment}:`), name].filter(Boolean)
}

function parseEntries(html: string): DirectoryEntry[] {
  const entries: DirectoryEntry[] = []
  for (const match of html.matchAll(/href="\.\/(.+?)"/g)) {
    const name = match[1]
    if (name === '..' || name === '../') continue

    const directory = name.endsWith('/')
    entries.push({ name: directory ? name.slice(0, -1) : name, directory })
  }
  return entries
}

async function readDirectory(path: string[]) {
  return readText(directoryUrl(path))
}

function directoryUrl(path: string[]) {
  return `${downloadRoot}${path.join('/')}${path.length > 0 ? '/' : ''}`
}

/**
 * Read a text file of the download server. The server is shared, so a request that fails on the way
 * (the connection, or an error of the server itself) is worth another try, while an answer that
 * says the file is not there is not.
 */
async function readText(url: string, attempts = 3): Promise<string> {
  let failure: unknown
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await xior.get<string>(url, {
        headers: requestHeaders,
        timeout: 30000,
      })
      return typeof response.data === 'string' ? response.data : ''
    } catch (error) {
      failure = error
      const status = isXiorError(error) ? error.response?.status : undefined
      if (status && status < 500) throw error
      await delay(250 * attempt)
    }
  }
  throw failure
}

/**
 * Whether a directory of the tree holds a repository. An rpm repository publishes its metadata in a
 * `repodata` directory, a repository built for a deb distribution publishes package files, and
 * neither a project nor the namespace above one of them holds either of the two.
 */
function isRepository(entries: DirectoryEntry[]) {
  return entries.some(
    (entry) =>
      (entry.directory && entry.name === 'repodata') ||
      (!entry.directory && /\.(rpm|deb)$/.test(entry.name)),
  )
}

/** Directories of the tree that hold further projects, in the order the listing names them. */
function subProjects(path: string[], entries: DirectoryEntry[]) {
  return entries
    .filter((entry) => entry.directory && !packageDirectoryNames.includes(entry.name))
    .filter((entry) => path.length > 0 || !ignoredNamespaces.includes(entry.name))
    .map((entry) => [...path, entry.name])
}

function readRepository(path: string[], entries: DirectoryEntry[]): ObsRepository | null {
  const repository = path[path.length - 1]
  const release = obsReleases[repository]
  if (!release) return null

  const project = path.slice(0, -1).join('').replace(/:$/, '')
  const baseUrl = `${downloadRoot}${path.join('/')}/`
  return {
    project,
    repository,
    baseUrl,
    arches: entries
      .filter((entry) => entry.directory && architectureNames.includes(entry.name))
      .map((entry) => entry.name),
    configUrl: `${baseUrl}${project}.repo`,
    source: obsSource(path[0]),
    release,
  }
}

/** Who publishes a repository, which the namespace its project lives in names. */
function obsSource(namespace: string) {
  if (namespace === 'home:') return 'user'
  if (namespace === 'isv:') return 'vendor'
  return 'community'
}
