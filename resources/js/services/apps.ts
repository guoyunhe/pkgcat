import type { Data } from '@generated/data'
import xior from 'xior'

import type { Paginated, SerializedPaginated } from '../types/pagination'
import type { PkgNameMapping } from '../utils/pkgNames'
import { getAuthToken } from './auth'
import { filterParams, type PkgFilters } from './pkgs'

export type AppPayload = {
  name: Record<string, string>
  summary: Record<string, string>
  /**
   * AppStream component type of the application; `desktop-application` when no metadata describes
   * it.
   */
  type: string
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

const api = xior.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' })

function authHeaders() {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
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
  /** AppStream component type the listing is narrowed to, or `null` for every type. */
  type: string | null = null,
  sort: AppSort = 'newest',
  /** Locale the names and summaries are read in; omitted returns every translation. */
  locale?: string,
) {
  const { data } = await api.get<SerializedPaginated<Data.App>>('/apps', {
    params: {
      page,
      perPage,
      q: query || undefined,
      category: category || undefined,
      type: type || undefined,
      sort,
      locale,
    },
  })
  return { data: data.data, meta: data.metadata } satisfies Paginated<Data.App>
}

export async function getCategories() {
  const { data } = await api.get<{ data: Category[] }>('/categories')
  return data.data
}

/**
 * Read one application. Without a locale every translation is returned, which is what the editor
 * needs; a page passes its interface language so that the response only carries that one.
 */
export async function getApp(id: number, locale?: string) {
  const { data } = await api.get<{ data: Data.App }>(`/apps/${id}`, { params: { locale } })
  return data.data
}

export async function getAppPackages(
  id: number,
  page = 1,
  filters: PkgFilters = { distroId: null, type: null, arch: null },
  locale?: string,
) {
  const { data } = await api.get<SerializedPaginated<Data.Pkg>>(`/apps/${id}/pkgs`, {
    params: { page, ...filterParams(filters), locale },
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
