import { BaseTransformer } from '@adonisjs/core/transformers'

import type Distro from '#models/distro'

export default class DistroTransformer extends BaseTransformer<Distro> {
  toObject() {
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
      // The release this one is compatible with. The relation is stored and shown in one direction:
      // a release names the release it continues, so the entries that are compatible with it do not
      // have to be listed again on it.
      compatibleDistro: this.resource.compatibleDistro
        ? DistroTransformer.transform(this.resource.compatibleDistro)
        : null,
    }
  }
}
