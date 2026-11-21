import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import chalk from 'chalk'

import { supportedArches } from '#config/arch'
import Distro from '#models/distro'
import Pkg from '#models/pkg'
import Repo from '#models/repo'
import { archIndependentPackageArch, legacyArchIndependentArches } from '#utils/arch'

/** Rows are deleted in batches, so a long backlog never sends one huge statement. */
const deleteBatchSize = 500

/**
 * Architectures the catalog keeps, whatever the configuration supports: the ones that carry no
 * machine code are stored as `noarch`, and one read before the catalog settled on that spelling may
 * still be `all` or `any`.
 */
const keptArches = [...supportedArches, archIndependentPackageArch, ...legacyArchIndependentArches]

/** What the catalog holds of the architectures it no longer supports. */
type CleanTargets = {
  distroIds: number[]
  repoIds: number[]
  packageIds: number[]
}

/**
 * Deletes what the catalog holds of the architectures it no longer supports (`config/arch.ts`): the
 * distributions of such an architecture, the repositories that serve only them, and the packages of
 * such an architecture, including the ones a kept repository holds. A repository carries no
 * architecture of its own — it holds the packages of the releases it is linked to — so it is
 * deleted when none of the releases it is linked to is kept, while a repository that serves no
 * release at all is left alone.
 *
 * Packages that carry no machine code are never deleted, however they are stored (`noarch`, `all`,
 * `any`), and neither is a package whose architecture is unknown. Everything pointing at a deleted
 * entry cascades, and the counts of the remaining repositories and distributions are refreshed.
 */
export default class ArchClean extends BaseCommand {
  static commandName = 'arch:clean'
  static description =
    'Delete the distributions, repositories and packages of the architectures the catalog does not support'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.boolean({
    description: 'Report the entries that would be deleted without deleting them',
  })
  declare dryRun: boolean

  @flags.number({ description: 'Number of sample entries to print', default: 10 })
  declare limit: number

  async run() {
    const targets = await this.findTargets()
    if (
      targets.distroIds.length === 0 &&
      targets.repoIds.length === 0 &&
      targets.packageIds.length === 0
    ) {
      this.logger.info(`No entry of an unsupported architecture`)
      return
    }

    await this.report(targets)

    if (this.dryRun) {
      this.logger.info(chalk.dim('Dry run, nothing was deleted'))
      return
    }

    await this.deleteAll(targets.distroIds, (ids) => Distro.query().whereIn('id', ids).delete())
    await this.deleteAll(targets.repoIds, (ids) => Repo.deleteWithPackages(ids))
    await this.deleteAll(targets.packageIds, (ids) => Pkg.query().whereIn('id', ids).delete())

    // The deleted entries are part of these counts
    await Repo.refreshCounts()
    await Distro.refreshCounts()
    this.logger.info(
      `Deleted ${chalk.red(String(targets.distroIds.length))} distribution(s), ` +
        `${chalk.red(String(targets.repoIds.length))} repository(ies) and ` +
        `${chalk.red(String(targets.packageIds.length))} package(s)`,
    )
  }

  /** IDs of the entries the catalog no longer keeps, in the order they are reported and deleted. */
  private async findTargets(): Promise<CleanTargets> {
    const distros = await Distro.query().select('id').whereNotIn('arch', keptArches).orderBy('id')
    const repos = await this.repositoriesOfUnsupportedArches().select('id').orderBy('id')
    const repoIds = repos.map((repo) => repo.id)
    const packages = await this.packagesOfUnsupportedArches(repoIds).select('id').orderBy('id')

    return {
      distroIds: distros.map((distro) => distro.id),
      repoIds,
      packageIds: packages.map((pkg) => pkg.id),
    }
  }

  /** Repositories that serve at least one release, none of which is kept. */
  private repositoriesOfUnsupportedArches() {
    return Repo.query()
      .whereHas('distros', () => {})
      .whereDoesntHave('distros', (distros) => distros.whereIn('distros.arch', keptArches))
  }

  /**
   * Packages of an unsupported architecture, without the ones of a repository that is deleted with
   * them: those are deleted along with the repository, and counting them twice would report them
   * twice.
   */
  private packagesOfUnsupportedArches(repoIds: number[]) {
    const query = Pkg.query().whereNotNull('arch').whereNotIn('arch', keptArches)
    if (repoIds.length > 0) {
      query.where((packages) => packages.whereNull('repo_id').orWhereNotIn('repo_id', repoIds))
    }
    return query
  }

  /** One line per kind of entry, then a sample of each with the entries it names. */
  private async report({ distroIds, repoIds, packageIds }: CleanTargets) {
    this.logger.info(
      `Kept architectures: ${keptArches.map((arch) => chalk.green(arch)).join(', ')}`,
    )
    this.logger.info(
      `${chalk.red(String(distroIds.length))} distribution(s) of an unsupported architecture`,
    )
    this.logger.info(
      `${chalk.red(String(repoIds.length))} repository(ies) serving only unsupported architectures`,
    )
    this.logger.info(
      `${chalk.red(String(packageIds.length))} package(s) of an unsupported architecture`,
    )

    const distros = await Distro.query()
      .select('name', 'version', 'arch')
      .whereNotIn('arch', keptArches)
      .orderBy('id')
      .limit(this.limit)
    for (const distro of distros) {
      this.logger.info(
        `  ${chalk.cyan([distro.name, distro.version, `(${distro.arch})`].filter(Boolean).join(' '))}`,
      )
    }
    if (distroIds.length > this.limit) this.logger.info(this.andMore(distroIds.length))

    const repos = await this.repositoriesOfUnsupportedArches()
      .select('name')
      .orderBy('id')
      .limit(this.limit)
    for (const repo of repos) this.logger.info(`  ${chalk.cyan(repo.name)}`)
    if (repoIds.length > this.limit) this.logger.info(this.andMore(repoIds.length))

    const packages = await this.packagesOfUnsupportedArches(repoIds)
      .select('name', 'version', 'arch')
      .orderBy('id')
      .limit(this.limit)
    for (const pkg of packages) {
      this.logger.info(
        `  ${chalk.cyan([pkg.name, pkg.version, `(${pkg.arch})`].filter(Boolean).join(' '))}`,
      )
    }
    if (packageIds.length > this.limit) this.logger.info(this.andMore(packageIds.length))
  }

  private andMore(total: number) {
    return chalk.dim(`  and ${String(total - this.limit)} more`)
  }

  /** Delete the rows in batches. */
  private async deleteAll(ids: number[], remove: (ids: number[]) => Promise<unknown>) {
    for (let index = 0; index < ids.length; index += deleteBatchSize) {
      await remove(ids.slice(index, index + deleteBatchSize))
    }
  }
}
