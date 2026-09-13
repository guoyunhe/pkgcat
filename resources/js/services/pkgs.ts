import type { Data } from '@generated/data'
import xior from 'xior'

import { getAuthToken } from './auth'
import { getErrorMessage } from './errors'

const api = xior.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' })

/**
 * Attributes the API accepts when creating or editing a package. The applications the package
 * provides are sent as `appIds`, because the link is a many-to-many one.
 */
export type PkgPayload = Omit<Partial<Data.Pkg>, 'apps'> & { appIds?: number[] }

function authHeaders() {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function uploadPkg(appId: number, file: File) {
  const payload = new FormData()
  payload.append('file', file)

  try {
    const { data } = await api.post<{ data: Data.Pkg }>(`/apps/${appId}/pkgs`, payload, {
      headers: authHeaders(),
    })
    return data.data
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export async function getPkg(id: number) {
  const { data } = await api.get<{ data: Data.Pkg }>(`/pkgs/${id}`, {
    headers: authHeaders(),
  })
  return data.data
}

export async function createPkg(payload: PkgPayload) {
  const { data } = await api.post<{ data: Data.Pkg }>('/pkgs', payload, {
    headers: authHeaders(),
  })
  return data.data
}

export async function updatePkg(id: number, payload: PkgPayload) {
  const { data } = await api.patch<{ data: Data.Pkg }>(`/pkgs/${id}`, payload, {
    headers: authHeaders(),
  })
  return data.data
}

export async function deletePkg(id: number) {
  await api.delete(`/pkgs/${id}`, { headers: authHeaders() })
}
