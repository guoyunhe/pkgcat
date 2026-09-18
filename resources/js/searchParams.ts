import {
  unstable_createAdapterProvider,
  type unstable_AdapterInterface,
  type unstable_UpdateUrlFunction,
} from 'nuqs/adapters/custom'
import { useCallback, useRef } from 'react'
import { useLocation, useSearch } from 'wouter'

/**
 * Query parameters of the application, which every listing keeps what it is narrowed by and the
 * page of it the reader is on: a narrowed listing can be shared and reloaded, and the parameters of
 * every listing of a page sit beside each other in one query string.
 *
 * Nuqs reads and writes the URL through the router the rest of the application uses, so that a
 * parameter it sets moves the application the way a link does. Without that, a change made by nuqs
 * would update the address bar while the router — and with it the page — kept the URL it had.
 */
function useWouterAdapter(watchKeys: string[]): unstable_AdapterInterface {
  const [pathname, navigate] = useLocation()
  const search = useSearch()
  // A listing reads its parameters on every render, so what this hook watches is handed out as the
  // same object until the query string or the watched names change
  const cache = useRef<{ key: string; params: URLSearchParams } | null>(null)
  const cacheKey = `${search}\n${watchKeys.join(',')}`

  if (cache.current?.key !== cacheKey) {
    const all = new URLSearchParams(search)
    const params = new URLSearchParams()
    for (const name of watchKeys) {
      for (const value of all.getAll(name)) params.append(name, value)
    }
    cache.current = { key: cacheKey, params }
  }

  const searchParams = cache.current.params
  // What is written is the whole query string a listing asked for — the parameters nuqs does not
  // watch are read from the URL as they are, so a listing leaves the ones of another listing alone
  const updateUrl = useCallback<unstable_UpdateUrlFunction>(
    (next, options) => {
      const query = next.toString()
      navigate(query ? `${pathname}?${query}` : pathname, {
        replace: options.history === 'replace',
      })
      if (options.scroll) window.scrollTo({ top: 0 })
    },
    [navigate, pathname],
  )

  return { pathname, searchParams, updateUrl }
}

/** Search parameters the application reads and writes, which every page is rendered under. */
export const SearchParamsProvider = unstable_createAdapterProvider(useWouterAdapter)

/**
 * Query string names of the parameters of a listing. A page that shows several listings at once —
 * the packages and the repositories of a release — prefixes them, so that the page of one listing
 * is not read as the page of another.
 */
export function prefixedUrlKeys<K extends string>(prefix: string, keys: readonly K[]) {
  return Object.fromEntries(keys.map((key) => [key, `${prefix}${key}`])) as Record<K, string>
}
