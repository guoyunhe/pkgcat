import { args, BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import chalk from 'chalk'

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

type ImportCounts = { created: number; updated: number; unchanged: number; skipped: number }

/**
 * Imports the repositories build.opensuse.org publishes for the openSUSE releases of the catalog.
 * The API of the build service is read rather than its download tree walked, which took an hour and
 * more for the whole service: the search reports every repository name of the service at once, and
 * the publish area tells which projects carry a repository under such a name. A repository is
 * stored under the name of the project that publishes it together with the repository name, since
 * that is what tells the repositories of a project apart. Reading the API needs the credentials of
 * an account, which are taken from OBS_USER and OBS_PASSWORD.
 */
export default class RepoImport extends BaseCommand {
  static commandName = 'repo:import'
  static description =
    'Import the repositories build.opensuse.org publishes for the openSUSE releases of the catalog'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({
    description: 'Project or namespace to read, e.g. home:guoyunhe or devel: (defaults to all)',
    required: false,
  })
  declare project?: string

  @flags.boolean({
    description: 'Report the repositories that would be imported without writing them',
  })
  declare dryRun: boolean

  @flags.number({
    description: 'Number of requests the API is read with at the same time',
    default: 8,
  })
  declare concurrency: number

  async run() {
    const releases = new Map<string, Distro[]>()
    for (const distro of await Distro.all()) {
      const key = releaseKey({ name: distro.name, version: distro.version })
      releases.set(key, [...(releases.get(key) ?? []), distro])
    }

    // The repositories of the catalog are read once, so that an import writes only what it changed
    // and a second run over the same service finds nothing to do. The maps are keyed the way the
    // unique indexes of the table compare: two repositories whose names or URLs differ only in case
    // cannot both be stored
    const stored = await Repo.query().preload('distros')
    const byUrl = new Map(stored.map((repo) => [repoKey(repo.baseUrl), repo]))
    const byName = new Map(stored.map((repo) => [repoKey(repo.name), repo]))

    // Keys this run has taken. Several repositories are stored at a time, and the table keeps only
    // one of a pair whose names or URLs differ in case, so a key is claimed before anything is
    // awaited
    const claimed = new Set<string>()

    const counts: ImportCounts = { created: 0, updated: 0, unchanged: 0, skipped: 0 }
    const unknownReleases = new Set<string>()
    const takenNames = new Set<string>()
    const failures: string[] = []

    this.logger.info(
      `Reading build.opensuse.org for ${chalk.cyan(this.project ?? 'every project')}`,
    )
    const progress = await eachObsRepository({
      project: this.project,
      concurrency: this.concurrency,
      onRepository: async (repository) => {
        const served = repository.releases.flatMap(
          (release) => releases.get(releaseKey(release)) ?? [],
        )

        // A repository is linked to the releases it publishes for; one that publishes nothing the
        // catalog carries (a 32-bit architecture, say) has no place in it
        const distroIds = served
          .filter((distro) => repository.arches.includes(distro.arch))
          .map((distro) => distro.id)
        if (distroIds.length === 0) {
          counts.skipped += 1
          return
        }

        await this.save(repository, distroIds, counts, byUrl, byName, claimed, takenNames)
      },
      onReleases: (releasesOfName) => {
        // Releases the catalog does not carry are reported once per repository name, since only a
        // release that is known at all can tell a missing one from an architecture that is
        if (releasesOfName.some((release) => releases.has(releaseKey(release)))) return
        for (const release of releasesOfName) unknownReleases.add(releaseLabel(release))
      },
      takesReleases: (releasesOfName) =>
        releasesOfName.some((release) => releases.has(releaseKey(release))),
      onRead: (path) => this.logger.info(chalk.dim(path)),
      onProgress: (state) => {
        if (state.read % 500 === 0) this.logger.info(chalk.dim(progressLine(state)))
      },
      onFailure: (url, error) => {
        if (failures.length < 3) {
          failures.push(`${url}: ${error instanceof Error ? error.message : String(error)}`)
        }
      },
    })

    this.logger.info(
      `${chalk.green(String(counts.created))} created,` +
        ` ${chalk.yellow(String(counts.updated))} updated,` +
        ` ${counts.unchanged} unchanged,` +
        ` ${chalk.dim(`${counts.skipped} skipped`)}`,
    )
    this.logger.info(
      chalk.dim(
        `${progress.names} names looked up, ${progress.repositories} repositories published,` +
          ` ${progress.read} read` +
          (progress.failures > 0 ? `, ${progress.failures} unreadable` : ''),
      ),
    )
    for (const failure of failures) {
      this.logger.warning(`Failed to import ${failure}`)
    }
    if (this.project && Object.values(counts).every((count) => count === 0)) {
      this.logger.warning(`${this.project} holds no repository the catalog could take`)
    }
    const missing = [...unknownReleases]
    for (const release of missing.slice(0, 5)) {
      this.logger.warning(
        `${release} is not a release of the catalog, its repositories are left out`,
      )
    }
    if (missing.length > 5) {
      this.logger.warning(
        chalk.dim(`${missing.slice(5).join(', ')} are not releases of the catalog either`),
      )
    }
    for (const name of takenNames) {
      this.logger.warning(`${name} is the name of another repository, which was not imported`)
    }
    if (this.dryRun) this.logger.info(chalk.dim('Dry run, nothing was written'))
  }

  /** Store one repository with the releases it serves, or report what would have been stored. */
  private async save(
    repository: ObsRepository,
    distroIds: number[],
    counts: ImportCounts,
    byUrl: Map<string, Repo>,
    byName: Map<string, Repo>,
    claimed: Set<string>,
    takenNames: Set<string>,
  ) {
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

    const existing = byUrl.get(keys[0])
    // The indexes of the table compare without case, so a repository whose URL is stored under
    // another spelling is the one already there: it cannot be stored beside it, and its spelling is
    // left as it is
    if (existing && existing.baseUrl !== repository.baseUrl) {
      takenNames.add(name)
      return
    }
    if (!existing && (keys.some((key) => claimed.has(key)) || byName.has(keys[1]))) {
      takenNames.add(name)
      return
    }

    for (const key of keys) claimed.add(key)

    const storedLinks = (existing?.distros ?? []).map((distro) => distro.id).sort()
    const servedLinks = [...distroIds].sort()
    const relinked = storedLinks.join() !== servedLinks.join()
    if (this.dryRun) {
      counts[!existing ? 'created' : relinked ? 'updated' : 'unchanged'] += 1
      return
    }

    if (!existing) {
      const repo = await Repo.create({
        ...attributes,
        configContent: await obsRepoConfig(repository.configUrl),
      })
      await repo.related('distros').sync(servedLinks)
      byUrl.set(repoKey(repo.baseUrl), repo)
      byName.set(repoKey(repo.name), repo)
      counts.created += 1
      return
    }

    existing.merge(attributes)
    if (!existing.configContent) {
      existing.configContent = await obsRepoConfig(repository.configUrl)
    }
    if (relinked) await existing.related('distros').sync(servedLinks)

    if (relinked || existing.$isDirty) {
      await existing.save()
      counts.updated += 1
      return
    }

    counts.unchanged += 1
  }
}

function repoKey(value: string) {
  return value.toLowerCase()
}

function progressLine({ names, repositories, read, failures }: ObsProgress) {
  const unreadable = failures > 0 ? ` (${failures} unreadable)` : ''
  return `${read} of ${repositories} repositories read, ${names} names looked up${unreadable}`
}
