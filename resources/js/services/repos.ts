import type { Data } from '@generated/data'
import xior from 'xior'

import type { Paginated, SerializedPaginated } from '../types/pagination'
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

/**
 * Origins a repository is listed by, in the order the API lists them: the distributions themselves,
 * their communities, the projects of a single user, and software vendors.
 */
export const repoSources = ['distro', 'community', 'user', 'vendor'] as const

/** Sort order named by a listing query, falling back to the name order. */
export function repoSort(value: string | null | undefined): RepoSort {
  return repoSorts.find((sort) => sort === value) ?? 'name'
}

/**
 * What the repository table is narrowed by, which its toolbar holds and the API reads back: the
 * entries it shows, and therefore the count it reports, are the ones the filters kept.
 */
export type RepoFilters = {
  /** Release the repositories serve, of which every repository serves at least one. */
  distroId: number | null
  /** Search terms, which a repository is found by along with the releases it serves. */
  q: string
  /** Where the repository comes from: provided by a distribution, or added by a person. */
  source: string | null
}

/** Table with nothing set, which a page without a toolbar reads its repositories with. */
export const emptyRepoFilters: RepoFilters = { distroId: null, q: '', source: null }

/**
 * One page of the repository listing, which the API pages ten entries at a time. The order is read
 * by the API as well, since it is the order of the whole listing: the repositories with the most
 * packages come first, and the rest follow by name.
 */
export async function getRepos(
  sort: RepoSort = 'name',
  filters: RepoFilters = emptyRepoFilters,
  page = 1,
) {
  const { data } = await api.get<SerializedPaginated<Data.Repo>>('/repos', {
    params: {
      page,
      sort,
      q: filters.q || undefined,
      source: filters.source,
      distroId: filters.distroId,
    },
  })
  return { data: data.data, meta: data.metadata } satisfies Paginated<Data.Repo>
}

export async function getRepo(id: number) {
  const { data } = await api.get<{ data: Data.Repo }>(`/repos/${id}`)
  return data.data
}

/**
 * Packages the repository holds, which are the ones extracted from it. They are read the way every
 * package listing is — ten to a page — and are the same ones its package count adds up.
 */
export async function getRepoPackages(id: number, page = 1, locale?: string) {
  const { data } = await api.get<SerializedPaginated<Data.Pkg>>('/pkgs', {
    params: { page, repoId: id, locale },
  })
  return { data: data.data, meta: data.metadata } satisfies Paginated<Data.Pkg>
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
