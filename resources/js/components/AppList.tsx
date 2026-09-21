import type { Data } from '@generated/data'
import { Alert, Group, Loader, Pagination, Text } from '@mantine/core'
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { prefixedUrlKeys } from '../searchParams'
import { appSorts, type AppSort } from '../services/apps'
import type { Paginated } from '../types/pagination'
import AppListItem from './AppListItem'
import AppSortSelect from './AppSortSelect'
import AppTypeSelect from './AppTypeSelect'
import CategoryFilter from './CategoryFilter'

import styles from './AppList.module.css'

/** Names the listing keeps in the query string, which a page that shows several listings prefixes. */
const paramNames = ['category', 'page', 'sort', 'type'] as const

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
   * it reads something else now — other search terms, the applications of another release. A page
   * that has nothing to read answers with `null`, which the listing shows as empty.
   */
  load: (page: number, filters: AppFilters) => Promise<Paginated<Data.App> | null>
  /** Message of the empty listing, which every page names after what it shows. */
  emptyMessage: string
  /** Message of an empty listing the filters narrowed down; without filters the one above is shown. */
  filteredEmptyMessage?: string
  /** Message of a listing that could not be read. */
  errorMessage?: string
  /** Extra controls per item, such as the favorite button. */
  renderActions?: (app: Data.App) => ReactNode
  /** Prefix the parameters carry, on a page that shows several listings at once. */
  paramPrefix?: string
}

/**
 * Listing of applications, which reads its own pages and shows the filters they are narrowed by —
 * the category, the type and the order — all of which it keeps in the query string, so that what a
 * listing is narrowed to can be shared and reloaded. Shared by the application listing and the
 * search results.
 */
export default function AppList({
  load,
  emptyMessage,
  filteredEmptyMessage,
  errorMessage,
  renderActions,
  paramPrefix = '',
}: AppListProps) {
  const { t } = useTranslation()
  // The filters and the page are kept in the query string: the listing is read the way the URL says
  // it is, and an order reads as no order of its own when it is the one a listing starts at
  const [{ category, page, sort, type }, setParams] = useQueryStates(
    {
      category: parseAsString,
      page: parseAsInteger.withDefault(1),
      sort: parseAsStringLiteral(appSorts).withDefault('newest'),
      type: parseAsString,
    },
    { urlKeys: prefixedUrlKeys(paramPrefix, paramNames) },
  )
  // The three are what a page reads, and read as one thing they keep their identity while none of
  // them changes, which is what keeps the listing from reading again on every render
  const filters = useMemo(() => ({ category, sort, type }), [category, sort, type])
  const [result, setResult] = useState<Paginated<Data.App> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    setLoading(true)
    setError(null)
    load(page, filters)
      .then((appPage) => {
        if (!active) return
        setResult(appPage)
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
  }, [errorMessage, filters, load, page, t])

  // A narrowing the reader changes reads the first page of the listing again, since the page counts
  // the applications the filters kept
  function narrow(next: Partial<{ category: string | null; sort: AppSort; type: string | null }>) {
    void setParams({ ...next, page: null })
  }

  const narrowed = category !== null || type !== null

  return (
    <>
      <Group align='flex-end' gap='sm' mb='lg'>
        <CategoryFilter onChange={(next) => narrow({ category: next })} value={category} />
        <AppTypeSelect
          clearable
          onChange={(next) => narrow({ type: next })}
          placeholder={t('apps.filterAny')}
          value={type}
        />
        <AppSortSelect onChange={(next) => narrow({ sort: next })} value={sort} />
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
        <Text c='dimmed' className={styles.empty}>
          {narrowed ? (filteredEmptyMessage ?? emptyMessage) : emptyMessage}
        </Text>
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
              onChange={(nextPage) => void setParams({ page: nextPage })}
            />
          )}
        </>
      )}
    </>
  )
}
