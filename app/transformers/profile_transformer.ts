import { BaseTransformer } from '@adonisjs/core/transformers'

import type User from '#models/user'

/**
 * A user as its own account reads it. The email belongs to the account and not to the catalog, so
 * it is only ever answered to the user itself: `UserTransformer`, which the public pages use,
 * leaves it out. The distribution the account runs is named by its id, because the only reader is
 * the settings form, which already holds the catalog it resolves the entry from.
 */
export default class ProfileTransformer extends BaseTransformer<User> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'name',
      'email',
      'role',
      'distroId',
      'createdAt',
      'updatedAt',
    ])
  }
}
