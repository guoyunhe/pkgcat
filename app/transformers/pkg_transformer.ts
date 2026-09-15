import { BaseTransformer } from '@adonisjs/core/transformers'

import type Pkg from '#models/pkg'
import { localizedTexts } from '#services/app_translations'
import RepoTransformer from '#transformers/repo_transformer'

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
      // Every package of a repository was extracted from it, which is what the detail page of a
      // package links back to; an uploaded package belongs to no repository
      repo: RepoTransformer.transform(this.resource.repo ?? null),
      // A package may provide several applications, and an application may be made of several
      // packages (the link is a many-to-many one)
      apps: (this.resource.apps ?? []).map((app) => ({
        id: app.id,
        name: localizedTexts(app.translations, 'name'),
      })),
    }
  }
}
