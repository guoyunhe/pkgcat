import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

import Repo from '#models/repo'

export default class RepoCount extends BaseCommand {
  static commandName = 'repo:count'
  static description = 'Refresh pkgCount and appCount for repositories'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    await Repo.refreshCounts()
    this.logger.info(`Refreshed counts for repositories`)
  }
}
