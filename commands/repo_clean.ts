import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import chalk from 'chalk'

import Distro from '#models/distro'
import Repo from '#models/repo'
import { ignoredObsProject, obsRepositoryProject } from '#services/obs_repositories'

/** Repositories are deleted in batches, so a long backlog never sends one huge statement. */
const deleteBatchSize = 500

/**
 * Deletes the repositories stored from the projects an import of the build service leaves out
 * (`config/obs.ts`), which a run neither creates nor updates any more: a project that was imported
 * before it came to be ignored stays in the catalog until it is cleaned. The packages of a
 * repository are deleted with it, and the counts of the remaining repositories and distributions
 * are refreshed.
 */
export default class RepoClean extends BaseCommand {
  static commandName = 'repo:clean'
  static description = 'Delete the repositories imported from the OBS projects the import ignores'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.boolean({
    description: 'Report the repositories that would be deleted without deleting them',
  })
  declare dryRun: boolean

  @flags.number({ description: 'Number of sample repositories to print', default: 10 })
  declare limit: number

  async run() {
    const ids = await this.findTargets()
    if (ids.length === 0) {
      this.logger.info('No repository from an ignored project')
      return
    }

    await this.report(ids)

    if (this.dryRun) {
      this.logger.info(chalk.dim('Dry run, nothing was deleted'))
      return
    }

    for (let index = 0; index < ids.length; index += deleteBatchSize) {
      await Repo.deleteWithPackages(ids.slice(index, index + deleteBatchSize))
    }

    // The deleted repositories are part of these counts
    await Repo.refreshCounts()
    await Distro.refreshCounts()
    this.logger.info(`Deleted ${chalk.red(String(ids.length))} repository(ies)`)
  }

  /** IDs of the repositories whose project the import ignores, in the order they are deleted. */
  private async findTargets() {
    const repos = await Repo.query().select('id', 'name').orderBy('id')
    return repos
      .filter((repo) => {
        const project = obsRepositoryProject(repo.name)
        return project !== null && ignoredObsProject(project)
      })
      .map((repo) => repo.id)
  }

  /** How many repositories are deleted, then a sample of them. */
  private async report(ids: number[]) {
    this.logger.info(
      `${chalk.red(String(ids.length))} repository(ies) from a project the import ignores`,
    )

    const repos = await Repo.query()
      .select('name')
      .whereIn('id', ids.slice(0, this.limit))
      .orderBy('id')
    for (const repo of repos) this.logger.info(`  ${chalk.cyan(repo.name)}`)
    if (ids.length > this.limit) {
      this.logger.info(chalk.dim(`  and ${String(ids.length - this.limit)} more`))
    }
  }
}
