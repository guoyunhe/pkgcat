import { useEffect, useState } from 'react'
import xior from 'xior'

const api = xior.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' })

/** Languages the catalog keeps, as configured by the server (`config/i18n.ts`). */
export type CatalogLanguages = {
  /** Languages an application can be translated into, in the order the server lists them. */
  locales: string[]
  /** Language a page falls back to, which is the language of the interface's messages as well. */
  defaultLocale: string
}

/**
 * Languages the API has served, kept for the helpers that read a translation outside of React. They
 * stay empty until a page has asked for them, so a caller has to cope with not knowing them yet.
 */
let served: CatalogLanguages = { defaultLocale: '', locales: [] }

let pending: Promise<CatalogLanguages> | null = null

/** Languages of the catalog, requested once per page load. */
export function getCatalogLanguages() {
  pending ??= api.get<{ data: CatalogLanguages }>('/locales').then(({ data }) => {
    served = data.data
    return served
  })
  return pending
}

/** Languages the API has served so far. */
export function servedCatalogLanguages() {
  return served
}

/**
 * Languages the catalog keeps, requested as a page mounts. A form offers them as the languages an
 * application can be translated into, which are exactly the languages the API accepts and the
 * repositories are read with.
 */
export function useCatalogLanguages() {
  const [languages, setLanguages] = useState<CatalogLanguages | null>(null)

  useEffect(() => {
    let active = true
    getCatalogLanguages()
      .then((catalog) => {
        if (active) setLanguages(catalog)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [])

  return languages
}
