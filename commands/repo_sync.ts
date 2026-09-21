import { args, BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import chalk from 'chalk'
import { DateTime } from 'luxon'

import Distro from '#models/distro'
import Repo from '#models/repo'
import RepoSynchronizer, {
  type RepoSyncOptions,
  type RepoSyncSummary,
} from '#services/repo_synchronizer'

/**
 * Repositories read at a time. A catalog holds as many of them as its distributions and their
 * vendors publish, so they are read a page at a time instead of being held in memory as a whole.
 */
const reposPerPage = 50

export default class RepoSync extends BaseCommand {
  static commandName = 'repo:sync'
  static description =
    'Extract packages from configured deb/rpm/pacman repositories into the catalog'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({
    description: 'Repository name (defaults to all deb/rpm/pacman repositories)',
    required: false,
  })
  declare repoName?: string

  @flags.string({
    description:
      'Target architecture, e.g. x86_64. Deb repositories default to every architecture of the ' +
      'distributions they serve',
  })
  declare arch: string

  @flags.number({ description: 'Number of sample packages to print per repository', default: 5 })
  declare limit: number

  @flags.boolean({
    description: 'Synchronize repositories even when their sync interval has not elapsed',
  })
  declare force: boolean

  async run() {
    const synchronizer = new RepoSynchronizer()
    const options: RepoSyncOptions = { arch: this.arch ?? null, sampleSize: this.limit }
    let synced = 0

    if (this.repoName) {
      const repo = await Repo.query().where('name', this.repoName).preload('distros').firstOrFail()
      if (await this.syncOne(synchronizer, repo, options)) synced += 1
    } else {
      // The repositories are read a page at a time, in the order the run has to reach them in: the
      // ones that change most often first, so that a run that is long or stopped early reaches them,
      // and the ones without an interval last, since they are only read when they are forced. A
      // name is stored once, so the order is total and a page never repeats or skips a repository
      let page = 1
      let found = 0

      while (true) {
        const paginator = await Repo.query()
          .whereIn('type', ['deb', 'rpm', 'pacman'])
          .orderByRaw('sync_interval_days is null')
          .orderBy('syncIntervalDays')
          .orderBy('name')
          .preload('distros')
          .paginate(page, reposPerPage)
        found = paginator.total

        for (const repo of paginator.all()) {
          if (await this.syncOne(synchronizer, repo, options)) synced += 1
        }
        if (!paginator.hasMorePages) break
        page += 1
      }

      if (found === 0) {
        this.logger.warning('No deb/rpm/pacman repositories found')
        return
      }
    }

    // The packages the run wrote are what the counts of the repositories it synchronized and of the
    // distributions they serve are made of, so they are counted once the run has written them all
    await Repo.refreshCounts()
    await Distro.refreshCounts()

    if (synced === 0) {
      this.logger.warning('No repositories were synchronized, use --force to sync anyway')
    }
  }

  /**
   * Synchronize one repository and report what it contributed. Reports whether the repository was
   * read at all, which the ones its interval leaves out are not; a repository whose metadata could
   * not be read was read, and counts as such, so that the next run retries it.
   */
  private async syncOne(synchronizer: RepoSynchronizer, repo: Repo, options: RepoSyncOptions) {
    const skipReason = this.syncSkipReason(repo)
    if (skipReason) {
      this.logger.info(`${repo.name}: ${chalk.dim(`skipped, ${skipReason}`)}`)
      return false
    }

    this.logger.info(`Extracting packages from ${chalk.cyan(repo.name)} (${repo.type})`)
    try {
      // A deb repository holds the packages of several architectures under the same URLs, so a
      // repository that is shared by distributions of different architectures is read once per
      // architecture, which the service reports apart
      for (const summary of await synchronizer.sync(repo, options)) {
        this.report(repo, summary)
      }
    } catch (error) {
      this.logger.error(`${repo.name}: ${error instanceof Error ? error.message : String(error)}`)
    }

    return true
  }

  /** Report what one architecture of a repository contributed, and what it could not read. */
  private report(repo: Repo, summary: RepoSyncSummary) {
    const label = summary.arch ? `${repo.name} (${summary.arch})` : repo.name

    for (const warning of summary.warnings) this.logger.warning(warning)

    this.logger.info(
      `${label}: ${chalk.green(String(summary.packages.total))} packages` +
        ` (${chalk.green(String(summary.packages.created))} created, ${chalk.yellow(String(summary.packages.updated))} updated,` +
        ` ${chalk.red(String(summary.packages.deleted))} removed)`,
    )
    if (summary.components > 0) {
      this.logger.info(
        `${label}: ${chalk.green(String(summary.components))} appstream components` +
          ` (${chalk.green(String(summary.apps.created))} apps created,` +
          ` ${chalk.yellow(String(summary.apps.updated))} apps updated,` +
          ` ${chalk.dim(String(summary.apps.skipped))} skipped,` +
          ` ${chalk.green(String(summary.apps.icons))} icons,` +
          ` ${chalk.green(String(summary.apps.linked))} packages linked,` +
          ` ${chalk.green(String(summary.apps.categories))} categories linked)`,
      )
    }
    if (
      summary.apps.inferred > 0 ||
      summary.apps.inferredLinked > 0 ||
      summary.apps.inferredExtracted > 0 ||
      summary.apps.inferredIcons > 0
    ) {
      this.logger.info(
        `${label}: ${chalk.green(String(summary.apps.inferred))} app(s) inferred from package` +
          ` file lists (${chalk.green(String(summary.apps.inferredLinked))} packages linked,` +
          ` ${chalk.green(String(summary.apps.inferredExtracted))} metadata files,` +
          ` ${chalk.green(String(summary.apps.inferredIcons))} icons extracted)`,
      )
    }
    if (summary.apps.mapped > 0) {
      this.logger.info(
        `${label}: ${chalk.green(String(summary.apps.mapped))} package(s) linked by package name`,
      )
    }
    for (const pkg of summary.packages.sample) {
      const details = [pkg.version, pkg.release, pkg.arch].filter(Boolean).join(' ')
      this.logger.info(`  ${pkg.name}${details ? ` ${chalk.dim(details)}` : ''}`)
    }
    if (summary.packages.total > summary.packages.sample.length) {
      this.logger.info(
        chalk.dim(`  ... and ${summary.packages.total - summary.packages.sample.length} more`),
      )
    }
  }

  /**
   * Returns why a repository is not synchronized, or `null` when it is. A repository that was never
   * synchronized always runs, while one without an interval is only synchronized manually once it
   * has been synchronized before, which is what `--force` does.
   */
  private syncSkipReason(repo: Repo): string | null {
    if (this.force) return null
    if (!repo.lastSyncedAt) return null
    if (repo.syncIntervalDays === null) return 'no sync interval, use --force to sync'

    const nextSync = repo.lastSyncedAt.plus({ days: repo.syncIntervalDays })
    if (nextSync <= DateTime.now()) return null
    return `next sync at ${nextSync.toFormat('yyyy-MM-dd HH:mm')}, use --force to sync now`
  }
}
