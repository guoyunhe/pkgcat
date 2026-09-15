import type { Data } from '@generated/data'
import { Alert, Loader, Pagination, Text } from '@mantine/core'
import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { Paginated } from '../types/pagination'
import AppListItem from './AppListItem'

import styles from './AppList.module.css'

type AppListProps = {
  /**
   * Reads one page of the listing. The loader has to keep its identity (`useCallback`), which is
   * also what tells the listing that it reads something else now — other filters, another search —
   * and starts it over at its first page. A page that has nothing to read answers with `null`,
   * which the listing shows as empty.
   */
  load: (page: number) => Promise<Paginated<Data.App> | null>
  /** Number of applications the listing holds, told whenever a page of it is read. */
  onCountChange?: (count: number) => void
  /** Message of the empty listing, which every page names after what it shows. */
  emptyMessage: string
  /** Message of a listing that could not be read. */
  errorMessage?: string
  /** Extra controls per item, such as the favorite button. */
  renderActions?: (app: Data.App) => ReactNode
}

/**
 * Grid of application rows, which reads its own pages: shared by the application listing and the
 * search results.
 */
export default function AppList({
  load,
  onCountChange,
  emptyMessage,
  errorMessage,
  renderActions,
}: AppListProps) {
  const { t } = useTranslation()
  const [result, setResult] = useState<Paginated<Data.App> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // The callback is held in a ref, so that reading a page depends on the loader alone: a page that
  // passes an inline arrow would otherwise read another page on every one of its renders
  const reportCount = useRef(onCountChange)
  reportCount.current = onCountChange
  // The loader the listing is on, together with the page it was left on. The loader is part of the
  // state rather than a state of its own, because a function handed to `useState` is read as an
  // updater and would be called with the previous state.
  const [listing, setListing] = useState({ load, page: 1 })

  // Another listing starts over, which is adjusted while rendering so that its first page is read
  // instead of the page the previous listing was left on
  if (listing.load !== load) setListing({ load, page: 1 })

  useEffect(() => {
    let active = true

    setLoading(true)
    setError(null)
    listing
      .load(listing.page)
      .then((appPage) => {
        if (!active) return
        setResult(appPage)
        reportCount.current?.(appPage?.meta.total ?? 0)
      })
      .catch((reason) => {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : (errorMessage ?? t('common.loadAppsError')),
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [errorMessage, listing, t])

  if (error) {
    return (
      <Alert color='red' mb='lg'>
        {error}
      </Alert>
    )
  }
  if (loading) {
    return (
      <div className={styles.loading}>
        <Loader color='orange' />
      </div>
    )
  }
  if (!result || result.data.length === 0) {
    return <Text c='dimmed'>{emptyMessage}</Text>
  }

  return (
    <>
      <section className={styles.grid}>
        {result.data.map((app) => (
          <AppListItem actions={renderActions?.(app)} app={app} key={app.id} />
        ))}
      </section>
      {result.meta.lastPage > 1 && (
        <Pagination
          className={styles.pagination}
          total={result.meta.lastPage}
          value={result.meta.currentPage}
          onChange={(page) => setListing({ load, page })}
        />
      )}
    </>
  )
}
