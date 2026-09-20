import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import chalk from 'chalk'

import Pkg from '#models/pkg'
import { archIndependentPackageArch, legacyArchIndependentArches } from '#utils/arch'

/**
 * Writes the architecture of the packages that carry no machine code in the one spelling the
 * catalog stores it in. A Debian index calls such a package `all` and a pacman repository `any`,
 * which the extractors used to store as they were written, while RPM packages have always been
 * `noarch`. Every reader of an architecture knows that one name: the package listing of a
 * distribution serves the packages of its own architecture along with the ones that carry no
 * machine code, and a synchronization replaces the packages of the architecture it read. The
 * extractors write the RPM spelling, so this command is only needed for the packages that were read
 * before that.
 */
export default class PkgArch extends BaseCommand {
  static commandName = 'pkg:arch'
  static description = 'Rewrite the architecture of the packages that carry no machine code'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.boolean({
    description: 'Report the packages that would be rewritten without writing them',
  })
  declare dryRun: boolean

  async run() {
    const rows = await Pkg.query()
      .select('arch')
      .count('* as total')
      .whereIn('arch', legacyArchIndependentArches)
      .groupBy('arch')

    if (rows.length === 0) {
      this.logger.info(
        `Every package without machine code is stored as ${archIndependentPackageArch}`,
      )
      return
    }

    for (const row of rows) {
      this.logger.info(`  ${chalk.cyan(row.arch ?? '')} ${chalk.green(String(row.$extras.total))}`)
    }

    if (this.dryRun) {
      this.logger.info(`Dry run: nothing was written`)
      return
    }

    const rewritten = await Pkg.query()
      .whereIn('arch', legacyArchIndependentArches)
      .update({ arch: archIndependentPackageArch })

    this.logger.info(
      `Rewrote ${chalk.green(String(rewritten))} package(s) as ${archIndependentPackageArch}`,
    )
  }
}
