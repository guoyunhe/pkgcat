import logger from '@adonisjs/core/services/logger'
import { Job } from '@adonisjs/queue'
import type { JobOptions } from '@adonisjs/queue/types'

import Distro from '#models/distro'

/** No payload: which entries are counted is read from the catalog. */
type DistroCountPayload = Record<string, never>

/** Safety net under the counts the runs that change the distributions write, safe to repeat. */
export default class DistroCount extends Job<DistroCountPayload> {
  static options: JobOptions = {
    queue: 'default',
    maxRetries: 3,
  }

  async execute() {
    await Distro.refreshCounts()
    logger.info('Refreshed counts for distributions')
  }

  async failed(error: Error) {
    logger.error({ err: error }, 'Refreshing the counts of the distributions failed')
  }
}
