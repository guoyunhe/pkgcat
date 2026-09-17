import type { Data } from '@generated/data'
import xior from 'xior'

import { getAuthToken } from './auth'
import { getErrorMessage } from './errors'

const api = xior.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' })

function authHeaders() {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/** Formats the image endpoint stores, which are also the values `acceptedFormats` takes. */
export const imageFormats = ['svg', 'png', 'jpeg', 'webp', 'avif', 'gif'] as const

export type ImageFormat = (typeof imageFormats)[number]

export type ImageUploadOptions = {
  acceptedFormats?: ImageFormat[]
}

export async function getImages() {
  const { data } = await api.get<{ data: Data.Image[] }>('/images', { headers: authHeaders() })
  return data.data
}

export async function uploadImage(file: File, options: ImageUploadOptions = {}) {
  const payload = new FormData()
  payload.append('image', file)
  for (const format of options.acceptedFormats ?? []) {
    payload.append('acceptedFormats[]', format)
  }

  try {
    const { data } = await api.post<{ data: Data.Image }>('/images', payload, {
      headers: authHeaders(),
    })
    return data.data
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}
