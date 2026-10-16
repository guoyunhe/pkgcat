import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import imageService from 'adonisjs-image/services/main'

import Image from '#models/image'
import ImageTransformer from '#transformers/image_transformer'
import { imageUploadValidator } from '#validators/image'

type ImageUploadPayload = Awaited<ReturnType<typeof imageUploadValidator.validate>>

export default class ImagesController {
  async index({ auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const query = Image.query().whereNull('parent_id').orderBy('id', 'desc')

    if (user.role !== 'admin') {
      query.where('user_id', user.id)
    }

    const images = await query

    return serialize(ImageTransformer.transform(images))
  }

  async show({ auth, params, serialize }: HttpContext) {
    const image = await this.findUserImage(params.id, auth.getUserOrFail().id)

    return serialize(ImageTransformer.transform(image))
  }

  async store({ auth, request, response, serialize }: HttpContext) {
    const payload = await request.validateUsing(imageUploadValidator)
    const image = await this.uploadToService(
      payload.image,
      auth.getUserOrFail().id,
      payload.preset ?? 'image',
      payload.acceptedFormats,
    )

    response.status(201)
    return serialize(ImageTransformer.transform(image))
  }

  async update({ auth, params, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const previous = await this.findUserImage(params.id, user.id)
    const payload = await request.validateUsing(imageUploadValidator)
    const image = await this.uploadToService(
      payload.image,
      user.id,
      payload.preset ?? previous.preset,
      payload.acceptedFormats,
    )

    await db.transaction(async (trx) => {
      await trx.from('apps').where('icon_id', previous.id).update({ icon_id: image.id })
      await trx.from('users').where('avatar_id', previous.id).update({ avatar_id: image.id })
    })

    await imageService.delete(previous)

    return serialize(ImageTransformer.transform(image))
  }

  async destroy({ auth, params, response }: HttpContext) {
    const image = await this.findUserImage(params.id, auth.getUserOrFail().id)

    await imageService.delete(image)

    return response.noContent()
  }

  private async findUserImage(id: number, userId: number) {
    return Image.query()
      .where('id', id)
      .where('user_id', userId)
      .whereNull('parent_id')
      .firstOrFail()
  }

  private async uploadToService(
    file: ImageUploadPayload['image'],
    userId: number,
    preset: string,
    acceptedFormats?: ImageUploadPayload['acceptedFormats'],
  ) {
    if (!file.tmpPath) {
      throw new Exception('A valid image file is required', { status: 422 })
    }

    const uploaded = await imageService.use(preset).upload(file.tmpPath, { userId })

    if (acceptedFormats && !new Set<string>(acceptedFormats).has(uploaded.format)) {
      await imageService.delete(uploaded)
      throw new Exception(`Image must be one of: ${acceptedFormats.join(', ')}`, { status: 422 })
    }

    return Image.findOrFail(uploaded.id)
  }
}
