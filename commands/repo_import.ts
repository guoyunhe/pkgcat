import { args, BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import chalk from 'chalk'

import Distro from '#models/distro'
import Repo from '#models/repo'
import {
  eachObsRepository,
  obsRepoConfig,
  type ObsRelease,
  type ObsRepository,
  type ObsWalkProgress,
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
 * The download tree of the build service is walked rather than its API, which needs a login, and a
 * repository is stored under the name of the project that publishes it together with the repository
 * name, since that is what tells the repositories of a project apart.
 */
export default class RepoImport extends BaseCommand {
  static commandName = 'repo:import'
  static description =
    'Import the repositories build.opensuse.org publishes for the openSUSE releases of the catalog'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({
    description: 'Project to read, e.g. home:guoyunhe (defaults to every project)',
    required: false,
  })
  declare project?: string

  @flags.boolean({
    description: 'Report the repositories that would be imported without writing them',
  })
  declare dryRun: boolean

  async run() {
    const releases = new Map<string, Distro[]>()
    for (const distro of await Distro.all()) {
      const key = releaseKey({ name: distro.name, version: distro.version })
      releases.set(key, [...(releases.get(key) ?? []), distro])
    }

    // The repositories of the catalog are read once, so that an import writes only what it changed
    // and a second run over the same tree finds nothing to do
    const stored = await Repo.query().preload('distros')
    const byUrl = new Map(stored.map((repo) => [repo.baseUrl, repo]))
    const byName = new Map(stored.map((repo) => [repo.name, repo]))

    const counts: ImportCounts = { created: 0, updated: 0, unchanged: 0, skipped: 0 }
    const unknownReleases = new Set<string>()
    const takenNames = new Set<string>()
    const failures: string[] = []

    this.logger.info(
      `Reading build.opensuse.org for ${chalk.cyan(this.project ?? 'every project')}`,
    )
    const progress = await eachObsRepository({
      project: this.project,
      onRepository: async (repository) => {
        const served = repository.releases.flatMap(
          (release) => releases.get(releaseKey(release)) ?? [],
        )
        if (served.length === 0) {
          // Releases the catalog does not carry are reported once per repository, since only a
          // release that is known at all can tell a missing one from an architecture that is
          for (const release of repository.releases) unknownReleases.add(releaseLabel(release))
        }

        // A repository is linked to the releases it publishes for; one that publishes nothing the
        // catalog carries (a 32-bit architecture, say) has no place in it
        const distroIds = served
          .filter((distro) => repository.arches.includes(distro.arch))
          .map((distro) => distro.id)
        if (distroIds.length === 0) {
          counts.skipped += 1
          return
        }

        await this.save(repository, distroIds, counts, byUrl, byName, takenNames)
      },
      onProgress: (state) => {
        if (state.directories % 500 === 0) this.logger.info(chalk.dim(walkLine(state)))
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
        `${progress.directories} directories read, ${progress.repositories} repositories found` +
          (progress.failures > 0 ? `, ${progress.failures} unreadable` : ''),
      ),
    )
    for (const failure of failures) {
      this.logger.warning(`Unable to read ${failure}`)
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
    takenNames: Set<string>,
  ) {
    const name = importLabel(repository)
    const attributes = {
      name,
      type: 'rpm',
      source: repository.source,
      baseUrl: repository.baseUrl,
      configUrl: repository.configUrl,
      installScript: `pkexec zypper addrepo -y ${repository.configUrl}`,
      syncIntervalDays,
    }

    const existing = byUrl.get(repository.baseUrl)
    if (!existing && byName.has(name)) {
      takenNames.add(name)
      return
    }

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
      byUrl.set(repo.baseUrl, repo)
      byName.set(repo.name, repo)
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

function walkLine({ directories, repositories, failures }: ObsWalkProgress) {
  const unreadable = failures > 0 ? ` (${failures} unreadable)` : ''
  return `${directories} directories${unreadable}, ${repositories} repositories`
}
