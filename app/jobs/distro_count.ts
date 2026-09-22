import logger from '@adonisjs/core/services/logger'
import { Job } from '@adonisjs/queue'
import type { JobOptions } from '@adonisjs/queue/types'

import Distro from '#models/distro'

/**
 * The job counts every distribution from the packages its repositories hold, so it is given no
 * payload: which entries are counted is read from the catalog (`Distro.refreshCounts`) rather than
 * named by whoever dispatches the job.
 */
type DistroCountPayload = Record<string, never>

/**
 * Refreshes the counts the distribution listings read and order by (`pkg_count` and `app_count`).
 *
 * Those counts are written by the runs that change the packages of a distribution (`repo:sync`,
 * `app:prune`), so this job is the safety net under them: a run that was stopped early leaves the
 * counts of a catalog that has moved on. Counting again is safe at any time, since the stored
 * counts are derived from the packages that are in the catalog now.
 */
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
