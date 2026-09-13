import type { HttpContext } from '@adonisjs/core/http'

import App from '#models/app'
import Category from '#models/category'
import AppTransformer from '#transformers/app_transformer'
import { appValidator } from '#validators/app'

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
          .whereILike('name', pattern)
          .orWhereILike('summary', pattern)
          .orWhereILike('version', pattern)
          .orWhereILike('license', pattern)
          .orWhereILike('appstreamId', pattern)
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

    const app = await App.create(payload)
    await app.load('icon')
    await app.load('categories')
    response.created()
    return serialize(AppTransformer.transform(app))
  }

  async update({ params, request, serialize }: HttpContext) {
    const app = await App.findOrFail(params.id)
    const payload = await request.validateUsing(appValidator, { meta: { appId: app.id } })

    await app.merge(payload).save()
    await app.load('icon')
    await app.load('categories')
    return serialize(AppTransformer.transform(app))
  }

  async destroy({ params, response }: HttpContext) {
    const app = await App.findOrFail(params.id)
    await app.delete()
    return response.noContent()
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
