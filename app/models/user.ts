import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { compose } from '@adonisjs/core/helpers'
import hash from '@adonisjs/core/services/hash'
import { belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'

import { UserSchema } from '#database/schema'
import App from '#models/app'
import Distro from '#models/distro'
import Image from '#models/image'
import Review from '#models/review'

export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  static accessTokens = DbAccessTokensProvider.forModel(User)
  declare currentAccessToken?: AccessToken

  @belongsTo(() => Image, { foreignKey: 'avatarId' })
  declare avatar: BelongsTo<typeof Image>

  @belongsTo(() => Distro)
  declare distro: BelongsTo<typeof Distro>

  @manyToMany(() => App, { pivotTable: 'favorites' })
  declare favoriteApps: ManyToMany<typeof App>

  @hasMany(() => Review)
  declare reviews: HasMany<typeof Review>
}
