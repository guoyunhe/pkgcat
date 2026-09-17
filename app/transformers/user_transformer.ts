import { BaseTransformer } from '@adonisjs/core/transformers'

import type User from '#models/user'
import DistroTransformer from '#transformers/distro_transformer'
import ImageTransformer from '#transformers/image_transformer'
import { gravatarUrl } from '#utils/gravatar'

export default class UserTransformer extends BaseTransformer<User> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'role', 'createdAt', 'updatedAt']),
      /** The distribution the user is running, when they named one. */
      distro: this.resource.distro ? DistroTransformer.transform(this.resource.distro) : null,
      /** The avatar the user uploaded, when they uploaded one. */
      avatar: this.resource.avatar ? ImageTransformer.transform(this.resource.avatar) : null,
      /** What the user is shown by while they have uploaded no avatar. */
      gravatarUrl: gravatarUrl(this.resource.email),
    }
  }
}
