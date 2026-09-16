import { BaseTransformer } from '@adonisjs/core/transformers'

import type Image from '#models/image'

export default class ImageTransformer extends BaseTransformer<Image> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'format', 'size', 'width', 'height', 'createdAt']),
      url: `/uploads/${this.resource.path}`,
    }
  }
}
