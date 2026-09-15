import type { Data } from '@generated/data'
import xior from 'xior'

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

export async function getDistros(sort: DistroSort = 'name') {
  const { data } = await api.get<{ data: Distro[] }>('/distros', { params: { sort } })
  return data.data
}

export async function getDistro(id: number) {
  const { data } = await api.get<{ data: Distro }>(`/distros/${id}`)
  return data.data
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
