import Distro from '#models/distro'
import Repo from '#models/repo'
import {
  eachObsRepository,
  obsRepoConfig,
  type ObsProgress,
  type ObsRelease,
  type ObsRepository,
} from '#services/obs_repositories'

/** Repositories the build service keeps rebuilding, so they carry the weekly interval. */
const syncIntervalDays = 7

/** Repositories read between two progress lines. */
const progressInterval = 500

/** Unreadable repositories a run reports, the ones after them being counted only. */
const reportedFailures = 3

export type ObsImportCounts = {
  created: number
  updated: number
  unchanged: number
  skipped: number
}

/** What one run of the import did, which the command prints and the job on a schedule logs. */
export type ObsImportSummary = {
  counts: ObsImportCounts
  progress: ObsProgress
  /** Unreadable repositories, the first few of them. */
  failures: string[]
  /** Releases the service publishes repositories for that the catalog does not carry. */
  unknownReleases: string[]
  /** Repositories whose name or URL the catalog already holds under another spelling. */
  takenNames: string[]
}

export type ObsImportRunOptions = {
  /** Project or namespace to read, e.g. `home:guoyunhe`, `null` for the whole service. */
  project: string | null
  dryRun: boolean
  concurrency: number
  /** Called with the path of every publish area the run reads, which the command prints as it goes. */
  onRead?: (path: string) => void
  /** Called once every `progressInterval` repositories were read. */
  onProgress?: (progress: ObsProgress) => void
}

/** What a run keeps while it walks the repositories the build service publishes. */
type ImportContext = {
  /** Releases of the catalog, by the name and version a repository of the service is built for. */
  releases: Map<string, Distro[]>
  byUrl: Map<string, Repo>
  byName: Map<string, Repo>
  /** Keys this run has taken, which the table keeps only one spelling of. */
  claimed: Set<string>
  counts: ObsImportCounts
  unknownReleases: Set<string>
  takenNames: Set<string>
  failures: string[]
  dryRun: boolean
}

/**
 * Imports the repositories build.opensuse.org publishes for the openSUSE releases of the catalog: a
 * repository is stored as `[OBS] <project> (<repository>)` and linked to the releases it serves.
 * Reading the API needs OBS_USER and OBS_PASSWORD.
 */
export default class ObsRepositoryImporter {
  async run(options: ObsImportRunOptions): Promise<ObsImportSummary> {
    const context: ImportContext = {
      releases: new Map(),
      byUrl: new Map(),
      byName: new Map(),
      claimed: new Set(),
      counts: { created: 0, updated: 0, unchanged: 0, skipped: 0 },
      unknownReleases: new Set(),
      takenNames: new Set(),
      failures: [],
      dryRun: options.dryRun,
    }

    for (const distro of await Distro.all()) {
      const key = releaseKey({ name: distro.name, version: distro.version })
      context.releases.set(key, [...(context.releases.get(key) ?? []), distro])
    }

    // Read once so that a second run finds nothing to do; keyed the way the unique indexes compare
    const stored = await Repo.query().preload('distros')
    context.byUrl = new Map(stored.map((repo) => [repoKey(repo.baseUrl), repo]))
    context.byName = new Map(stored.map((repo) => [repoKey(repo.name), repo]))

    const progress = await eachObsRepository({
      project: options.project ?? undefined,
      concurrency: options.concurrency,
      onRepository: async (repository) => {
        const served = repository.releases.flatMap(
          (release) => context.releases.get(releaseKey(release)) ?? [],
        )

        // A repository that publishes nothing the catalog carries has no place in it
        const distroIds = served
          .filter((distro) => repository.arches.includes(distro.arch))
          .map((distro) => distro.id)
        if (distroIds.length === 0) {
          context.counts.skipped += 1
          return
        }

        await this.save(repository, distroIds, context)
      },
      onReleases: (releasesOfName) => {
        // Reported once per repository name: only a release that is known can tell one apart
        if (releasesOfName.some((release) => context.releases.has(releaseKey(release)))) return
        for (const release of releasesOfName) context.unknownReleases.add(releaseLabel(release))
      },
      takesReleases: (releasesOfName) =>
        releasesOfName.some((release) => context.releases.has(releaseKey(release))),
      onRead: options.onRead,
      onProgress: (state) => {
        if (state.read % progressInterval === 0) options.onProgress?.(state)
      },
      onFailure: (url, error) => {
        if (context.failures.length >= reportedFailures) return
        context.failures.push(`${url}: ${error instanceof Error ? error.message : String(error)}`)
      },
    })

    return {
      counts: context.counts,
      progress,
      failures: context.failures,
      unknownReleases: [...context.unknownReleases],
      takenNames: [...context.takenNames],
    }
  }

  /** Store one repository with the releases it serves, or count what would have been stored. */
  private async save(repository: ObsRepository, distroIds: number[], context: ImportContext) {
    const name = importLabel(repository)
    const keys = [repoKey(repository.baseUrl), repoKey(name)]
    const attributes = {
      name,
      type: 'rpm',
      source: repository.source,
      baseUrl: repository.baseUrl,
      configUrl: repository.configUrl,
      installScript: `pkexec zypper addrepo -y ${repository.configUrl}`,
      syncIntervalDays,
    }

    const existing = context.byUrl.get(keys[0])
    // The indexes compare without case, so another spelling of this URL is the row already there
    if (existing && existing.baseUrl !== repository.baseUrl) {
      context.takenNames.add(name)
      return
    }
    if (
      !existing &&
      (keys.some((key) => context.claimed.has(key)) || context.byName.has(keys[1]))
    ) {
      context.takenNames.add(name)
      return
    }

    for (const key of keys) context.claimed.add(key)

    const storedLinks = (existing?.distros ?? []).map((distro) => distro.id).sort()
    const servedLinks = [...distroIds].sort()
    const relinked = storedLinks.join() !== servedLinks.join()
    if (context.dryRun) {
      context.counts[!existing ? 'created' : relinked ? 'updated' : 'unchanged'] += 1
      return
    }

    if (!existing) {
      const repo = await Repo.create({
        ...attributes,
        configContent: await obsRepoConfig(repository.configUrl),
      })
      await repo.related('distros').sync(servedLinks)
      context.byUrl.set(repoKey(repo.baseUrl), repo)
      context.byName.set(repoKey(repo.name), repo)
      context.counts.created += 1
      return
    }

    existing.merge(attributes)
    if (!existing.configContent) {
      existing.configContent = await obsRepoConfig(repository.configUrl)
    }
    if (relinked) await existing.related('distros').sync(servedLinks)

    if (relinked || existing.$isDirty) {
      await existing.save()
      context.counts.updated += 1
      return
    }

    context.counts.unchanged += 1
  }
}

/** One line of progress a run reports as it goes. */
export function obsImportProgress({ names, repositories, read, failures }: ObsProgress) {
  const unreadable = failures > 0 ? ` (${failures} unreadable)` : ''
  return `${read} of ${repositories} repositories read, ${names} names looked up${unreadable}`
}

/** Key of a release of the catalog, which a repository of the build service is matched by. */
function releaseKey({ name, version }: ObsRelease) {
  return [name, version].join('\u0000')
}

function releaseLabel({ name, version }: ObsRelease) {
  return version ? `${name} ${version}` : name
}

function importLabel(repository: ObsRepository) {
  return `[OBS] ${repository.project} (${repository.repository})`
}

function repoKey(value: string) {
  return value.toLowerCase()
}
