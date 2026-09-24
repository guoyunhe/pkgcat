import { DateTime } from 'luxon'

import Distro from '#models/distro'
import Repo from '#models/repo'
import { refreshPackageDistros } from '#services/pkg_distros'
import RepoSynchronizer, {
  type RepoSyncOptions,
  type RepoSyncSummary,
} from '#services/repo_synchronizer'

export type { RepoSyncSummary }

/** Repositories read at a time, so that a catalog of thousands is never held in memory as a whole. */
const reposPerPage = 50

/** What a run reports while it walks the repositories of the catalog. */
export type RepoSyncEvent =
  | { type: 'skipped'; repo: Repo; reason: string }
  | { type: 'reading'; repo: Repo }
  | { type: 'read'; repo: Repo; summary: RepoSyncSummary }
  | { type: 'unreadable'; repo: Repo; message: string }
  | { type: 'empty' }
  | { type: 'done'; synced: number }

export type RepoSyncRunOptions = {
  /** `null` for every deb/rpm/pacman repository. */
  name: string | null
  /** Architecture to read a deb repository for, `null` for the ones its releases are of. */
  arch: string | null
  /** Read repositories whose sync interval has not elapsed as well. */
  force: boolean
  /** Packages each report keeps, `0` for a run that logs none of them. */
  sampleSize: number
}

/**
 * Reads the repositories of the catalog into it and yields what each of them contributed, so that
 * the command prints these reports and the job on a schedule logs them. The repositories are read
 * shortest sync interval first, a page at a time.
 */
export default class RepoSyncRunner {
  async *run(options: RepoSyncRunOptions): AsyncGenerator<RepoSyncEvent> {
    const synchronizer = new RepoSynchronizer()
    let synced = 0

    if (options.name) {
      const repo = await Repo.query().where('name', options.name).preload('distros').firstOrFail()
      const read = yield* this.syncOne(synchronizer, repo, options)
      if (read) synced += 1
    } else {
      let page = 1
      let found = 0

      while (true) {
        const paginator = await Repo.query()
          .whereIn('type', ['deb', 'rpm', 'pacman'])
          .orderByRaw('sync_interval_days is null')
          .orderBy('syncIntervalDays')
          .orderBy('name')
          .preload('distros')
          .paginate(page, reposPerPage)
        found = paginator.total

        for (const repo of paginator.all()) {
          const read = yield* this.syncOne(synchronizer, repo, options)
          if (read) synced += 1
        }
        if (!paginator.hasMorePages) break
        page += 1
      }

      // A catalog without a repository to read leaves the counts alone: the run wrote nothing
      if (found === 0) {
        yield { type: 'empty' }
        return
      }
    }

    // The counts are made of the packages the run wrote, so they are recomputed once it wrote them,
    // and the packages a release carries are read from a table of their own (`pkg_distros`), which
    // is rewritten with the same packages
    await Repo.refreshCounts()
    await Distro.refreshCounts()
    await refreshPackageDistros()

    yield { type: 'done', synced }
  }

  /** Returns whether the repository was read at all, which one its interval left out was not. */
  private async *syncOne(
    synchronizer: RepoSynchronizer,
    repo: Repo,
    options: RepoSyncRunOptions,
  ): AsyncGenerator<RepoSyncEvent, boolean> {
    const reason = skipReason(repo, options.force)
    if (reason) {
      yield { type: 'skipped', repo, reason }
      return false
    }

    yield { type: 'reading', repo }
    try {
      // A deb repository serves several architectures, so it is read once per architecture it serves
      const syncOptions: RepoSyncOptions = { arch: options.arch, sampleSize: options.sampleSize }
      for (const summary of await synchronizer.sync(repo, syncOptions)) {
        yield { type: 'read', repo, summary }
      }
    } catch (error) {
      yield { type: 'unreadable', repo, message: describeError(error) }
    }

    return true
  }
}

/** Why a repository is not synchronized, or `null` when it is. */
function skipReason(repo: Repo, force: boolean): string | null {
  if (force) return null
  if (!repo.lastSyncedAt) return null
  if (repo.syncIntervalDays === null) return 'no sync interval, use --force to sync'

  const nextSync = repo.lastSyncedAt.plus({ days: repo.syncIntervalDays })
  if (nextSync <= DateTime.now()) return null
  return `next sync at ${nextSync.toFormat('yyyy-MM-dd HH:mm')}, use --force to sync now`
}

function describeError(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}
