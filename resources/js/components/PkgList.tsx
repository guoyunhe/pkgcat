import type { Data } from '@generated/data'
import { Alert, Loader, Pagination, Text } from '@mantine/core'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useAuth } from '../auth'
import type { PkgFilters as PkgFiltersValue } from '../services/pkgs'
import type { Paginated } from '../types/pagination'
import { distroIndependentPackageTypes } from '../utils/pkgTypes'
import PkgFilters, {
  emptyPkgFilters,
  filterDefaults,
  filtersAreNarrowed,
  useDistroCatalog,
  useStoredPkgFilters,
} from './PkgFilters'
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
   * Whether the filters are remembered for a later visit, which the package listing asks for: a
   * filter the query string does not name is read from what was set last time. A listing that
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
  /** Render the longer package details (license and install command). */
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
  const { ready, user } = useAuth()
  // The releases the toolbar offers, which the two required filters of the reader are also read from
  const catalog = useDistroCatalog(showFilters)
  const [remembered, setRemembered] = useStoredPkgFilters()
  const [{ arch: chosenArch, distroId: chosenDistro, page, type: chosenType }, setParams] =
    useQueryStates({
      arch: parseAsString,
      distroId: parseAsString,
      page: parseAsInteger.withDefault(1),
      type: parseAsString,
    })
  const distroIdOfUser = user?.distroId ?? null
  // The package format and the architecture of the release the reader runs, which is what the two
  // required filters start at
  const defaults = useMemo(
    () => filterDefaults(catalog ?? [], distroIdOfUser),
    [catalog, distroIdOfUser],
  )
  // The package format and the architecture always name a value — what the query string names,
  // then what an earlier visit remembered, then the release the reader runs — while the
  // distribution is only named when the reader picked one. A listing without a toolbar is narrowed
  // by nothing at all, and the defaulted values are nowhere read from storage
  const filters = useMemo<PkgFiltersValue>(() => {
    if (!showFilters) return emptyPkgFilters
    const stored = rememberFilters ? remembered : emptyPkgFilters
    const type = chosenType ?? stored.type ?? defaults.type
    return {
      arch: chosenArch ?? stored.arch ?? defaults.arch,
      distroId: distroIndependentPackageTypes.includes(type)
        ? null
        : (chosenDistro ?? stored.distroId),
      type,
    }
  }, [chosenArch, chosenDistro, chosenType, defaults, rememberFilters, remembered, showFilters])
  const [result, setResult] = useState<Paginated<Data.Pkg> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // The reader's release is what the two required filters start at, so the first read waits for it
  const waiting = showFilters && (!ready || catalog === null)

  useEffect(() => {
    if (waiting) return

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
  }, [errorMessage, filters, load, page, refreshKey, t, waiting])

  // What the toolbar is set to is kept in the query string, the filters are also remembered for a
  // later visit, and a narrowing the reader changes reads the first page of the listing again
  function changeFilters(next: PkgFiltersValue) {
    if (rememberFilters) setRemembered(next)
    void setParams({
      arch: next.arch,
      distroId: next.distroId,
      page: null,
      type: next.type,
    })
  }

  const narrowed = showFilters && filtersAreNarrowed(filters, defaults)

  return (
    <>
      {showFilters && (
        <PkgFilters
          arches={catalog?.map((distro) => distro.arch) ?? []}
          catalog={catalog ?? []}
          defaults={defaults}
          onChange={changeFilters}
          value={filters}
        />
      )}
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
