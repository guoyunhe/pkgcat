import { BaseTransformer } from '@adonisjs/core/transformers'

import type Review from '#models/review'
import { localizedTexts } from '#services/app_translations'
import DistroTransformer from '#transformers/distro_transformer'

export default class ReviewTransformer extends BaseTransformer<Review> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'rating', 'comment', 'createdAt', 'updatedAt']),
      user: this.resource.user
        ? { id: this.resource.user.id, name: this.resource.user.name }
        : null,
      app: this.resource.app
        ? { id: this.resource.app.id, name: localizedTexts(this.resource.app.translations, 'name') }
        : null,
      /** The distribution the application was experienced on, when the review names one. */
      distro: this.resource.distro ? DistroTransformer.transform(this.resource.distro) : null,
    }
  }
}
