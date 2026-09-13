import type { Data } from '@generated/data'
import xior from 'xior'

import type { Paginated, SerializedPaginated } from '../types/pagination'
import type { PkgNameMapping } from '../utils/pkgNames'
import { getAuthToken } from './auth'

export type AppPayload = {
  name: Record<string, string>
  summary: Record<string, string>
  version?: string
  license?: string
  homepage?: string
  appstreamId?: string
  /** Historical AppStream IDs of the application; omitted keeps the stored aliases. */
  appstreamIdAliases?: string[]
  /** Package names the application owns; omitted keeps the stored mappings. */
  pkgNames?: PkgNameMapping[]
  appstreamUrl?: string
  appstreamContent?: string
  desktopUrl?: string
  desktopContent?: string
  iconId?: number | null
}

/** A category of the freedesktop.org registry, as returned by `GET /api/categories`. */
export type Category = {
  id: number
  code: string
  name: Record<string, string>
  parentId: number | null
}

/** Filters applied to package listings. */
export type PkgFilters = {
  distroId: string | null
  type: string | null
  arch: string | null
}

const api = xior.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' })

function authHeaders() {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/** Query parameters of the package filters; unset filters are omitted from the query. */
function filterParams(filters: PkgFilters) {
  return {
    distro: filters.distroId ?? undefined,
    type: filters.type ?? undefined,
    arch: filters.arch ?? undefined,
  }
}

/** Sort orders the application listing accepts; `newest` is the default. */
export const appSorts = ['newest', 'name', 'favorites', 'rating'] as const

export type AppSort = (typeof appSorts)[number]

/** Sort order named by a listing query, falling back to the newest applications. */
export function appSort(value: string | null | undefined): AppSort {
  return appSorts.find((sort) => sort === value) ?? 'newest'
}

export async function getApps(
  query = '',
  page = 1,
  perPage = 12,
  category: string | null = null,
  sort: AppSort = 'newest',
) {
  const { data } = await api.get<SerializedPaginated<Data.App>>('/apps', {
    params: {
      page,
      perPage,
      q: query || undefined,
      category: category || undefined,
      sort,
    },
  })
  return { data: data.data, meta: data.metadata } satisfies Paginated<Data.App>
}

export async function getCategories() {
  const { data } = await api.get<{ data: Category[] }>('/categories')
  return data.data
}

export async function getApp(id: number) {
  const { data } = await api.get<{ data: Data.App }>(`/apps/${id}`)
  return data.data
}

export async function getAppPackages(
  id: number,
  page = 1,
  filters: PkgFilters = { distroId: null, type: null, arch: null },
) {
  const { data } = await api.get<SerializedPaginated<Data.Pkg>>(`/apps/${id}/pkgs`, {
    params: { page, ...filterParams(filters) },
  })
  return { data: data.data, meta: data.metadata } satisfies Paginated<Data.Pkg>
}

export async function searchPackages(
  query = '',
  page = 1,
  filters: PkgFilters = { distroId: null, type: null, arch: null },
) {
  const { data } = await api.get<SerializedPaginated<Data.Pkg>>('/pkgs', {
    params: { page, q: query || undefined, ...filterParams(filters) },
  })
  return { data: data.data, meta: data.metadata } satisfies Paginated<Data.Pkg>
}

export async function createApp(payload: AppPayload) {
  const { data } = await api.post<{ data: Data.App }>('/apps', payload, { headers: authHeaders() })
  return data.data
}

export async function updateApp(id: number, payload: AppPayload) {
  const { data } = await api.patch<{ data: Data.App }>(`/apps/${id}`, payload, {
    headers: authHeaders(),
  })
  return data.data
}

export async function deleteApp(id: number) {
  await api.delete(`/apps/${id}`, { headers: authHeaders() })
}

/**
 * Fold another catalog entry into this application. The merged entry keeps nothing: its packages,
 * favorites and reviews move here, and its AppStream IDs become aliases of this application, so
 * that repositories announcing them link to it from then on.
 */
export async function mergeApp(id: number, sourceId: number) {
  const { data } = await api.post<{ data: Data.App }>(
    `/apps/${id}/merge`,
    { sourceId },
    { headers: authHeaders() },
  )
  return data.data
}
