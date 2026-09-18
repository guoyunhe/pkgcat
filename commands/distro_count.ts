import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

import Distro from '#models/distro'

export default class DistroCount extends BaseCommand {
  static commandName = 'distro:count'
  static description = 'Refresh pkgCount and appCount for distributions'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    await Distro.refreshCounts()
    this.logger.info(`Refreshed counts for distributions`)
  }
}
