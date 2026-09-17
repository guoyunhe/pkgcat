import type { HttpContext } from '@adonisjs/core/http'

import App from '#models/app'
import User from '#models/user'
import { attachTranslations } from '#services/app_translations'
import AppTransformer from '#transformers/app_transformer'
import UserTransformer from '#transformers/user_transformer'

export default class UsersController {
  async show({ params, serialize }: HttpContext) {
    const user = await User.findOrFail(params.id)
    await user.load('distro')
    return serialize(UserTransformer.transform(user))
  }

  async favorites({ auth, params, request, serialize }: HttpContext) {
    const page = this.positiveInteger(request.input('page'), 1)
    const perPage = Math.min(this.positiveInteger(request.input('perPage'), 12), 50)

    await User.findOrFail(params.id)

    const appsQuery = App.query()
      .join('favorites', 'favorites.app_id', 'apps.id')
      .where('favorites.user_id', params.id)
      .preload('icon')
      .preload('categories', (categoriesQuery) => categoriesQuery.preload('translations'))
      .orderBy('favorites.created_at', 'desc')
      .select('apps.*')

    if (auth.isAuthenticated) {
      appsQuery.preload('favoritedBy', (builder) => builder.where('users.id', auth.user!.id))
    }

    const paginator = await appsQuery.paginate(page, perPage)
    const locale = request.input('locale')
    await attachTranslations(paginator.all(), typeof locale === 'string' ? locale : null)
    return serialize(AppTransformer.paginate(paginator.all(), paginator.getMeta()))
  }

  private positiveInteger(value: unknown, fallback: number) {
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
  }
}
