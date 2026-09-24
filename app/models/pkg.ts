import { belongsTo, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'

import { PkgSchema } from '#database/schema'
import App from '#models/app'
import Distro from '#models/distro'
import Repo from '#models/repo'
import { searchScope } from '#utils/search'

export default class Pkg extends PkgSchema {
  /** Applications the package provides; a package may be linked to several of them. */
  @manyToMany(() => App, {
    pivotTable: 'app_pkgs',
    pivotForeignKey: 'pkg_id',
    pivotRelatedForeignKey: 'app_id',
  })
  declare apps: ManyToMany<typeof App>

  @belongsTo(() => Repo)
  declare repo: BelongsTo<typeof Repo>

  /**
   * Releases that carry the package, which the repositories of a release, the release it is binary
   * compatible with and the architecture of every package settle when the link is written.
   */
  @manyToMany(() => Distro, {
    pivotTable: 'pkg_distros',
    pivotForeignKey: 'pkg_id',
    pivotRelatedForeignKey: 'distro_id',
  })
  declare distros: ManyToMany<typeof Distro>

  /**
   * Packages the search terms name: the name a package is listed and looked up by. What a package
   * is — its version, its architecture, the format it is packaged in — is left to the listing that
   * shows it, which filters by them.
   */
  static search = searchScope<typeof Pkg>((query, pattern) => {
    query.whereILike('name', pattern)
  })
}
