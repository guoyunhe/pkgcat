import type { Data } from '@generated/data'
import xior from 'xior'

import type { Paginated, SerializedPaginated } from '../types/pagination'
import { getAuthToken } from './auth'
import { getErrorMessage } from './errors'

const api = xior.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' })

/**
 * Attributes the API accepts when creating or editing a package. The applications the package
 * provides are sent as `appIds`, because the link is a many-to-many one.
 */
export type PkgPayload = Omit<Partial<Data.Pkg>, 'apps'> & { appIds?: number[] }

/** Filters applied to package listings. */
export type PkgFilters = {
  distroId: string | null
  type: string | null
  arch: string | null
}

function authHeaders() {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/** Query parameters of the package filters; unset filters are omitted from the query. */
export function filterParams(filters: PkgFilters) {
  return {
    distroId: filters.distroId ?? undefined,
    type: filters.type ?? undefined,
    arch: filters.arch ?? undefined,
  }
}

/**
 * Read one page of the packages the catalog holds, which the listing of every package and the
 * catalog search both show, each with its own search terms and filters.
 */
export async function getPkgs(
  query = '',
  page = 1,
  filters: PkgFilters = { distroId: null, type: null, arch: null },
  locale?: string,
) {
  const { data } = await api.get<SerializedPaginated<Data.Pkg>>('/pkgs', {
    params: { page, q: query || undefined, ...filterParams(filters), locale },
  })
  return { data: data.data, meta: data.metadata } satisfies Paginated<Data.Pkg>
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
