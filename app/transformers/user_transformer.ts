import { BaseTransformer } from '@adonisjs/core/transformers'

import type User from '#models/user'
import DistroTransformer from '#transformers/distro_transformer'

export default class UserTransformer extends BaseTransformer<User> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'role', 'createdAt', 'updatedAt']),
      /** The distribution the user is running, when they named one. */
      distro: this.resource.distro ? DistroTransformer.transform(this.resource.distro) : null,
    }
  }
}
