import { BaseTransformer } from '@adonisjs/core/transformers'

import type Review from '#models/review'
import { localizedTexts } from '#services/app_translations'
import DistroTransformer from '#transformers/distro_transformer'
import ImageTransformer from '#transformers/image_transformer'
import { gravatarUrl } from '#utils/gravatar'

export default class ReviewTransformer extends BaseTransformer<Review> {
  toObject() {
    const user = this.resource.user
    return {
      ...this.pick(this.resource, [
        'id',
        'rating',
        'comment',
        // The language the review is written in, when its author named one
        'locale',
        'createdAt',
        'updatedAt',
      ]),
      user: user
        ? {
            id: user.id,
            name: user.name,
            avatar: user.avatar ? ImageTransformer.describe(user.avatar) : null,
            /** What the author is shown by while they have uploaded no avatar. */
            gravatarUrl: gravatarUrl(user.email),
          }
        : null,
      app: this.resource.app
        ? { id: this.resource.app.id, name: localizedTexts(this.resource.app.translations, 'name') }
        : null,
      /** The distribution the application was experienced on, when the review names one. */
      distro: this.resource.distro ? DistroTransformer.transform(this.resource.distro) : null,
    }
  }
}
