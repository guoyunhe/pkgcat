import { belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'

import { AppSchema } from '#database/schema'
import AppAlias from '#models/app_alias'
import AppPkgName from '#models/app_pkg_name'
import AppTranslation from '#models/app_translation'
import Category from '#models/category'
import Image from '#models/image'
import Pkg from '#models/pkg'
import Review from '#models/review'
import User from '#models/user'
import { searchScope } from '#utils/search'

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
   * Name and summary of the application per locale. A response carries the locale the client asked
   * for (see `attachTranslations`), and the editor carries every translation it has.
   */
  @hasMany(() => AppTranslation)
  declare translations: HasMany<typeof AppTranslation>

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

  /**
   * Applications the search terms name: the identifier they are stored with, the identifiers they
   * have answered to before (`aliases`), and the name and summary of every language they carry,
   * which a repository announces in its own metadata. What an application is stored with rather
   * than what it is — its version, its license — is left to the listing that shows it.
   */
  static search = searchScope<typeof App>((query, pattern) => {
    query.where((search) => {
      search
        // The name and the summary are translated per locale in their own table, so the search
        // covers every language an application carries. The columns are compared as they are
        // stored, which their collation (`utf8mb4_*_ai_ci`) reads without regard to case; a column
        // stored with a binary collation would have to be compared through `lower()`.
        .whereILike('appstream_id', pattern)
        .orWhereHas('aliases', (aliasQuery) => aliasQuery.whereILike('appstream_id', pattern))
        .orWhereHas('translations', (translationQuery) =>
          translationQuery.whereILike('name', pattern).orWhereILike('summary', pattern),
        )
    })
  })
}
