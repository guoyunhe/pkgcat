import type { HttpContext } from '@adonisjs/core/http'

import App from '#models/app'
import AppAlias from '#models/app_alias'
import AppPkgName from '#models/app_pkg_name'
import Category from '#models/category'
import { mergeApps } from '#services/app_merger'
import { pkgNameKey, type PkgNameMapping } from '#services/app_pkg_names'
import { appstreamIdKey, canonicalAppstreamId } from '#services/repo_appstream_extractor'
import AppTransformer from '#transformers/app_transformer'
import { appValidator, mergeAppValidator } from '#validators/app'

/** Sort orders the application listing accepts; `newest` is the default. */
const appSorts = ['newest', 'name', 'favorites', 'rating'] as const

type AppSort = (typeof appSorts)[number]

export default class AppsController {
  async index({ auth, request, serialize }: HttpContext) {
    const page = this.positiveInteger(request.input('page'), 1)
    const perPage = Math.min(this.positiveInteger(request.input('perPage'), 12), 50)
    const sort = this.sortOption(request.input('sort'))
    const rawQuery = request.input('q')
    const query = typeof rawQuery === 'string' ? rawQuery.trim().toLocaleLowerCase() : ''
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
        // `name` is a JSON column, so the untranslated name is extracted to sort by the name itself
        // instead of by the serialized JSON object. It is lower-cased because the extracted string
        // compares case-sensitively, which would order `2d` after `2FA`.
        appsQuery.orderByRaw(`lower(json_unquote(json_extract(apps.name, '$."en"'))) asc`)
        appsQuery.orderBy('id', 'desc')
        break
      case 'favorites':
        appsQuery.orderBy('favoriteCount', 'desc').orderBy('id', 'desc')
        break
      case 'rating':
        appsQuery.orderBy('avgRating', 'desc').orderBy('id', 'desc')
        break
      default:
        appsQuery.orderBy('id', 'desc')
    }

    if (auth.isAuthenticated) {
      appsQuery.preload('favoritedBy', (builder) => builder.where('users.id', auth.user!.id))
    }

    if (query) {
      const pattern = `%${query.replace(/[\\%_]/g, '\\$&')}%`
      appsQuery.where((searchQuery) => {
        searchQuery
          // `name` and `summary` are JSON columns, which MariaDB stores with the binary collation,
          // so they have to be lower-cased to be matched case-insensitively; a `whereILike` only
          // compares case-insensitively on the text columns, where the database collation does it.
          .whereRaw('lower(name) like ?', [pattern])
          .orWhereRaw('lower(summary) like ?', [pattern])
          .orWhereILike('version', pattern)
          .orWhereILike('license', pattern)
          .orWhereILike('appstreamId', pattern)
          .orWhereHas('aliases', (aliasQuery) => aliasQuery.whereILike('appstreamId', pattern))
      })
    }

    const categoryCodes = this.categoryCodes(request.input('category'))
    if (categoryCodes.length > 0) {
      const categoryIds = await this.categoryIdsWithDescendants(categoryCodes)
      if (categoryIds.length === 0) appsQuery.whereRaw('0 = 1')
      else {
        appsQuery.whereHas('categories', (builder) => builder.whereIn('categories.id', categoryIds))
      }
    }

    const paginator = await appsQuery.paginate(page, perPage)
    return serialize(AppTransformer.paginate(paginator.all(), paginator.getMeta()))
  }

  async show({ auth, params, serialize }: HttpContext) {
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
    return serialize(AppTransformer.transform(app))
  }

  async store({ request, response, serialize }: HttpContext) {
    const payload = await request.validateUsing(appValidator)

    const { appstreamIdAliases, pkgNames, ...attributes } = payload
    const app = await App.create(attributes)
    await this.syncAliases(app, appstreamIdAliases)
    await this.syncPkgNames(app, pkgNames)
    await app.load('icon')
    await app.load('aliases')
    await app.load('pkgNames')
    await app.load('categories')
    response.status(201)
    return serialize(AppTransformer.transform(app))
  }

  async update({ params, request, serialize }: HttpContext) {
    const app = await App.findOrFail(params.id)
    const payload = await request.validateUsing(appValidator, { meta: { appId: app.id } })

    const { appstreamIdAliases, pkgNames, ...attributes } = payload
    await app.merge(attributes).save()
    await this.syncAliases(app, appstreamIdAliases)
    await this.syncPkgNames(app, pkgNames)
    await app.load('icon')
    await app.load('aliases')
    await app.load('pkgNames')
    await app.load('categories')
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
    await app.load('icon')
    await app.load('aliases')
    await app.load('pkgNames')
    await app.load('categories')
    return serialize(AppTransformer.transform(app))
  }

  async destroy({ params, response }: HttpContext) {
    const app = await App.findOrFail(params.id)
    await app.delete()
    return response.noContent()
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

  private positiveInteger(value: unknown, fallback: number) {
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
  }

  /** Sort order requested by the listing; anything the listing does not know sorts by newness. */
  private sortOption(value: unknown): AppSort {
    return appSorts.find((sort) => sort === value) ?? 'newest'
  }

  /** Category codes of the `category` filter; the query string may repeat or comma-separate them. */
  private categoryCodes(value: unknown) {
    const values = Array.isArray(value) ? value : [value]
    const codes = values
      .flatMap((item) => (typeof item === 'string' ? item.split(',') : []))
      .map((code) => code.trim())
      .filter((code) => code !== '')
    return [...new Set(codes)]
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
