import { belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'

import { CategorySchema } from '#database/schema'
import App from '#models/app'

export default class Category extends CategorySchema {
  @belongsTo(() => Category, { foreignKey: 'parentId' })
  declare parent: BelongsTo<typeof Category>

  @hasMany(() => Category, { foreignKey: 'parentId' })
  declare children: HasMany<typeof Category>

  @manyToMany(() => App, {
    pivotTable: 'app_categories',
    pivotForeignKey: 'category_id',
    pivotRelatedForeignKey: 'app_id',
  })
  declare apps: ManyToMany<typeof App>
}
