import { belongsTo, hasManyThrough, manyToMany, scope } from '@adonisjs/lucid/orm'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import type { BelongsTo, HasManyThrough, ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

import { DistroSchema } from '#database/schema'
import DistroRepo from '#models/distro_repo'
import Pkg from '#models/pkg'
import Repo from '#models/repo'

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
   * Packages the release is served, which are the packages of the repositories serving it. A
   * package belongs to one repository, so a repository shared by several releases holds the
   * packages of each of them.
   */
  @hasManyThrough([() => Pkg, () => DistroRepo], {
    foreignKey: 'distroId',
    throughLocalKey: 'repoId',
    throughForeignKey: 'repoId',
  })
  declare pkgs: HasManyThrough<typeof Pkg>

  /**
   * Counts a release is read with — its listing shows them next to every entry, and its own page
   * shows them for the one release it opens: the packages the release is served, and the
   * applications those packages provide, counted apart so that an application provided by the
   * packages of several repositories is counted once. An aggregate reports one number, so the two
   * are read apart as well, and the applications are counted through the packages that provide
   * them, which is the one step of the chain the catalog keeps no relation for.
   */
  static withCounts = scope((query: ModelQueryBuilderContract<typeof Distro>) => {
    query
      .withAggregate('pkgs', (subQuery) => subQuery.count('*').as('pkgCount'))
      .withAggregate('pkgs', (subQuery) =>
        subQuery
          .join('app_pkgs', 'app_pkgs.pkg_id', 'pkgs.id')
          .countDistinct('app_pkgs.app_id')
          .as('appCount'),
      )
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
}
