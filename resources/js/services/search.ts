import xior from 'xior'

const api = xior.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' })

/**
 * Listings of the catalog a search is made in, which the tabs of the search results show. A count
 * is read for one listing at a time, so that a listing that is slow to count holds back no other
 * tab.
 */
export type SearchCountType = 'apps' | 'pkgs' | 'repos' | 'distros'

/**
 * How many entries one listing of the catalog holds for the terms a search was made with. The
 * listing of a tab that is not shown is not mounted, so a count a tab shows cannot come from the
 * listing itself.
 */
export async function getSearchCount(type: SearchCountType, query = '') {
  const { data } = await api.get<{ data: { count: number } }>(`/search/counts/${type}`, {
    params: { q: query || undefined },
  })
  return data.data.count
}
