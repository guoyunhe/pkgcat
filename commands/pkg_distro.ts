import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

import { refreshPackageDistros } from '#services/pkg_distros'

/** Rewrite the packages each release carries; a synchronization run writes them as well. */
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
