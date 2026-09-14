import { BaseTransformer } from '@adonisjs/core/transformers'

import type User from '#models/user'

/**
 * A user as its own account reads it. The email belongs to the account and not to the catalog, so
 * it is only ever answered to the user itself: `UserTransformer`, which the public pages use,
 * leaves it out.
 */
export default class ProfileTransformer extends BaseTransformer<User> {
  toObject() {
    return this.pick(this.resource, ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'])
  }
}
