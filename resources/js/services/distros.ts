import type { Data } from '@generated/data'
import xior from 'xior'

import type { Paginated, SerializedPaginated } from '../types/pagination'
import { getAuthToken } from './auth'

/** A distribution as returned by the API; it is the serialized form of the `distros` table. */
export type Distro = Data.Distro

/**
 * Name of a distribution entry, which is one release of a distribution for one architecture, so
 * that entries that only differ in their architecture can be told apart.
 */
export function distroLabel(distro: Pick<Distro, 'name' | 'version' | 'arch'>) {
  const release = distro.version ? `${distro.name} ${distro.version}` : distro.name
  return `${release} (${distro.arch})`
}

const api = xior.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' })

function authHeaders() {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * Fields the distribution form sends. The release a distribution is binary compatible with is sent
 * as its id, while the API answers with the entry itself.
 */
export type DistroPayload = Omit<Partial<Data.Distro>, 'compatibleDistro'> & {
  compatibleDistroId?: number | null
}

/** Sort orders the distribution listing accepts; `name` is the default. */
export const distroSorts = ['name', 'packages', 'apps'] as const

export type DistroSort = (typeof distroSorts)[number]

/** Sort order named by a listing query, falling back to the name order. */
export function distroSort(value: string | null | undefined): DistroSort {
  return distroSorts.find((sort) => sort === value) ?? 'name'
}

/**
 * What the distribution listing is narrowed by, which the toolbar of its page holds and the API
 * reads back: the entries it shows, and therefore the count it reports, are the ones the filters
 * kept.
 */
export type DistroFilters = {
  /** Architecture the entries are published for; a release is one entry per architecture. */
  arch: string | null
  /** Search terms, which a release is found by its name, version, architecture and format. */
  q: string
}

/** Listing with nothing set, which a page without the filter reads its entries with. */
export const emptyDistroFilters: DistroFilters = { arch: null, q: '' }

/**
 * One page of the distribution listing, which the API pages ten entries at a time. The order is
 * read by the API as well, since it is the order of the whole listing: the entries with the most
 * packages come first, and the rest follow by name.
 */
export async function getDistros(
  sort: DistroSort = 'name',
  filters: DistroFilters = emptyDistroFilters,
  page = 1,
) {
  const { data } = await api.get<SerializedPaginated<Distro>>('/distros', {
    params: { page, sort, q: filters.q || undefined, arch: filters.arch },
  })
  return { data: data.data, meta: data.metadata } satisfies Paginated<Distro>
}

/**
 * Every entry of the catalog, which a field that picks one of them reads: it offers what the
 * catalog holds rather than the page of it a listing happened to read, so it asks for no page size
 * at all and receives the entries in one page.
 */
export async function getDistroCatalog() {
  const { data } = await api.get<SerializedPaginated<Distro>>('/distros', {
    params: { perPage: 0 },
  })
  return data.data
}

export async function getDistro(id: number) {
  const { data } = await api.get<{ data: Distro }>(`/distros/${id}`)
  return data.data
}

/**
 * Packages the distribution serves. They are the ones its repositories hold for its architecture,
 * which the API pages ten at a time, and the same ones its package count adds up.
 */
export async function getDistroPackages(id: number, page = 1, locale?: string) {
  const { data } = await api.get<SerializedPaginated<Data.Pkg>>('/pkgs', {
    params: { page, distroId: id, locale },
  })
  return { data: data.data, meta: data.metadata } satisfies Paginated<Data.Pkg>
}

export async function createDistro(payload: DistroPayload) {
  const { data } = await api.post<{ data: Distro }>('/distros', payload, {
    headers: authHeaders(),
  })
  return data.data
}

export async function updateDistro(id: number, payload: DistroPayload) {
  const { data } = await api.patch<{ data: Distro }>(`/distros/${id}`, payload, {
    headers: authHeaders(),
  })
  return data.data
}

export async function deleteDistro(id: number) {
  await api.delete(`/distros/${id}`, { headers: authHeaders() })
}
