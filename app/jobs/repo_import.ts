import logger from '@adonisjs/core/services/logger'
import { Job } from '@adonisjs/queue'
import type { JobOptions } from '@adonisjs/queue/types'

import ObsRepositoryImporter, { obsImportProgress } from '#services/obs_repository_importer'

/** Which projects the run reads, matching the options of `ObsRepositoryImporter`. */
interface RepoImportPayload {
  /** `null` for the whole build service. */
  project: string | null
  dryRun: boolean
  concurrency: number
}

/**
 * Imports the repositories build.opensuse.org publishes for the releases of the catalog. No timeout
 * is set, since reading the whole service takes minutes, and what a run wrote it wrote, so a second
 * attempt is safe.
 */
export default class RepoImport extends Job<RepoImportPayload> {
  static options: JobOptions = {
    queue: 'default',
    maxRetries: 1,
  }

  async execute() {
    const { project, dryRun, concurrency } = this.payload
    logger.info(`Importing what build.opensuse.org publishes for ${project ?? 'every project'}`)

    // The thousands of publish areas are not logged one by one, only how far the run got
    const summary = await new ObsRepositoryImporter().run({
      project,
      dryRun,
      concurrency,
      onProgress: (progress) => logger.info(obsImportProgress(progress)),
    })
    const { counts, progress, failures, unknownReleases, takenNames } = summary

    logger.info(
      `${counts.created} created, ${counts.updated} updated,` +
        ` ${counts.unchanged} unchanged, ${counts.skipped} skipped`,
    )
    logger.info(obsImportProgress(progress))
    for (const failure of failures) logger.warn(`Failed to import ${failure}`)
    if (project && Object.values(counts).every((count) => count === 0)) {
      logger.warn(`${project} holds no repository the catalog could take`)
    }
    if (unknownReleases.length > 0) {
      logger.warn(
        `${unknownReleases.join(', ')} are not releases of the catalog, they are left out`,
      )
    }
    if (takenNames.length > 0) {
      logger.warn(`${takenNames.join(', ')} are names another repository already holds`)
    }
  }

  async failed(error: Error) {
    logger.error({ err: error }, 'Importing the repositories of the build service failed')
  }
}
