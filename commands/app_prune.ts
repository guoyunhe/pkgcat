import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import chalk from 'chalk'

import App from '#models/app'
import Distro from '#models/distro'
import Repo from '#models/repo'
import { ignoredAppstreamIdPatterns } from '#services/appstream_filter'

/** Applications are deleted in batches, so a long backlog never sends one huge statement. */
const deleteBatchSize = 500

/** Why an application is deleted, as it is reported. */
type PruneReason = 'no name' | 'ignored'

type PruneTarget = {
  app: App
  /** Every reason it is deleted for; an application can match both. */
  reasons: PruneReason[]
}

/**
 * Deletes the applications the catalog makes no use of: the ones that translate no name in any
 * locale, and the ones whose AppStream ID is one the import leaves out
 * (`services/appstream_filter`). Everything pointing at an application cascades, and the packages
 * are kept for the next sync.
 */
export default class AppPrune extends BaseCommand {
  static commandName = 'app:prune'
  static description =
    'Delete the applications that carry no name in any locale, and the ones the import leaves out'

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
    const targets = await this.findTargets()
    if (targets.length === 0) {
      this.logger.info('No application to delete')
      return
    }

    this.report(targets)

    if (this.dryRun) {
      this.logger.info(chalk.dim('Dry run, nothing was deleted'))
      return
    }

    for (let index = 0; index < targets.length; index += deleteBatchSize) {
      const ids = targets.slice(index, index + deleteBatchSize).map(({ app }) => app.id)
      await App.query().whereIn('id', ids).delete()
    }
    // The deleted applications are part of these counts
    await Repo.refreshCounts()
    await Distro.refreshCounts()
    this.logger.info(`Deleted ${chalk.red(String(targets.length))} application(s)`)
  }

  /** Both reads are merged by ID, so an application matching twice is deleted once. */
  private async findTargets() {
    const targets = new Map<number, PruneTarget>()

    for (const app of await this.namelessApps()) {
      targets.set(app.id, { app, reasons: ['no name'] })
    }
    for (const app of await this.ignoredApps()) {
      const target = targets.get(app.id) ?? { app, reasons: [] }
      target.reasons.push('ignored')
      targets.set(app.id, target)
    }

    return [...targets.values()].sort((left, right) => left.app.id - right.app.id)
  }

  /** Applications that translate no name in any locale; white space is no name. */
  private namelessApps() {
    return App.query()
      .whereDoesntHave('translations', (query) => {
        query.whereNotNull('name').whereRaw("trim(name) <> ''")
      })
      .withCount('packages')
      .orderBy('id')
  }

  /** The applications the import leaves out; IDs are compared without case. */
  private ignoredApps() {
    return App.query()
      .where((query) => {
        for (const pattern of ignoredAppstreamIdPatterns()) {
          query.orWhereILike('appstreamId', pattern)
        }
      })
      .withCount('packages')
      .orderBy('id')
  }

  /** One line per reason, then a sample of the applications with theirs. */
  private report(targets: PruneTarget[]) {
    const reasons: Array<{ reason: PruneReason; label: string }> = [
      { reason: 'ignored', label: 'the import leaves out' },
      { reason: 'no name', label: 'without a name' },
    ]

    for (const { reason, label } of reasons) {
      const group = targets.filter((target) => target.reasons.includes(reason))
      if (group.length === 0) continue

      const links = group.reduce((total, { app }) => total + Number(app.$extras.packages_count), 0)
      this.logger.info(
        `${chalk.green(String(group.length))} application(s) ${label}, holding` +
          ` ${chalk.green(String(links))} package link(s)`,
      )
    }

    for (const { app, reasons: appReasons } of targets.slice(0, this.limit)) {
      this.logger.info(
        `  ${chalk.cyan(app.appstreamId ?? `#${app.id}`)}` +
          chalk.dim(
            ` (${appReasons.join(', ')}, ${app.type}, ${app.$extras.packages_count} packages)`,
          ),
      )
    }
    if (targets.length > this.limit) {
      this.logger.info(chalk.dim(`  and ${String(targets.length - this.limit)} more`))
    }
  }
}
