import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import chalk from 'chalk'

import Distro from '#models/distro'
import Pkg from '#models/pkg'
import Repo from '#models/repo'

/** Packages are deleted in batches, so a long backlog never sends one huge statement. */
const deleteBatchSize = 500

/**
 * Deletes the packages no repository holds, whose `repo_id` is empty. A package read from a
 * repository is linked to it, so one without a repository was left behind by a repository that is
 * gone or was created by hand, and serves no release the catalog relates packages by. Everything
 * pointing at a package cascades, and the counts of the repositories and distributions are
 * refreshed.
 */
export default class PkgClean extends BaseCommand {
  static commandName = 'pkg:clean'
  static description = 'Delete the packages no repository holds'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.boolean({
    description: 'Report the packages that would be deleted without deleting them',
  })
  declare dryRun: boolean

  @flags.number({ description: 'Number of sample packages to print', default: 10 })
  declare limit: number

  async run() {
    const ids = await this.findTargets()
    if (ids.length === 0) {
      this.logger.info('No package without a repository')
      return
    }

    await this.report(ids)

    if (this.dryRun) {
      this.logger.info(chalk.dim('Dry run, nothing was deleted'))
      return
    }

    for (let index = 0; index < ids.length; index += deleteBatchSize) {
      await Pkg.query()
        .whereIn('id', ids.slice(index, index + deleteBatchSize))
        .delete()
    }

    // The deleted packages are part of these counts
    await Repo.refreshCounts()
    await Distro.refreshCounts()
    this.logger.info(`Deleted ${chalk.red(String(ids.length))} package(s)`)
  }

  /** IDs of the packages no repository holds, in the order they are reported and deleted. */
  private async findTargets() {
    const packages = await Pkg.query().select('id').whereNull('repo_id').orderBy('id')
    return packages.map((pkg) => pkg.id)
  }

  /** How many packages are deleted, then a sample of them. */
  private async report(ids: number[]) {
    this.logger.info(`${chalk.red(String(ids.length))} package(s) without a repository`)

    const packages = await Pkg.query()
      .select('type', 'name', 'version', 'arch')
      .whereNull('repo_id')
      .orderBy('id')
      .limit(this.limit)
    for (const pkg of packages) {
      this.logger.info(
        `  ${chalk.cyan([pkg.name, pkg.version, `(${pkg.type}, ${pkg.arch ?? 'no arch'})`].filter(Boolean).join(' '))}`,
      )
    }
    if (ids.length > this.limit) {
      this.logger.info(chalk.dim(`  and ${String(ids.length - this.limit)} more`))
    }
  }
}
