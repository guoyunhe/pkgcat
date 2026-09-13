import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import { AppAliasSchema } from '#database/schema'
import App from '#models/app'

/**
 * AppStream ID an application answers to besides the one it is stored under. Aliases are what makes
 * a renamed application, or an application that was merged out of two catalog entries, import as a
 * single entry no matter which of its historical IDs a repository announces.
 */
export default class AppAlias extends AppAliasSchema {
  @belongsTo(() => App)
  declare app: BelongsTo<typeof App>
}
