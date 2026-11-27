import { BaseTransformer } from '@adonisjs/core/transformers'

import type App from '#models/app'
import { localizedTexts } from '#services/app_translations'
import ImageTransformer from '#transformers/image_transformer'

export default class AppTransformer extends BaseTransformer<App> {
  toObject() {
    const avgRating = this.resource.$extras.avgRating
    const reviewCount = this.resource.$extras.reviewCount
    return {
      ...this.pick(this.resource, [
        'id',
        'type',
        'version',
        'license',
        'homepage',
        'appstreamId',
        'appstreamUrl',
        'appstreamContent',
        'desktopUrl',
        'desktopContent',
        'iconId',
      ]),
      /**
       * Name and summary per locale. A response carries the locale the client asked for (plus the
       * language the catalog falls back to), while the editor receives every translation.
       */
      name: localizedTexts(this.resource.translations, 'name'),
      summary: localizedTexts(this.resource.translations, 'summary'),
      icon: this.resource.icon ? ImageTransformer.transform(this.resource.icon) : null,
      /**
       * Historical AppStream IDs of the application. Repositories that still announce one of them
       * link their packages here, and a merged ID can no longer create a catalog entry of its own.
       */
      appstreamIdAliases: (this.resource.aliases ?? [])
        .map((alias) => alias.appstreamId)
        .sort((left, right) => left.localeCompare(right)),
      /**
       * Package names the application owns, used to link the packages of repositories that ship no
       * AppStream metadata for them. The format is `null` when the name is mapped in every format.
       */
      pkgNames: (this.resource.pkgNames ?? [])
        .map((mapping) => ({ name: mapping.name, type: mapping.type || null }))
        .sort(
          (left, right) =>
            left.name.localeCompare(right.name) ||
            (left.type ?? '').localeCompare(right.type ?? ''),
        ),
      /** Addons that extend the application; only the detail of an application loads them. */
      addons: (this.resource.addons ?? []).map((addon) => ({
        id: addon.id,
        appstreamId: addon.appstreamId,
        name: localizedTexts(addon.translations, 'name'),
        summary: localizedTexts(addon.translations, 'summary'),
        icon: addon.icon ? ImageTransformer.transform(addon.icon) : null,
      })),
      /**
       * Names of the distributions whose packages provide the application, unique and ordered by
       * name, which the listing draws an icon from. Only the listing reads them; another response
       * carries none.
       */
      distroNames: (this.resource.$extras.distroNames as string[] | undefined) ?? [],
      /**
       * Distributions of `distroNames` that only community or user repositories provide — an OBS
       * project or a PPA, for instance. A listing marks them, since their packages are not part of
       * the distribution itself.
       */
      unofficialDistroNames:
        (this.resource.$extras.unofficialDistroNames as string[] | undefined) ?? [],
      categories: (this.resource.categories ?? []).map((category) => ({
        id: category.id,
        code: category.code,
        parentId: category.parentId,
      })),
      isFavorite: this.resource.favoritedBy ? this.resource.favoritedBy.length > 0 : false,
      avgRating: avgRating === null || avgRating === undefined ? null : Number(avgRating),
      reviewCount: reviewCount === null || reviewCount === undefined ? null : Number(reviewCount),
    }
  }
}
