import type { Data } from '@generated/data'
import { Alert, Group, Loader, Pagination, Text } from '@mantine/core'
import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { Paginated } from '../types/pagination'
import AppListItem from './AppListItem'
import CategoryFilter from './CategoryFilter'

import styles from './AppList.module.css'

type AppListProps = {
  /**
   * Reads one page of the listing, narrowed by the category it is filtered by. The loader has to
   * keep its identity (`useCallback`), which is also what tells the listing that it reads something
   * else now — other search terms, another category — and starts it over at its first page. A page
   * that has nothing to read answers with `null`, which the listing shows as empty.
   */
  load: (page: number, category: string | null) => Promise<Paginated<Data.App> | null>
  /**
   * Category the listing is narrowed to, and what a change of it is told to. The application
   * listing keeps it in its URL, so it names both here; the search results leave them out, and the
   * listing then shows the control and keeps what it is set to itself.
   */
  category?: string | null
  onCategoryChange?: (category: string | null) => void
  /** Controls the page keeps next to the listing, such as the rest of its URL-backed toolbar. */
  extraFilters?: ReactNode
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
 * Listing of applications, which reads its own pages and shows the filters they are narrowed by:
 * shared by the application listing and the search results.
 */
export default function AppList({
  load,
  category: controlledCategory,
  onCategoryChange,
  extraFilters,
  onCountChange,
  emptyMessage,
  errorMessage,
  renderActions,
}: AppListProps) {
  const { t } = useTranslation()
  // A page that names no category leaves the choice to the listing
  const [ownCategory, setOwnCategory] = useState<string | null>(null)
  const category = controlledCategory === undefined ? ownCategory : controlledCategory
  const [result, setResult] = useState<Paginated<Data.App> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // The callback is held in a ref, so that reading a page depends on the loader alone: a page that
  // passes an inline arrow would otherwise read another page on every one of its renders
  const reportCount = useRef(onCountChange)
  reportCount.current = onCountChange
  // What the listing is read by — the loader, the category and the page the reader was left on — held
  // in one state object rather than three, because a function handed to `useState` is read as an
  // updater and would be called with the previous state
  const [listing, setListing] = useState({ category, load, page: 1 })

  // Another listing — another category, another loader — starts over, which is adjusted while
  // rendering so that its first page is read instead of the page the previous listing was left on
  if (listing.load !== load || listing.category !== category) {
    setListing({ category, load, page: 1 })
  }

  useEffect(() => {
    let active = true

    setLoading(true)
    setError(null)
    listing
      .load(listing.page, listing.category)
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

  function changeCategory(nextCategory: string | null) {
    if (controlledCategory === undefined) setOwnCategory(nextCategory)
    onCategoryChange?.(nextCategory)
  }

  return (
    <>
      <Group align='flex-end' gap='sm' mb='lg'>
        <CategoryFilter onChange={changeCategory} value={category} />
        {extraFilters}
      </Group>
      {error ? (
        <Alert color='red' mb='lg'>
          {error}
        </Alert>
      ) : loading ? (
        <div className={styles.loading}>
          <Loader color='orange' />
        </div>
      ) : !result || result.data.length === 0 ? (
        <Text c='dimmed'>{emptyMessage}</Text>
      ) : (
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
              onChange={(page) => setListing({ ...listing, page })}
            />
          )}
        </>
      )}
    </>
  )
}
