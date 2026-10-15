import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import imageService from 'adonisjs-image/services/main'

import Image, { imageFormats, type ImageOptions } from '#models/image'
import ImageTransformer from '#transformers/image_transformer'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'svg', 'heic', 'heif']
const fitModes = ['contain', 'cover', 'fill', 'inside', 'outside'] as const
const outputFormats = ['jpeg', 'png', 'webp', 'avif'] as const

type FitMode = (typeof fitModes)[number]
type OutputFormat = (typeof outputFormats)[number]

export default class ImagesController {
  async index({ auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const query = Image.query().whereNull('parent_id').orderBy('id', 'desc')

    // Admins pick icons for catalog entries from every uploaded image.
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
    const preset = request.input('preset')
    if (preset !== undefined && preset !== 'avatar') {
      throw new Exception('preset must be avatar', { status: 422 })
    }

    const file = this.imageFile(request)
    const userId = auth.getUserOrFail().id
    const options = this.parseOptions(request)
    let image: Image

    if (preset === 'avatar') {
      if (options.acceptedFormats && !options.acceptedFormats.includes('webp')) {
        throw new Exception('Avatar images are stored as webp', { status: 422 })
      }
      if (!file.isValid || !file.tmpPath) {
        throw new Exception('A valid image file is required', { status: 422 })
      }

      const uploaded = await imageService.use('avatar').upload(file.tmpPath, { userId })
      image = await Image.findOrFail(uploaded.id)
    } else {
      image = await Image.createFromRequestFile(file, { userId, ...options })
    }

    response.status(201)
    return serialize(ImageTransformer.transform(image))
  }

  async update({ auth, params, request, serialize }: HttpContext) {
    const image = await this.findUserImage(params.id, auth.getUserOrFail().id)
    await Image.replaceFromRequestFile(image, this.imageFile(request), this.parseOptions(request))

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

  private imageFile(request: HttpContext['request']) {
    const file = request.file('image', {
      size: `${MAX_IMAGE_SIZE / 1024 / 1024}mb`,
      extnames: imageExtensions,
    })

    if (!file) {
      throw new Exception('A valid image file is required', { status: 422 })
    }
    return file
  }

  private parseOptions(request: HttpContext['request']) {
    const parseDimension = (name: 'width' | 'height') => {
      const value = request.input(name)
      if (value === undefined || value === null || value === '') return undefined
      const dimension = Number(value)
      if (!Number.isInteger(dimension) || dimension < 1 || dimension > 10000) {
        throw new Exception(`${name} must be an integer between 1 and 10000`, { status: 422 })
      }
      return dimension
    }

    const fit = request.input('fit')
    if (fit !== undefined && !fitModes.includes(fit)) {
      throw new Exception(`fit must be one of: ${fitModes.join(', ')}`, { status: 422 })
    }

    const format = request.input('format')
    if (format !== undefined && !outputFormats.includes(format)) {
      throw new Exception(`format must be one of: ${outputFormats.join(', ')}`, { status: 422 })
    }

    const acceptedFormats = request.input('acceptedFormats')
    if (acceptedFormats !== undefined && !Array.isArray(acceptedFormats)) {
      throw new Exception(`acceptedFormats must be an array`, { status: 422 })
    }
    const invalidFormat = acceptedFormats?.find(
      (value: unknown) => !imageFormats.includes(value as (typeof imageFormats)[number]),
    )
    if (invalidFormat !== undefined) {
      throw new Exception(`acceptedFormats must be one of: ${imageFormats.join(', ')}`, {
        status: 422,
      })
    }

    return {
      width: parseDimension('width'),
      height: parseDimension('height'),
      fit: fit as FitMode | undefined,
      format: format as OutputFormat | undefined,
      acceptedFormats: acceptedFormats as ImageOptions['acceptedFormats'],
    }
  }
}
