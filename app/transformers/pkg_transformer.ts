import { BaseTransformer } from '@adonisjs/core/transformers'

import type Pkg from '#models/pkg'

export default class PkgTransformer extends BaseTransformer<Pkg> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'type',
        'name',
        'version',
        'release',
        'arch',
        'license',
        'summary',
        'description',
        'downloadUrl',
        'checksum',
        'checksumType',
        'size',
        'installCommand',
      ]),
      // Uploaded package files are served from the local disk, keyed by their stored path.
      url: this.resource.path ? `/uploads/${this.resource.path}` : null,
      // A package may provide several applications, and an application may be made of several
      // packages (the link is a many-to-many one)
      apps: (this.resource.apps ?? []).map((app) => ({ id: app.id, name: app.name })),
    }
  }
}
