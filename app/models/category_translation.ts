import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import { CategoryTranslationSchema } from '#database/schema'
import Category from '#models/category'

/**
 * Display name of a category in one locale. The name used to be a JSON column on `categories`,
 * which made every response carry every translation and made sorting or filtering by a localized
 * name impossible. One row per category and locale keeps the localized name indexable.
 */
export default class CategoryTranslation extends CategoryTranslationSchema {
  @belongsTo(() => Category)
  declare category: BelongsTo<typeof Category>
}
