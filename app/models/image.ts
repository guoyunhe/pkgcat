import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

import { Exception } from '@adonisjs/core/exceptions'
import drive from '@adonisjs/drive/services/main'
import sharp, { type FitEnum } from 'sharp'
import xior from 'xior'

import { ImageSchema } from '#database/schema'

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024

export const imageFormats = ['svg', 'png', 'jpeg', 'webp', 'avif', 'gif'] as const

export type ImageFormat = (typeof imageFormats)[number]

function isImageFormat(format: string): format is ImageFormat {
  return (imageFormats as readonly string[]).includes(format)
}

export type ImageOptions = {
  userId?: number | null
  path?: string
  width?: number
  height?: number
  fit?: keyof FitEnum
  format?: ImageFormat
  maxSize?: number
  acceptedFormats?: ReadonlyArray<ImageFormat>
  minimumPngSize?: number
}

type RequestFile = { tmpPath?: string; isValid: boolean }

export default class Image extends ImageSchema {
  declare format: ImageFormat

  static async createFromLocalFile(filePath: string, options: ImageOptions = {}) {
    return this.createFromBuffer(await readFile(filePath), options)
  }

  static async createFromUrl(url: string, options: ImageOptions = {}) {
    return this.createFromBuffer(await this.download(url), options)
  }

  static async createFromRequestFile(file: RequestFile, options: ImageOptions = {}) {
    if (!file.isValid || !file.tmpPath) {
      throw new Exception('A valid image file is required', { status: 422 })
    }
    return this.createFromLocalFile(file.tmpPath, options)
  }

  static async replaceFromRequestFile(image: Image, file: RequestFile, options: ImageOptions = {}) {
    if (!file.isValid || !file.tmpPath) {
      throw new Exception('A valid image file is required', { status: 422 })
    }
    return this.replaceFromBuffer(image, await readFile(file.tmpPath), options)
  }

  static async replaceFromUrl(image: Image, url: string, options: ImageOptions = {}) {
    return this.replaceFromBuffer(image, await this.download(url), options)
  }

  /**
   * Store an image from raw bytes. Files are content addressed, so identical bytes reuse the
   * existing row instead of being stored twice.
   */
  static async createFromBuffer(data: Buffer, options: ImageOptions = {}) {
    const attributes = await this.process(data, options)

    const existing = await this.findBy('path', attributes.path)
    if (existing) return existing

    return this.create({ ...attributes, userId: options.userId ?? null })
  }

  private static async replaceFromBuffer(image: Image, data: Buffer, options: ImageOptions) {
    const previousPath = image.path
    let attributes = await this.process(data, options)

    const owner = await this.findBy('path', attributes.path)
    if (owner && owner.id !== image.id) {
      // The exact same bytes are already stored for another image. "path" holds a content
      // hash and is unique, so this row keeps its own copy of the bytes instead of
      // pointing at the file owned by the other row.
      attributes = await this.process(data, {
        ...options,
        path: this.rowScopedPath(attributes.path, image.id),
      })
    }

    await image.merge(attributes).save()

    if (previousPath !== image.path) await drive.use().delete(previousPath)
    return image
  }

  /** Write the bytes of an image and describe them; the owner of a row is set where it is created. */
  private static async process(data: Buffer, options: ImageOptions) {
    const maxSize = options.maxSize ?? DEFAULT_MAX_SIZE
    const sourceMetadata = await sharp(data).metadata()
    const preserveSvg =
      sourceMetadata.format === 'svg' && !options.width && !options.height && !options.format
    let outputData = data
    let format: string | undefined = sourceMetadata.format
    let { width, height } = sourceMetadata

    if (!preserveSvg) {
      let processor = sharp(data).rotate()
      if (options.width || options.height) {
        processor = processor.resize({
          width: options.width,
          height: options.height,
          fit: options.fit,
        })
      }
      if (options.format) processor = processor.toFormat(options.format)

      const output = await processor.toBuffer({ resolveWithObject: true })
      outputData = output.data
      format = output.info.format
      width = output.info.width
      height = output.info.height
    }

    if (!format || !width || !height) {
      throw new Exception('Unable to determine image metadata', { status: 422 })
    }
    if (!isImageFormat(format)) {
      throw new Exception(`Unsupported image format: ${format}`, { status: 422 })
    }
    if (outputData.length > maxSize) {
      throw new Exception(`Image exceeds the ${maxSize / 1024 / 1024} MB size limit`, {
        status: 422,
      })
    }
    if (options.acceptedFormats && !options.acceptedFormats.includes(format)) {
      throw new Exception(`Image must be one of: ${options.acceptedFormats.join(', ')}`, {
        status: 422,
      })
    }
    if (
      format === 'png' &&
      options.minimumPngSize &&
      Math.min(width, height) < options.minimumPngSize
    ) {
      throw new Exception(`PNG image must be at least ${options.minimumPngSize}px`, { status: 422 })
    }

    const extension = format === 'jpeg' ? 'jpg' : format
    const path = options.path ?? `images/${this.contentHash(outputData)}.${extension}`
    await drive.use().put(path, outputData)

    return {
      path,
      size: outputData.length,
      width,
      height,
      format,
    }
  }

  /**
   * Content address for a processed image. Identical bytes always map to the same file name, which
   * keeps duplicate uploads from wasting disk space.
   */
  private static contentHash(data: Buffer) {
    return createHash('md5').update(data).digest('hex')
  }

  /**
   * Adds the image id to a content addressed path, so that a single row owns the file.
   */
  private static rowScopedPath(path: string, id: number) {
    return path.replace(/(\.[^./]+)$/, `-${id}$1`)
  }

  private static async download(url: string) {
    const response = await xior.get<ArrayBuffer>(url, {
      responseType: 'arraybuffer',
      headers: { Accept: 'image/*', 'User-Agent': 'curl/8.0' },
    })
    return Buffer.from(response.data)
  }
}
