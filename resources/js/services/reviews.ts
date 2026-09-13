import type { Data } from '@generated/data'
import xior from 'xior'

import type { Paginated, SerializedPaginated } from '../types/pagination'
import { getAuthToken } from './auth'

const api = xior.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' })

function authHeaders() {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export type ReviewPayload = {
  rating: number
  comment?: string
}

export async function getAppReviews(appId: number, page = 1, locale?: string) {
  const { data } = await api.get<SerializedPaginated<Data.Review>>(`/apps/${appId}/reviews`, {
    params: { page, locale },
  })
  return { data: data.data, meta: data.metadata } satisfies Paginated<Data.Review>
}

export async function getUserReviews(userId: number, page = 1, locale?: string) {
  const { data } = await api.get<SerializedPaginated<Data.Review>>(`/users/${userId}/reviews`, {
    params: { page, locale },
  })
  return { data: data.data, meta: data.metadata } satisfies Paginated<Data.Review>
}

export async function createReview(appId: number, payload: ReviewPayload) {
  const { data } = await api.post<{ data: Data.Review }>(`/apps/${appId}/reviews`, payload, {
    headers: authHeaders(),
  })
  return data.data
}

export async function deleteReview(appId: number, reviewId: number) {
  await api.delete(`/apps/${appId}/reviews/${reviewId}`, { headers: authHeaders() })
}
