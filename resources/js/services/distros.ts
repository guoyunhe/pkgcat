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

export async function getDistros() {
  const { data } = await api.get<{ data: Distro[] }>('/distros')
  return data.data
}

export async function getDistro(id: number) {
  const { data } = await api.get<{ data: Distro }>(`/distros/${id}`)
  return data.data
}

export async function createDistro(payload: Partial<Distro>) {
  const { data } = await api.post<{ data: Distro }>('/distros', payload, {
    headers: authHeaders(),
  })
  return data.data
}

export async function updateDistro(id: number, payload: Partial<Distro>) {
  const { data } = await api.patch<{ data: Distro }>(`/distros/${id}`, payload, {
    headers: authHeaders(),
  })
  return data.data
}

export async function deleteDistro(id: number) {
  await api.delete(`/distros/${id}`, { headers: authHeaders() })
}
