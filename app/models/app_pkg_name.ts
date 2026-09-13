import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import { AppPkgNameSchema } from '#database/schema'
import App from '#models/app'

/**
 * Package name an application owns, used to link the packages of repositories that ship no
 * AppStream metadata for them. The name is only unique together with the package format, where an
 * empty format means that the name belongs to the application in every format.
 */
export default class AppPkgName extends AppPkgNameSchema {
  @belongsTo(() => App)
  declare app: BelongsTo<typeof App>
}
