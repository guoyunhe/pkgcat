import logger from '@adonisjs/core/services/logger'
import { Job } from '@adonisjs/queue'
import type { JobOptions } from '@adonisjs/queue/types'

import type Repo from '#models/repo'
import RepoSyncRunner, { type RepoSyncSummary } from '#services/repo_sync_runner'

/** Which repositories the run reads, matching the options of `RepoSyncRunner`. */
interface RepoSyncPayload {
  /** `null` for every deb/rpm/pacman repository. */
  name: string | null
  /** Architecture to read a deb repository for, `null` for the ones its releases are of. */
  arch: string | null
  force: boolean
}

/**
 * Reads the repositories of the catalog into it, one day's worth at a time, and logs what each of
 * them contributed. No timeout is set: a repository of tens of thousands of packages takes as long
 * as it takes, and a run that was interrupted part way through is safe to repeat.
 */
export default class RepoSync extends Job<RepoSyncPayload> {
  static options: JobOptions = {
    queue: 'default',
    maxRetries: 1,
  }

  async execute() {
    const { name, arch, force } = this.payload
    const target = name ?? 'every repository of the catalog'
    logger.info(`Synchronizing ${target}${arch ? ` for ${arch}` : ''}`)

    // A scheduled run reports what it wrote, not what it read, so no package samples are kept
    for await (const event of new RepoSyncRunner().run({ name, arch, force, sampleSize: 0 })) {
      switch (event.type) {
        case 'skipped':
          logger.debug(`${event.repo.name}: skipped, ${event.reason}`)
          break

        case 'reading':
          logger.info(`Extracting packages from ${event.repo.name} (${event.repo.type})`)
          break

        case 'read':
          logSummary(event.repo, event.summary)
          break

        case 'unreadable':
          logger.warn(`${event.repo.name}: ${event.message}`)
          break

        case 'empty':
          logger.warn('No deb/rpm/pacman repository to synchronize')
          return

        case 'done':
          logger.info(
            `Synchronized ${event.synced} ${event.synced === 1 ? 'repository' : 'repositories'}`,
          )
          if (event.synced === 0) {
            logger.warn('No repository was due for synchronization')
          }
          break
      }
    }
  }

  async failed(error: Error) {
    logger.error({ err: error }, 'Synchronizing the repositories failed')
  }
}

/** Log what one architecture of a repository contributed, and what it could not read. */
function logSummary(repo: Repo, summary: RepoSyncSummary) {
  const label = summary.arch ? `${repo.name} (${summary.arch})` : repo.name

  for (const warning of summary.warnings) logger.warn(`${label}: ${warning}`)

  logger.info(
    `${label}: ${summary.packages.total} packages` +
      ` (${summary.packages.created} created, ${summary.packages.updated} updated,` +
      ` ${summary.packages.deleted} removed)`,
  )
  if (summary.components > 0) {
    logger.info(
      `${label}: ${summary.components} appstream components` +
        ` (${summary.apps.created} apps created, ${summary.apps.updated} updated,` +
        ` ${summary.apps.skipped} skipped, ${summary.apps.icons} icons,` +
        ` ${summary.apps.linked} packages linked)`,
    )
  }
  if (summary.apps.inferred > 0) {
    logger.info(`${label}: ${summary.apps.inferred} app(s) inferred from package file lists`)
  }
  if (summary.apps.mapped > 0) {
    logger.info(`${label}: ${summary.apps.mapped} package(s) linked by package name`)
  }
}
