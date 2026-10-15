import { defineConfig } from 'adonisjs-image'

const imageConfig = defineConfig({
  default: 'image',
  presets: {
    image: {
      /** Drive disk (defaults to the Drive default disk) */
      // disk: 'fs',
      directory: 'images',

      /** Convert all uploads to one format */
      // format: 'webp',

      /** Downscale (never enlarge) originals */
      width: 2560,
      height: 2560,
      keepMetadata: false,
      quality: { jpeg: 80, webp: 80, avif: 50, png: 90 },

      /** Thumbnails generated for each upload */
      thumbnails: {
        small: { width: 150, height: 150, fit: 'cover', format: 'webp' },
        medium: { width: 640, fit: 'inside', format: 'webp' },
      },
    },
    avatar: {
      directory: 'avatars',
      width: 512,
      height: 512,
      fit: 'cover',
      format: 'webp',
      quality: { webp: 85 },
      thumbnails: {
        small: { width: 64, height: 64, fit: 'cover', format: 'webp' },
        medium: { width: 256, height: 256, fit: 'cover', format: 'webp' },
      },
    },
    icon: {
      directory: 'icons',
      thumbnails: {
        small: { width: 64, height: 64, fit: 'inside', format: 'webp' },
        medium: { width: 256, height: 256, fit: 'inside', format: 'webp' },
      },
    },
    photo: {
      directory: 'photos',
      width: 6000,
      height: 6000,
      quality: { jpeg: 95, webp: 90, avif: 80, png: 100, tiff: 95 },
    },
  },
})

export default imageConfig
