import { belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'

import { AppSchema } from '#database/schema'
import AppAlias from '#models/app_alias'
import AppPkgName from '#models/app_pkg_name'
import Category from '#models/category'
import Image from '#models/image'
import Pkg from '#models/pkg'
import Review from '#models/review'
import User from '#models/user'

export default class App extends AppSchema {
  @belongsTo(() => Image, { foreignKey: 'iconId' })
  declare icon: BelongsTo<typeof Image>

  @hasMany(() => Review)
  declare reviews: HasMany<typeof Review>

  /**
   * Historical AppStream IDs the application answers to. A repository that still announces one of
   * them links its packages to this application instead of creating a second one.
   */
  @hasMany(() => AppAlias)
  declare aliases: HasMany<typeof AppAlias>

  /**
   * Package names the application owns. Repositories that ship no AppStream metadata for a package
   * leave its name as the only way to tell which application it belongs to.
   */
  @hasMany(() => AppPkgName)
  declare pkgNames: HasMany<typeof AppPkgName>

  /**
   * Packages that provide the application. A package ships several applications when it carries
   * several AppStream metadata files, and one metadata file may hold several components.
   */
  @manyToMany(() => Pkg, {
    pivotTable: 'app_pkgs',
    pivotForeignKey: 'app_id',
    pivotRelatedForeignKey: 'pkg_id',
  })
  declare packages: ManyToMany<typeof Pkg>

  @manyToMany(() => Category, {
    pivotTable: 'app_categories',
    pivotForeignKey: 'app_id',
    pivotRelatedForeignKey: 'category_id',
  })
  declare categories: ManyToMany<typeof Category>

  @manyToMany(() => User, { pivotTable: 'favorites' })
  declare favoritedBy: ManyToMany<typeof User>
}
