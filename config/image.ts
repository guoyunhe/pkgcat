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
      width: 1024,
      height: 1024,
      fit: 'cover',
      format: 'webp',
      thumbnails: {
        small: { width: 64, height: 64, fit: 'cover', format: 'webp' },
        medium: { width: 128, height: 128, fit: 'cover', format: 'webp' },
        large: { width: 256, height: 256, fit: 'cover', format: 'webp' },
      },
    },
    icon: {
      directory: 'icons',
      width: 1024,
      height: 1024,
      fit: 'cover',
      thumbnails: {
        small: { width: 64, height: 64, fit: 'cover', format: 'webp' },
        medium: { width: 128, height: 128, fit: 'cover', format: 'webp' },
        large: { width: 256, height: 256, fit: 'cover', format: 'webp' },
      },
    },
  },
})

export default imageConfig
