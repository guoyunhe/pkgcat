import type { HttpContext } from '@adonisjs/core/http'

import App from '#models/app'
import Review from '#models/review'
import User from '#models/user'
import { attachTranslations } from '#services/app_translations'
import ReviewTransformer from '#transformers/review_transformer'
import { reviewValidator } from '#validators/review'

export default class ReviewsController {
  async index({ params, request, serialize }: HttpContext) {
    await App.findOrFail(params.app_id)
    const page = this.positiveInteger(request.input('page'), 1)
    const perPage = Math.min(this.positiveInteger(request.input('perPage'), 12), 50)

    const paginator = await Review.query()
      .where('appId', params.app_id)
      .preload('user')
      .preload('distro')
      .orderBy('createdAt', 'desc')
      .paginate(page, perPage)

    return serialize(ReviewTransformer.paginate(paginator.all(), paginator.getMeta()))
  }

  async userIndex({ params, request, serialize }: HttpContext) {
    await User.findOrFail(params.id)
    const page = this.positiveInteger(request.input('page'), 1)
    const perPage = Math.min(this.positiveInteger(request.input('perPage'), 12), 50)

    const paginator = await Review.query()
      .where('userId', params.id)
      .preload('app')
      .preload('distro')
      .orderBy('createdAt', 'desc')
      .paginate(page, perPage)

    const locale = request.input('locale')
    await attachTranslations(
      paginator.all().flatMap((review) => (review.app ? [review.app] : [])),
      typeof locale === 'string' ? locale : null,
    )
    return serialize(ReviewTransformer.paginate(paginator.all(), paginator.getMeta()))
  }

  async store({ auth, params, request, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const app = await App.findOrFail(params.app_id)
    const payload = await request.validateUsing(reviewValidator)

    const review = await Review.updateOrCreate(
      { userId: user.id, appId: app.id },
      {
        rating: payload.rating,
        comment: payload.comment?.trim() || null,
        distroId: payload.distroId,
      },
    )
    await review.load('user')
    await review.load('distro')

    response.status(201)
    return serialize(ReviewTransformer.transform(review))
  }

  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const review = await Review.query().where('id', params.id).where('appId', params.app_id).first()

    if (!review) return response.noContent()
    if (review.userId !== user.id && user.role !== 'admin') {
      return response.forbidden()
    }

    await review.delete()
    return response.noContent()
  }

  private positiveInteger(value: unknown, fallback: number) {
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
  }
}
