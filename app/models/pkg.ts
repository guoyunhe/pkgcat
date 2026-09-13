import { belongsTo, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'

import { PkgSchema } from '#database/schema'
import App from '#models/app'
import Repo from '#models/repo'

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
}
