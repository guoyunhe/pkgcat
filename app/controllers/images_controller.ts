import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import type { ImageFormat } from 'adonisjs-image'
import imageService from 'adonisjs-image/services/main'

import Image from '#models/image'
import ImageTransformer from '#transformers/image_transformer'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'svg', 'heic', 'heif']
const acceptedImageFormats = new Set(['svg', 'png', 'jpeg', 'webp', 'avif', 'gif'])

function isAcceptedImageFormat(value: unknown): value is ImageFormat {
  return typeof value === 'string' && acceptedImageFormats.has(value)
}

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
    const preset = this.imagePreset(request)
    const image = await this.uploadToService(request, auth.getUserOrFail().id, preset)

    response.status(201)
    return serialize(ImageTransformer.transform(image))
  }

  async update({ auth, params, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const previous = await this.findUserImage(params.id, user.id)
    const preset = this.imagePreset(request, previous.preset)
    const image = await this.uploadToService(request, user.id, preset)

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

  private async uploadToService(request: HttpContext['request'], userId: number, preset: string) {
    const file = request.file('image', {
      size: `${MAX_IMAGE_SIZE / 1024 / 1024}mb`,
      extnames: imageExtensions,
    })
    if (!file || !file.isValid || !file.tmpPath) {
      throw new Exception('A valid image file is required', { status: 422 })
    }

    const acceptedFormats = this.acceptedFormats(request)
    const uploaded = await imageService.use(preset).upload(file.tmpPath, { userId })

    if (acceptedFormats && !new Set<string>(acceptedFormats).has(uploaded.format)) {
      await imageService.delete(uploaded)
      throw new Exception(`Image must be one of: ${acceptedFormats.join(', ')}`, { status: 422 })
    }

    return Image.findOrFail(uploaded.id)
  }

  private imagePreset(request: HttpContext['request'], fallback = 'image') {
    const preset = request.input('preset')
    if (preset === undefined) return fallback
    if (preset !== 'avatar') {
      throw new Exception('preset must be avatar', { status: 422 })
    }
    return preset
  }

  private acceptedFormats(request: HttpContext['request']) {
    const formats = request.input('acceptedFormats')
    if (formats === undefined) return undefined
    if (!Array.isArray(formats) || !formats.every(isAcceptedImageFormat)) {
      throw new Exception(
        `acceptedFormats must be one of: ${[...acceptedImageFormats].join(', ')}`,
        {
          status: 422,
        },
      )
    }
    return formats
  }
}
