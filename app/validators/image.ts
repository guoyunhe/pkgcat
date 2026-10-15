import vine from '@vinejs/vine'
import type { ImageFormat } from 'adonisjs-image'

const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'svg', 'heic', 'heif']
const acceptedImageFormats = [
  'svg',
  'png',
  'jpeg',
  'webp',
  'avif',
  'gif',
] as const satisfies readonly ImageFormat[]

export const imageUploadValidator = vine.create({
  image: vine.file({ size: '10mb', extnames: imageExtensions }),
  preset: vine.enum(['avatar'] as const).optional(),
  acceptedFormats: vine.array(vine.enum(acceptedImageFormats)).optional(),
})
