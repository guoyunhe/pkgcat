import type { Data } from '@generated/data'
import { Alert, Loader, Pagination, Text } from '@mantine/core'
import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { PkgFilters as PkgFiltersValue } from '../services/pkgs'
import type { Paginated } from '../types/pagination'
import PkgFilters, { emptyPkgFilters, useStoredPkgFilters } from './PkgFilters'
import PkgListItem from './PkgListItem'

import styles from './PkgList.module.css'

type PkgListProps = {
  /**
   * Reads one page of the listing, narrowed by the filters the toolbar holds. The loader has to
   * keep its identity (`useCallback`), which is also what tells the listing that it reads something
   * else now — other search terms, the packages of another application or release — and starts it
   * over at its first page. A page that has nothing to read answers with `null`, which the listing
   * shows as empty.
   */
  load: (page: number, filters: PkgFiltersValue) => Promise<Paginated<Data.Pkg> | null>
  /**
   * Whether the toolbar is shown above the rows. A listing that cannot be narrowed — the packages
   * of a release, which fixes the package format and the architecture — leaves it out and is read
   * with no filters.
   */
  showFilters?: boolean
  /** Number of packages the listing holds, told whenever a page of it is read. */
  onCountChange?: (count: number) => void
  /** Bumped by the page when something outside the listing changed it, such as a deleted package. */
  refreshKey?: number
  /** Message of the empty listing, which every page names after what it shows. */
  emptyMessage: string
  /** Message of an empty listing the filters narrowed down; without filters the one above is shown. */
  filteredEmptyMessage?: string
  /** Message of a listing that could not be read. */
  errorMessage?: string
  /** Extra controls per item, such as the admin actions. */
  renderActions?: (pkg: Data.Pkg) => ReactNode
  /** Render the longer package details (license, summary and install command). */
  showDetails?: boolean
}

/**
 * Listing of packages, which reads its own pages and shows the filters they are narrowed by: shared
 * by the catalog search, the details of an application, the details of a release and the listing of
 * every package.
 */
export default function PkgList({
  load,
  showFilters = true,
  onCountChange,
  refreshKey,
  emptyMessage,
  filteredEmptyMessage,
  errorMessage,
  renderActions,
  showDetails,
}: PkgListProps) {
  const { t } = useTranslation()
  const [storedFilters, setStoredFilters] = useStoredPkgFilters()
  // A listing without a toolbar is narrowed by nothing, whatever another listing stored
  const filters = showFilters ? storedFilters : emptyPkgFilters
  const [result, setResult] = useState<Paginated<Data.Pkg> | null>(null)
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
      .then((pkgPage) => {
        if (!active) return
        setResult(pkgPage)
        reportCount.current?.(pkgPage?.meta.total ?? 0)
      })
      .catch((reason) => {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : (errorMessage ?? t('common.loadPackagesError')),
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [errorMessage, listing, refreshKey, t])

  const narrowed = filters.distroId !== null || filters.type !== null || filters.arch !== null

  return (
    <>
      {showFilters && <PkgFilters onChange={setStoredFilters} value={storedFilters} />}
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
            {result.data.map((pkg) => (
              <PkgListItem
                actions={renderActions?.(pkg)}
                key={pkg.id}
                pkg={pkg}
                showDetails={showDetails}
              />
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
