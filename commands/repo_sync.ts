import { args, BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import chalk from 'chalk'

import type Repo from '#models/repo'
import RepoSyncRunner, {
  type RepoSyncRunOptions,
  type RepoSyncSummary,
} from '#services/repo_sync_runner'

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
    const options: RepoSyncRunOptions = {
      name: this.repoName ?? null,
      arch: this.arch ?? null,
      force: this.force,
      sampleSize: this.limit,
    }

    for await (const event of new RepoSyncRunner().run(options)) {
      switch (event.type) {
        case 'skipped':
          this.logger.info(`${event.repo.name}: ${chalk.dim(`skipped, ${event.reason}`)}`)
          break

        case 'reading':
          this.logger.info(
            `Extracting packages from ${chalk.cyan(event.repo.name)} (${event.repo.type})`,
          )
          break

        case 'read':
          this.report(event.repo, event.summary)
          break

        case 'unreadable':
          this.logger.error(`${event.repo.name}: ${event.message}`)
          break

        case 'empty':
          this.logger.warning('No deb/rpm/pacman repositories found')
          return

        case 'done':
          if (event.synced === 0) {
            this.logger.warning('No repositories were synchronized, use --force to sync anyway')
          }
          break
      }
    }
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
}
