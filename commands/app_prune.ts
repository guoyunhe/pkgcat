import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import chalk from 'chalk'

import App from '#models/app'
import Distro from '#models/distro'
import Repo from '#models/repo'

/** Applications are deleted in batches, so a long backlog never sends one huge statement. */
const deleteBatchSize = 500

/**
 * Deletes the applications that translate no name in any locale: the entries a repository leaves
 * behind when the metadata it publishes carries no `<name>`, which is what fonts and drivers do,
 * and what a repository that ships no AppStream data produces when a component is named by the file
 * it ships. Such an entry can be neither listed nor searched, and it holds a link to every package
 * it was inferred from.
 *
 * The packages themselves are kept: the next `repo:sync` of their repository links them through the
 * package name mappings, or writes the application again once the metadata names it. Every table
 * that points at an application cascades, so one delete also takes its translations, aliases,
 * package name mappings, category links, favorites and reviews with it.
 */
export default class AppPrune extends BaseCommand {
  static commandName = 'app:prune'
  static description = 'Delete the applications that carry no name in any locale'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.boolean({
    description: 'Report the applications that would be deleted without deleting them',
  })
  declare dryRun: boolean

  @flags.number({ description: 'Number of sample applications to print', default: 10 })
  declare limit: number

  async run() {
    const apps = await App.query()
      .whereDoesntHave('translations', (query) => {
        query.whereNotNull('name').whereRaw("trim(name) <> ''")
      })
      .withCount('packages')
      .orderBy('id')

    if (apps.length === 0) {
      this.logger.info('No application without a name')
      return
    }

    const links = apps.reduce((total, app) => total + Number(app.$extras.packages_count), 0)
    this.logger.info(
      `${chalk.green(String(apps.length))} application(s) without a name, holding` +
        ` ${chalk.green(String(links))} package link(s)`,
    )
    for (const app of apps.slice(0, this.limit)) {
      this.logger.info(
        `  ${chalk.cyan(app.appstreamId ?? `#${app.id}`)}` +
          chalk.dim(` (${app.type}, ${app.$extras.packages_count} packages)`),
      )
    }
    if (apps.length > this.limit) {
      this.logger.info(chalk.dim(`  and ${String(apps.length - this.limit)} more`))
    }

    if (this.dryRun) {
      this.logger.info(chalk.dim('Dry run, nothing was deleted'))
      return
    }

    for (let index = 0; index < apps.length; index += deleteBatchSize) {
      const ids = apps.slice(index, index + deleteBatchSize).map((app) => app.id)
      await App.query().whereIn('id', ids).delete()
    }
    // The applications the packages of an entry provided are what its counts are made of, and they
    // are gone with the deleted applications
    await Repo.refreshCounts()
    await Distro.refreshCounts()
    this.logger.info(`Deleted ${chalk.red(String(apps.length))} application(s)`)
  }
}
