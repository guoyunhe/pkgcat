import type { Data } from '@generated/data'
import xior from 'xior'

import { getAuthToken } from './auth'

const api = xior.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' })

function authHeaders() {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * Fields the repository form sends. The distributions a repository serves are sent as their ids,
 * while the API answers with the distributions themselves.
 */
export type RepoPayload = Omit<Partial<Data.Repo>, 'distros'> & { distroIds?: number[] }

/** Sort orders the repository listing accepts; `name` is the default. */
export const repoSorts = ['name', 'packages', 'apps'] as const

export type RepoSort = (typeof repoSorts)[number]

/** Sort order named by a listing query, falling back to the name order. */
export function repoSort(value: string | null | undefined): RepoSort {
  return repoSorts.find((sort) => sort === value) ?? 'name'
}

export async function getRepos(sort: RepoSort = 'name', distroId?: number) {
  const { data } = await api.get<{ data: Data.Repo[] }>('/repos', { params: { sort, distroId } })
  return data.data
}

export async function getRepo(id: number) {
  const { data } = await api.get<{ data: Data.Repo }>(`/repos/${id}`)
  return data.data
}

export async function createRepo(payload: RepoPayload) {
  const { data } = await api.post<{ data: Data.Repo }>('/repos', payload, {
    headers: authHeaders(),
  })
  return data.data
}

export async function updateRepo(id: number, payload: RepoPayload) {
  const { data } = await api.patch<{ data: Data.Repo }>(`/repos/${id}`, payload, {
    headers: authHeaders(),
  })
  return data.data
}

export async function deleteRepo(id: number) {
  await api.delete(`/repos/${id}`, { headers: authHeaders() })
}
