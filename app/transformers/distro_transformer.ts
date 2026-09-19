import { BaseTransformer } from '@adonisjs/core/transformers'

import type Distro from '#models/distro'

export default class DistroTransformer extends BaseTransformer<Distro> {
  toObject() {
    const userCount = this.resource.$extras.userCount
    return {
      ...this.pick(this.resource, [
        'id',
        'name',
        'version',
        'pkgType',
        'arch',
        'releaseDate',
        'eolDate',
        'pkgCount',
        'appCount',
      ]),
      // Users that run the release, which the database counts for the entries it lists rather than
      // storing with them the way the package and application counts are; an entry serialized by a
      // path that did not ask for the count carries none
      userCount: userCount === null || userCount === undefined ? null : Number(userCount),
      // The release this one is compatible with. The relation is stored and shown in one direction:
      // a release names the release it continues, so the entries that are compatible with it do not
      // have to be listed again on it.
      compatibleDistro: this.resource.compatibleDistro
        ? DistroTransformer.transform(this.resource.compatibleDistro)
        : null,
    }
  }
}
