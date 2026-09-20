import type { Data } from '@generated/data'
import { Alert, Loader, Pagination, Text } from '@mantine/core'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
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
   * else now — other search terms, the packages of another application or release. A page that has
   * nothing to read answers with `null`, which the listing shows as empty.
   */
  load: (page: number, filters: PkgFiltersValue) => Promise<Paginated<Data.Pkg> | null>
  /**
   * Whether the toolbar is shown above the rows. A listing that cannot be narrowed — the packages
   * of a release, which fixes the package format — leaves it out and is read with no filters.
   */
  showFilters?: boolean
  /**
   * Whether the distribution is remembered for a later visit, which the package listing asks for: a
   * distribution the query string does not name is read from what was set last time. A listing that
   * shares its page with others — the search results, which reset what a tab was narrowed by —
   * leaves it out, and reads the query string alone.
   */
  rememberFilters?: boolean
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
 * Listing of packages, which reads its own pages and shows the filters they are narrowed by — kept
 * in the query string, so that a narrowed listing can be shared and reloaded. Shared by the catalog
 * search, the details of an application, the details of a release and the listing of every
 * package.
 */
export default function PkgList({
  load,
  showFilters = true,
  rememberFilters = false,
  refreshKey,
  emptyMessage,
  filteredEmptyMessage,
  errorMessage,
  renderActions,
  showDetails,
}: PkgListProps) {
  const { t } = useTranslation()
  // The distribution the reader narrowed to is remembered across visits, which is what a listing
  // that names none falls back to; the package format is never remembered
  const [remembered, setRemembered] = useStoredPkgFilters()
  const [{ distroId, page, type }, setParams] = useQueryStates({
    distroId: parseAsString,
    page: parseAsInteger.withDefault(1),
    type: parseAsString,
  })
  // What the query string names wins over what an earlier visit remembered, and a listing without a
  // toolbar is narrowed by nothing at all
  const filters = useMemo<PkgFiltersValue>(() => {
    if (!showFilters) return emptyPkgFilters
    return {
      distroId: distroId ?? (rememberFilters ? remembered.distroId : null),
      type,
    }
  }, [distroId, rememberFilters, remembered, showFilters, type])
  const [result, setResult] = useState<Paginated<Data.Pkg> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    setLoading(true)
    setError(null)
    load(page, filters)
      .then((pkgPage) => {
        if (!active) return
        setResult(pkgPage)
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
  }, [errorMessage, filters, load, page, refreshKey, t])

  // What the toolbar is set to is kept in the query string, the chosen distribution is also
  // remembered for a later visit, and a narrowing the reader changes reads the first page of the
  // listing again
  function changeFilters(next: PkgFiltersValue) {
    if (rememberFilters) setRemembered({ distroId: next.distroId })
    void setParams({
      distroId: next.distroId,
      page: null,
      type: next.type,
    })
  }

  const narrowed = filters.distroId !== null || filters.type !== null

  return (
    <>
      {showFilters && <PkgFilters onChange={changeFilters} value={filters} />}
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
              onChange={(nextPage) => void setParams({ page: nextPage })}
            />
          )}
        </>
      )}
    </>
  )
}
