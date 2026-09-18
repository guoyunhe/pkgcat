import { hasMany, manyToMany } from '@adonisjs/lucid/orm'
import db from '@adonisjs/lucid/services/db'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'

import { RepoSchema } from '#database/schema'
import Distro from '#models/distro'
import Pkg from '#models/pkg'
import { searchScope } from '#utils/search'

/** One row of a counted entry: which repository it belongs to, and how many of what it holds. */
type CountRow = { repo_id: number; pkgCount?: string | number; appCount?: string | number }

export default class Repo extends RepoSchema {
  /**
   * Distributions the repository serves. A repository holds the packages of every distribution it
   * is linked to, and a distribution may be served by several repositories.
   */
  @manyToMany(() => Distro, {
    pivotTable: 'distro_repos',
    pivotForeignKey: 'repo_id',
    pivotRelatedForeignKey: 'distro_id',
  })
  declare distros: ManyToMany<typeof Distro>

  @hasMany(() => Pkg)
  declare packages: HasMany<typeof Pkg>

  /**
   * Repositories the search terms name: the name a repository is listed and linked by, and the
   * releases it serves, whose name it carries in turn. What a repository is read with — the address
   * its packages are fetched from, the origin it comes from — and what it publishes are not part of
   * what names it, and are left to the listing that shows them.
   */
  static search = searchScope<typeof Repo>((query, pattern) => {
    query.where((search) => {
      search
        .whereILike('name', pattern)
        .orWhereHas('distros', (distros) => distros.whereILike('name', pattern))
    })
  })

  /**
   * Recompute the counts the repository listings read and order by and store with every entry
   * (`pkg_count` and `app_count`): the packages a repository holds, and the applications those
   * packages provide — counted apart, because an application may be provided by the packages of
   * several repositories and belongs to each of them once.
   *
   * A repository holds the packages of every architecture and release it serves, and holds a
   * package of the same name for each of them, so packages are counted by name and each package the
   * repository carries counts once, however many builds of it the repository publishes.
   *
   * Every entry is counted again from what the catalog holds now, so a repository whose packages
   * were all removed ends up at zero. The counts are written statement by statement instead of in a
   * transaction: an entry the counts no longer name is the one that is zeroed, and a listing read
   * while this runs shows some entries as they were and others as they are, which its numbers and
   * its order can live with, where a transaction over the whole table would hold every write behind
   * it.
   */
  static async refreshCounts() {
    const [packageRows, applicationRows] = await Promise.all([
      db
        .from('pkgs')
        .select('repo_id')
        .whereNotNull('repo_id')
        .countDistinct('name as pkgCount')
        .groupBy('repo_id'),
      db
        .from('app_pkgs')
        .join('pkgs', 'pkgs.id', 'app_pkgs.pkg_id')
        .select('pkgs.repo_id')
        .whereNotNull('pkgs.repo_id')
        .countDistinct('app_pkgs.app_id as appCount')
        .groupBy('pkgs.repo_id'),
    ])

    const counts = new Map<number, { packages: number; applications: number }>()
    const countOf = (id: number) => {
      const count = counts.get(id) ?? { packages: 0, applications: 0 }
      counts.set(id, count)
      return count
    }

    for (const row of packageRows as CountRow[]) {
      countOf(Number(row.repo_id)).packages = Number(row.pkgCount)
    }
    for (const row of applicationRows as CountRow[]) {
      countOf(Number(row.repo_id)).applications = Number(row.appCount)
    }

    for (const [id, count] of counts) {
      await db
        .from('repos')
        .where('id', id)
        .update({ pkg_count: count.packages, app_count: count.applications })
    }

    // What is left of the stored counts after the counted entries were written belongs to
    // repositories that hold nothing
    const stored = await db
      .from('repos')
      .select('id')
      .where((query) => query.where('pkg_count', '>', 0).orWhere('app_count', '>', 0))
    const emptied = (stored as { id: number }[])
      .map((row) => row.id)
      .filter((id) => !counts.has(id))
    if (emptied.length > 0) {
      await db.from('repos').whereIn('id', emptied).update({ pkg_count: 0, app_count: 0 })
    }
  }
}
