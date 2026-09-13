import type { Data } from '@generated/data'
import xior from 'xior'

import type { Paginated, SerializedPaginated } from '../types/pagination'
import { getAuthToken } from './auth'

const api = xior.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' })

function authHeaders() {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function getUser(id: number) {
  const { data } = await api.get<{ data: Data.User }>(`/users/${id}`)
  return data.data
}

export async function getUserFavorites(id: number, page = 1, locale?: string) {
  const { data } = await api.get<SerializedPaginated<Data.App>>(`/users/${id}/favorites`, {
    params: { page, locale },
    headers: authHeaders(),
  })
  return { data: data.data, meta: data.metadata } satisfies Paginated<Data.App>
}
