import logger from '@adonisjs/core/services/logger'
import { Job } from '@adonisjs/queue'
import type { JobOptions } from '@adonisjs/queue/types'

import Repo from '#models/repo'

/** No payload: which entries are counted is read from the catalog. */
type RepoCountPayload = Record<string, never>

/** Safety net under the counts the runs that change the repositories write, safe to repeat. */
export default class RepoCount extends Job<RepoCountPayload> {
  static options: JobOptions = {
    queue: 'default',
    maxRetries: 3,
  }

  async execute() {
    await Repo.refreshCounts()
    logger.info('Refreshed counts for repositories')
  }

  async failed(error: Error) {
    logger.error({ err: error }, 'Refreshing the counts of the repositories failed')
  }
}
