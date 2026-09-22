import { args, BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import chalk from 'chalk'

import ObsRepositoryImporter, { obsImportProgress } from '#services/obs_repository_importer'

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
    this.logger.info(
      `Reading build.opensuse.org for ${chalk.cyan(this.project ?? 'every project')}`,
    )

    const summary = await new ObsRepositoryImporter().run({
      project: this.project ?? null,
      dryRun: this.dryRun,
      concurrency: this.concurrency,
      onRead: (path) => this.logger.info(chalk.dim(path)),
      onProgress: (progress) => this.logger.info(chalk.dim(obsImportProgress(progress))),
    })
    const { counts, progress, failures, unknownReleases, takenNames } = summary

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
    for (const release of unknownReleases.slice(0, 5)) {
      this.logger.warning(
        `${release} is not a release of the catalog, its repositories are left out`,
      )
    }
    if (unknownReleases.length > 5) {
      this.logger.warning(
        chalk.dim(`${unknownReleases.slice(5).join(', ')} are not releases of the catalog either`),
      )
    }
    for (const name of takenNames) {
      this.logger.warning(`${name} is the name of another repository, which was not imported`)
    }
    if (this.dryRun) this.logger.info(chalk.dim('Dry run, nothing was written'))
  }
}
