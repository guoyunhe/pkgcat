import { belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'

import { CategorySchema } from '#database/schema'
import App from '#models/app'
import CategoryTranslation from '#models/category_translation'

export default class Category extends CategorySchema {
  @belongsTo(() => Category, { foreignKey: 'parentId' })
  declare parent: BelongsTo<typeof Category>

  @hasMany(() => Category, { foreignKey: 'parentId' })
  declare children: HasMany<typeof Category>

  /**
   * Display name of the category per locale. A response carries every translation, because the
   * frontend picks the language of the interface out of the map it receives.
   */
  @hasMany(() => CategoryTranslation)
  declare translations: HasMany<typeof CategoryTranslation>

  @manyToMany(() => App, {
    pivotTable: 'app_categories',
    pivotForeignKey: 'category_id',
    pivotRelatedForeignKey: 'app_id',
  })
  declare apps: ManyToMany<typeof App>
}
