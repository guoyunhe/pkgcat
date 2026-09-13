import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import { AppTranslationSchema } from '#database/schema'
import App from '#models/app'

/**
 * Name and summary of an application in one locale. The text lives in its own table instead of a
 * JSON column on `apps` so that a listing only carries the locale the client asks for, and so that
 * the localized name can be indexed for sorting. A locale may translate the name, the summary, or
 * both.
 */
export default class AppTranslation extends AppTranslationSchema {
  @belongsTo(() => App)
  declare app: BelongsTo<typeof App>
}
