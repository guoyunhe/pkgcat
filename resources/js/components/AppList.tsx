import type { Data } from '@generated/data'
import { Alert, Group, Loader, Pagination, Select, Text } from '@mantine/core'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'wouter'

import { appSort, appSorts, type AppSort } from '../services/apps'
import type { Paginated } from '../types/pagination'
import AppListItem from './AppListItem'
import AppTypeSelect from './AppTypeSelect'
import CategoryFilter from './CategoryFilter'

import styles from './AppList.module.css'

/** What the listing is narrowed and ordered by, which its toolbar holds. */
export type AppFilters = {
  category: string | null
  sort: AppSort
  type: string | null
}

type AppListProps = {
  /**
   * Reads one page of the listing, narrowed and ordered the way the filters its toolbar holds say.
   * The loader has to keep its identity (`useCallback`), which is also what tells the listing that
   * it reads something else now — other search terms, the applications of another page — and starts
   * it over at its first page. A page that has nothing to read answers with `null`, which the
   * listing shows as empty.
   */
  load: (page: number, filters: AppFilters) => Promise<Paginated<Data.App> | null>
  /**
   * Category the listing is narrowed to, and what a change of it is told to. The application
   * listing keeps it in its URL, so it names both here; the search results leave them out, and the
   * listing then shows the control and keeps what it is set to itself. The type and the order,
   * which the listing keeps in the query string itself, are named nowhere.
   */
  category?: string | null
  onCategoryChange?: (category: string | null) => void
  /** Number of applications the listing holds, told whenever a page of it is read. */
  onCountChange?: (count: number) => void
  /** Message of the empty listing, which every page names after what it shows. */
  emptyMessage: string
  /** Message of an empty listing the filters narrowed down; without filters the one above is shown. */
  filteredEmptyMessage?: string
  /** Message of a listing that could not be read. */
  errorMessage?: string
  /** Extra controls per item, such as the favorite button. */
  renderActions?: (app: Data.App) => ReactNode
}

/**
 * Listing of applications, which reads its own pages and shows the filters they are narrowed by —
 * the category, the type and the order, of which it keeps the type and the order in the query
 * string itself. Shared by the application listing and the search results.
 */
export default function AppList({
  load,
  category: controlledCategory,
  onCategoryChange,
  onCountChange,
  emptyMessage,
  filteredEmptyMessage,
  errorMessage,
  renderActions,
}: AppListProps) {
  const { t } = useTranslation()
  // A page that names no category leaves the choice to the listing
  const [ownCategory, setOwnCategory] = useState<string | null>(null)
  const category = controlledCategory === undefined ? ownCategory : controlledCategory
  // The type and the order are kept in the query string, so that they stay shareable and reloadable
  // the way the rest of the narrowing is, without the page having to name them
  const [searchParams, setSearchParams] = useSearchParams()
  const type = searchParams.get('type')
  const sort = appSort(searchParams.get('sort'))
  // The three are what a page reads, and read as one thing they keep their identity while none of
  // them changes, which is what keeps the listing from starting over on every render
  const filters = useMemo(() => ({ category, sort, type }), [category, sort, type])
  const [result, setResult] = useState<Paginated<Data.App> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // The callback is held in a ref, so that reading a page depends on the loader alone: a page that
  // passes an inline arrow would otherwise read another page on every one of its renders
  const reportCount = useRef(onCountChange)
  reportCount.current = onCountChange
  // What the listing is read by — the loader, the filters and the page the reader was left on — held
  // in one state object rather than three, because a function handed to `useState` is read as an
  // updater and would be called with the previous state
  const [listing, setListing] = useState({ filters, load, page: 1 })

  // Another listing — other filters, another loader — starts over, which is adjusted while rendering
  // so that its first page is read instead of the page the previous listing was left on
  if (listing.load !== load || listing.filters !== filters) {
    setListing({ filters, load, page: 1 })
  }

  useEffect(() => {
    let active = true

    setLoading(true)
    setError(null)
    listing
      .load(listing.page, listing.filters)
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

  // Every other filter of the toolbar owns one parameter of the query string and leaves the rest of
  // it — the query and the parameters a page keeps itself — as they are, which is what an omitted
  // value clears
  function setParameter(name: string, value: string | null) {
    setSearchParams((current) => {
      const params = new URLSearchParams(current)
      if (value) params.set(name, value)
      else params.delete(name)
      return params
    })
  }

  // The default order is left out of the query string, the way it reads as no order of its own
  function changeSort(nextSort: string | null) {
    const chosen = appSort(nextSort)
    setParameter('sort', chosen === 'newest' ? null : chosen)
  }

  // `name` is the shared label of every name field, the other three are orders of this listing
  const sortLabels: Record<AppSort, string> = {
    favorites: t('apps.sort.favorites'),
    name: t('common.name'),
    newest: t('apps.sort.newest'),
    rating: t('apps.sort.rating'),
  }
  const sortOptions = appSorts.map((value) => ({ value, label: sortLabels[value] }))

  const narrowed = category !== null || type !== null

  return (
    <>
      <Group align='flex-end' gap='sm' mb='lg'>
        <CategoryFilter onChange={changeCategory} value={category} />
        <AppTypeSelect
          clearable
          onChange={(nextType) => setParameter('type', nextType)}
          placeholder={t('apps.filterAny')}
          value={type}
        />
        <Select
          allowDeselect={false}
          data={sortOptions}
          label={t('common.sortBy')}
          onChange={changeSort}
          value={sort}
          w={180}
        />
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
        <Text c='dimmed'>{narrowed ? (filteredEmptyMessage ?? emptyMessage) : emptyMessage}</Text>
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
