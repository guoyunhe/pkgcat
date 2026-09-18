import { belongsTo, manyToMany } from '@adonisjs/lucid/orm'
import db from '@adonisjs/lucid/services/db'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

import { DistroSchema } from '#database/schema'
import Repo from '#models/repo'
import { searchScope } from '#utils/search'

/** One row of a counted entry: which distribution it belongs to, and how many of what it holds. */
type CountRow = { distro_id: number; pkgCount?: string | number; appCount?: string | number }

type OsReleaseValues = Record<string, string>

function parseOsRelease(contents: string): OsReleaseValues {
  return Object.fromEntries(
    contents
      .split('\n')
      .map((line) => line.match(/^([A-Z0-9_]+)=(.*)$/))
      .filter((match): match is RegExpMatchArray => match !== null)
      .map(([_, key, rawValue]) => [key, rawValue.replace(/^(?:"|')|(?:"|')$/g, '')]),
  )
}

function isRollingRelease(values: OsReleaseValues) {
  const identifier = `${values.ID ?? ''} ${values.NAME ?? ''}`.toLowerCase()
  return identifier.includes('rolling') || identifier.includes('tumbleweed')
}

function parseDate(value: string | undefined) {
  if (!value) return null

  const date = DateTime.fromISO(value)
  return date.isValid ? date : null
}

export default class Distro extends DistroSchema {
  /**
   * The release this one is binary compatible with: the packages built for either of them can be
   * installed on the other. A distribution that continues another one names it here, which is how
   * the rebuilds of a distribution and the releases they are built from are related, while a
   * release that continues nothing leaves it empty. The relation is stored in one direction, which
   * is also the one the catalog shows.
   */
  @belongsTo(() => Distro, { foreignKey: 'compatibleDistroId' })
  declare compatibleDistro: BelongsTo<typeof Distro>

  /**
   * Repositories of the distribution. A distribution is one release for one architecture, and the
   * repositories that serve it hold the packages of that architecture.
   */
  @manyToMany(() => Repo, {
    pivotTable: 'distro_repos',
    pivotForeignKey: 'distro_id',
    pivotRelatedForeignKey: 'repo_id',
  })
  declare repos: ManyToMany<typeof Repo>

  /**
   * Releases the search terms name: the distribution a release is a release of. Which release it is
   * — its version and its architecture — and what it packages are left to the listing that shows
   * them, which filters by them.
   */
  static search = searchScope<typeof Distro>((query, pattern) => {
    query.whereILike('name', pattern)
  })

  static fromOsRelease(contents: string) {
    const values = parseOsRelease(contents)

    if (!values.NAME) throw new Error('The os-release file does not define NAME')

    return {
      name: values.NAME,
      version: isRollingRelease(values) ? null : (values.VERSION_ID ?? null),
      releaseDate: parseDate(values.RELEASE_DATE),
      eolDate: parseDate(values.EOL_DATE),
    }
  }

  /**
   * Recompute the counts the distribution listings read and order by and store with every entry
   * (`pkg_count` and `app_count`): the packages of the repositories serving the distribution, and
   * the applications those packages provide — counted apart, because an application may be provided
   * by the packages of several repositories and belongs to the distribution once.
   *
   * A distribution is counted from what its repositories hold now, so one whose packages were all
   * removed ends up at zero. Every entry is counted again, and the counts are written statement by
   * statement instead of in a transaction, like the counts of a repository (`Repo.refreshCounts`).
   */
  static async refreshCounts() {
    const [packageRows, applicationRows] = await Promise.all([
      db
        .from('distro_repos')
        .join('pkgs', 'pkgs.repo_id', 'distro_repos.repo_id')
        .select('distro_repos.distro_id')
        .count('* as pkgCount')
        .groupBy('distro_repos.distro_id'),
      db
        .from('distro_repos')
        .join('pkgs', 'pkgs.repo_id', 'distro_repos.repo_id')
        .join('app_pkgs', 'app_pkgs.pkg_id', 'pkgs.id')
        .select('distro_repos.distro_id')
        .countDistinct('app_pkgs.app_id as appCount')
        .groupBy('distro_repos.distro_id'),
    ])

    const counts = new Map<number, { packages: number; applications: number }>()
    const countOf = (id: number) => {
      const count = counts.get(id) ?? { packages: 0, applications: 0 }
      counts.set(id, count)
      return count
    }

    for (const row of packageRows as CountRow[]) {
      countOf(Number(row.distro_id)).packages = Number(row.pkgCount)
    }
    for (const row of applicationRows as CountRow[]) {
      countOf(Number(row.distro_id)).applications = Number(row.appCount)
    }

    for (const [id, count] of counts) {
      await db
        .from('distros')
        .where('id', id)
        .update({ pkg_count: count.packages, app_count: count.applications })
    }

    // What is left of the stored counts after the counted entries were written belongs to
    // distributions that hold nothing
    const stored = await db
      .from('distros')
      .select('id')
      .where((query) => query.where('pkg_count', '>', 0).orWhere('app_count', '>', 0))
    const emptied = (stored as { id: number }[])
      .map((row) => row.id)
      .filter((id) => !counts.has(id))
    if (emptied.length > 0) {
      await db.from('distros').whereIn('id', emptied).update({ pkg_count: 0, app_count: 0 })
    }
  }
}
