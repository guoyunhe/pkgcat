import xior from 'xior'

const api = xior.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' })

/**
 * How many entries each listing of the catalog holds for the terms a search was made with, which
 * the tabs of the search results show.
 */
export type SearchCounts = {
  apps: number
  pkgs: number
  repos: number
  distros: number
}

/**
 * Counts of the search, which are read in one request however many tabs the results are split into:
 * the listing of a tab that is not shown is not mounted, so a count it shows cannot come from the
 * listing itself.
 */
export async function getSearchCounts(query = '') {
  const { data } = await api.get<{ data: SearchCounts }>('/search/counts', {
    params: { q: query || undefined },
  })
  return data.data
}
