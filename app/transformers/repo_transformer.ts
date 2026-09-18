import { BaseTransformer } from '@adonisjs/core/transformers'

import type Repo from '#models/repo'
import DistroTransformer from '#transformers/distro_transformer'

export default class RepoTransformer extends BaseTransformer<Repo> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'type',
        'source',
        'name',
        'baseUrl',
        'configUrl',
        'configContent',
        'installScript',
        'syncIntervalDays',
        'lastSyncedAt',
        'createdAt',
        'updatedAt',
        'pkgCount',
        'appCount',
      ]),
      // A repository may serve several distributions, and every architecture of a distribution is
      // its own entry
      distros: DistroTransformer.transform(this.resource.distros ?? []),
    }
  }
}
