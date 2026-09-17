import { BaseTransformer } from '@adonisjs/core/transformers'

import type Image from '#models/image'

export default class ImageTransformer extends BaseTransformer<Image> {
  /** Where the bytes of an image are served from, which is what a reader of them is given. */
  static url(image: Pick<Image, 'path'>) {
    return `/uploads/${image.path}`
  }

  /**
   * What an image is described by. A response that already carries a nested value — the author of a
   * review — builds the same object itself, because a transformer is resolved one level deep.
   */
  static describe(image: Image) {
    return {
      id: image.id,
      format: image.format,
      size: image.size,
      width: image.width,
      height: image.height,
      createdAt: image.createdAt,
      url: ImageTransformer.url(image),
    }
  }

  toObject() {
    return ImageTransformer.describe(this.resource)
  }
}
