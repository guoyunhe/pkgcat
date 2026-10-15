import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import type { ImageFormat, ImageRecord } from 'adonisjs-image'

import { ImageSchema } from '#database/schema'

export class Image extends ImageSchema {
  declare format: ImageFormat

  @hasMany(() => Image, { foreignKey: 'parentId' })
  declare thumbnails: HasMany<typeof Image> & ImageRecord[]
}

export default Image
