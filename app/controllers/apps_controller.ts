import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

import App from '#models/app'
import AppAlias from '#models/app_alias'
import AppPkgName from '#models/app_pkg_name'
import Category from '#models/category'
import Distro from '#models/distro'
import { fallbackLocale } from '#services/app_locales'
import { mergeApps } from '#services/app_merger'
import { pkgNameKey, type PkgNameMapping } from '#services/app_pkg_names'
import { attachTranslations, replaceTranslations } from '#services/app_translations'
import { appStreamFields, fetchAppStream } from '#services/appstream_import'
import { appstreamIdKey, canonicalAppstreamId } from '#services/repo_appstream_extractor'
import AppTransformer from '#transformers/app_transformer'
import {
  appListValidator,
  appLocaleValidator,
  appValidator,
  appstreamContentValidator,
  appstreamUrlValidator,
  mergeAppValidator,
} from '#validators/app'

/** Conditions Lucid hands to a join callback; knex's join clause, which Lucid types loosely. */
type JoinConditions = {
  on(column: string, otherColumn: string): JoinConditions
  andOnVal(column: string, value: unknown): JoinConditions
}

export default class AppsController {
  async index({ auth, request, serialize }: HttpContext) {
    const {
      page,
      perPage,
      sort,
      type,
      withIcon,
      category,
      distroId,
      q: query,
      locale,
    } = await request.validateUsing(appListValidator)
    const appsQuery = App.query()
      .preload('icon')
      .preload('aliases')
      .preload('pkgNames')
      .preload('categories')
      .withAggregate('reviews', (subQuery) => subQuery.avg('rating').as('avgRating'))
      .withAggregate('reviews', (subQuery) => subQuery.count('*').as('reviewCount'))
      .withAggregate('favoritedBy', (subQuery) => subQuery.count('*').as('favoriteCount'))

    // Applications that compare equal are ordered by the newest one, so that paging stays stable
    switch (sort) {
      case 'name':
        // The name is translated per locale in its own table, so the listing joins the locale it
        // sorts by and orders along its `(locale, name)` index, instead of extracting the name out
        // of a JSON column row by row, which no index can serve. Applications that do not translate
        // the sort locale keep coming first, the way the extracted NULL name did.
        appsQuery
          .select('apps.*')
          .leftJoin('app_translations as sort_name', (join: JoinConditions) => {
            join.on('sort_name.app_id', 'apps.id').andOnVal('sort_name.locale', fallbackLocale())
          })
        appsQuery.orderBy('sort_name.name', 'asc').orderBy('sort_name.app_id', 'asc')
        break
      case 'favorites':
        appsQuery.orderBy('favoriteCount', 'desc').orderBy('id', 'desc')
        break
      case 'rating':
        appsQuery.orderBy('avgRating', 'desc').orderBy('id', 'desc')
        break
      case 'random':
        // Read by the home page, which shows a different handful of applications on every visit.
        // The order is asked of the database, which reads the applications it sorts from the index
        // of the icon where the listing holds the ones that carry an icon: a handful is taken out of
        // those rather than out of the catalog, so the table is not ordered for every visit.
        appsQuery.orderByRaw('RAND()')
        break
      default:
        appsQuery.orderBy('id', 'desc')
    }

    if (auth.isAuthenticated) {
      appsQuery.preload('favoritedBy', (builder) => builder.where('users.id', auth.user!.id))
    }

    if (query) {
      appsQuery.apply((scopes) => scopes.search(query))
    }

    if (category.length > 0) {
      const categoryIds = await this.categoryIdsWithDescendants(category)
      if (categoryIds.length === 0) appsQuery.whereRaw('0 = 1')
      else {
        appsQuery.whereHas('categories', (builder) => builder.whereIn('categories.id', categoryIds))
      }
    }

    if (type) appsQuery.where('apps.type', type)
    if (withIcon) appsQuery.whereNotNull('apps.icon_id')

    if (distroId) {
      // The applications a release serves are the ones its packages provide, which its counts are
      // made of as well (`Distro.refreshCounts`): the links are read as one subquery of the release,
      // which the database resolves once, instead of as a condition re-read for every application.
      // The release it is binary compatible with answers for the same packages, so its applications
      // are listed with them (a Linux Mint reads what Ubuntu and its vendors publish, see
      // `PkgsController.index`).
      const distro = await Distro.find(distroId)
      if (distro) {
        const releases = [
          distro.id,
          ...(distro.compatibleDistroId ? [distro.compatibleDistroId] : []),
        ]
        appsQuery.whereIn(
          'apps.id',
          db
            .from('distro_repos')
            .join('pkgs', 'pkgs.repo_id', 'distro_repos.repo_id')
            .join('app_pkgs', 'app_pkgs.pkg_id', 'pkgs.id')
            .whereIn('distro_repos.distro_id', releases)
            .select('app_pkgs.app_id'),
        )
      } else {
        // A release that does not exist, or that no repository serves, holds no application, which
        // its counts say as well
        appsQuery.whereRaw('0 = 1')
      }
    }

    const paginator = await appsQuery.paginate(page, perPage)
    await attachTranslations(paginator.all(), locale)
    return serialize(AppTransformer.paginate(paginator.all(), paginator.getMeta()))
  }

  async show({ auth, params, request, serialize }: HttpContext) {
    const { locale } = await request.validateUsing(appLocaleValidator)
    const appQuery = App.query()
      .where('id', params.id)
      .preload('icon')
      .preload('aliases')
      .preload('pkgNames')
      .preload('categories')
      .withAggregate('reviews', (subQuery) => subQuery.avg('rating').as('avgRating'))
      .withAggregate('reviews', (subQuery) => subQuery.count('*').as('reviewCount'))
    if (auth.isAuthenticated) {
      appQuery.preload('favoritedBy', (builder) => builder.where('users.id', auth.user!.id))
    }
    const app = await appQuery.firstOrFail()
    await attachTranslations([app], locale)
    return serialize(AppTransformer.transform(app))
  }

  async store({ request, response, serialize }: HttpContext) {
    const payload = await request.validateUsing(appValidator)

    const { appstreamIdAliases, pkgNames, name, summary, ...attributes } = payload
    const app = await App.create(attributes)
    await this.syncAliases(app, appstreamIdAliases)
    await this.syncPkgNames(app, pkgNames)
    await replaceTranslations(app, name, summary)
    await this.loadApp(app)
    response.status(201)
    return serialize(AppTransformer.transform(app))
  }

  async update({ params, request, serialize }: HttpContext) {
    const app = await App.findOrFail(params.id)
    const payload = await request.validateUsing(appValidator, { meta: { appId: app.id } })

    const { appstreamIdAliases, pkgNames, name, summary, ...attributes } = payload
    await app.merge(attributes).save()
    await this.syncAliases(app, appstreamIdAliases)
    await this.syncPkgNames(app, pkgNames)
    await replaceTranslations(app, name, summary)
    await this.loadApp(app)
    return serialize(AppTransformer.transform(app))
  }

  /**
   * Fold the application named in the request into the one in the URL, which is what unifies the
   * catalog entries that were imported under the different AppStream IDs of one application. The
   * AppStream ID of the merged application becomes an alias of the one that remains, so that
   * repositories announcing it keep linking to the same entry.
   */
  async merge({ params, request, serialize }: HttpContext) {
    const app = await App.findOrFail(params.id)
    const { sourceId } = await request.validateUsing(mergeAppValidator)
    const source = await App.findOrFail(sourceId)

    await mergeApps(app, source)
    await app.refresh()
    await this.loadApp(app)
    return serialize(AppTransformer.transform(app))
  }

  async destroy({ params, response }: HttpContext) {
    const app = await App.findOrFail(params.id)
    await app.delete()
    return response.noContent()
  }

  /**
   * Read the AppStream metadata a URL publishes, which the editor imports into the form. The
   * document is downloaded by the server because it lives on hosts that do not answer a request
   * from a page.
   */
  async appstream({ request, serialize }: HttpContext) {
    const { url } = await request.validateUsing(appstreamUrlValidator)
    const content = await fetchAppStream(url)

    return serialize({ content })
  }

  /**
   * Fields an AppStream document declares, which the editor fills the form with. Reading the
   * document on the server keeps the editor and the importer of the repositories on the same
   * parser, and the locales of the metadata are resolved to the locales of the catalog the same way
   * they are when an application is imported.
   */
  async appstreamFields({ request, serialize }: HttpContext) {
    const { content } = await request.validateUsing(appstreamContentValidator)
    const fields = appStreamFields(content)
    if (!fields) {
      throw new Exception('The content is not an AppStream component', { status: 422 })
    }

    return serialize(fields)
  }

  /**
   * Replace the aliases of an application with the ones the request lists. Aliases are stored in
   * the canonical form repositories announce them in, and the ID the application is stored under is
   * never an alias of itself. A request that omits the aliases leaves the stored ones alone.
   */
  private async syncAliases(app: App, aliases: string[] | undefined) {
    if (!aliases) return

    const wanted = new Map<string, string>()
    for (const alias of aliases) {
      const id = canonicalAppstreamId(alias)
      if (appstreamIdKey(id) === appstreamIdKey(app.appstreamId ?? '')) continue
      wanted.set(appstreamIdKey(id), id)
    }

    const stored = await AppAlias.query().where('appId', app.id)
    const known = new Set<string>()
    for (const alias of stored) {
      const key = appstreamIdKey(alias.appstreamId)
      if (wanted.has(key)) {
        known.add(key)
        continue
      }
      await alias.delete()
    }

    for (const [key, id] of wanted) {
      if (known.has(key)) continue
      await AppAlias.create({ appId: app.id, appstreamId: id })
    }
  }

  /**
   * Replace the package name mappings of an application with the ones the request lists. The name
   * is kept the way it is written and the format is normalized to lower case, where an empty format
   * maps the name in every package format. A request that omits the mappings leaves the stored ones
   * alone.
   */
  private async syncPkgNames(
    app: App,
    mappings: Array<{ name: string; type?: string | null }> | undefined,
  ) {
    if (!mappings) return

    const wanted = new Map<string, PkgNameMapping>()
    for (const mapping of mappings) {
      const name = mapping.name?.trim()
      if (!name) continue
      const type = mapping.type?.trim().toLowerCase() ?? ''
      wanted.set(pkgNameKey(name, type), { name, type })
    }

    const stored = await AppPkgName.query().where('appId', app.id)
    const known = new Set<string>()
    for (const mapping of stored) {
      const key = pkgNameKey(mapping.name, mapping.type)
      if (wanted.has(key)) {
        known.add(key)
        continue
      }
      await mapping.delete()
    }

    for (const [key, mapping] of wanted) {
      if (known.has(key)) continue
      await AppPkgName.create({ appId: app.id, ...mapping })
    }
  }

  /** Relations every application response carries, with the translations the editor needs. */
  private async loadApp(app: App) {
    await app.load('icon')
    await app.load('aliases')
    await app.load('pkgNames')
    await app.load('categories')
    await attachTranslations([app], null)
  }

  /**
   * Ids of the selected categories together with everything nested below them, so that filtering by
   * a main category also returns the applications filed under its more specific categories.
   */
  private async categoryIdsWithDescendants(codes: string[]) {
    const categories = await Category.query().select('id', 'code', 'parentId')
    const children = new Map<number, number[]>()
    for (const category of categories) {
      if (category.parentId === null) continue
      const siblings = children.get(category.parentId) ?? []
      siblings.push(category.id)
      children.set(category.parentId, siblings)
    }

    const ids = new Set<number>()
    const pending = categories.filter((category) => codes.includes(category.code)).map((c) => c.id)
    while (pending.length > 0) {
      const id = pending.pop()!
      if (ids.has(id)) continue
      ids.add(id)
      pending.push(...(children.get(id) ?? []))
    }
    return [...ids]
  }
}
