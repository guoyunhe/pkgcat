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
      ]),
      // The release this one is compatible with, and the ones that name it. Compatibility holds
      // both ways, so the two directions name the same releases and the client only has to read the
      // one that is filled in.
      compatibleDistro: this.resource.compatibleDistro
        ? DistroTransformer.transform(this.resource.compatibleDistro)
        : null,
      compatibleDistros: DistroTransformer.transform(this.resource.compatibleDistros ?? []),
    }
  }
}
