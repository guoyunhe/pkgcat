import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

import { refreshPackageDistros } from '#services/pkg_distros'

/**
 * Rewrites the table of the packages a release carries, which every listing of a release reads. A
 * synchronization run writes it as well; this is what repairs it on its own.
 */
export default class PkgDistro extends BaseCommand {
  static commandName = 'pkg:distro'
  static description = 'Rewrite the packages each release carries'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    await refreshPackageDistros()
    this.logger.info('Rewrote the packages of every release')
  }
}
