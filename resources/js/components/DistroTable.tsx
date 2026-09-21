import { Alert, Group, Loader, Pagination, Table, Text } from '@mantine/core'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { prefixedUrlKeys } from '../searchParams'
import { emptyDistroFilters, type Distro, type DistroFilters } from '../services/distros'
import type { Paginated } from '../types/pagination'
import { formatCount, formatDate } from '../utils/format'
import ArchSelect from './ArchSelect'
import DistroRelease from './DistroRelease'

import styles from './DistroTable.module.css'

/** Names the parameters of the table are kept in the query string under. */
const paramNames = ['arch', 'page'] as const

/** Architecture a listing starts at, which most releases of the catalog are published for. */
const defaultArch = 'x86_64'

/**
 * Value the cleared filter leaves in the query string: a parameter that is not there reads the
 * architecture a listing starts at, so a listing that starts at one architecture needs a value of
 * its own for every release at once.
 */
const anyArch = 'all'

type DistroTableProps = {
  /**
   * Reads one page of the listing, narrowed by the fields the toolbar holds. The loader has to keep
   * its identity (`useCallback`), which is also what tells the table that it reads something else
   * now — other search terms, another order, another architecture — and starts it over at its first
   * page. A page that has nothing to read answers with `null`, which the table shows as empty.
   */
  load: (page: number, filters: DistroFilters) => Promise<Paginated<Distro> | null>
  /**
   * Message of a table that holds no release at all, which every page names after what it shows. A
   * table whose filters match nothing says so itself.
   */
  emptyMessage: string
  /** Message of a listing that could not be read. */
  errorMessage?: string
  /** Controls the page keeps next to the table, such as the order it keeps in its URL. */
  extraFilters?: ReactNode
  /**
   * Whether the table shows the architecture its rows are narrowed by. A page that already fixes
   * what the table reads — the search results, which are narrowed by their own terms — leaves it
   * out, and the table then lists every release the page is about.
   */
  hideFilters?: boolean
  /**
   * Architecture the table starts at, which a page whose releases do not follow one architecture
   * leaves empty: what it lists — the releases a repository serves — are all of them, whatever they
   * were built for, and the toolbar narrows them from there.
   */
  initialArch?: string | null
  /** Admin controls of a row, such as its edit and delete buttons; without them there is no column. */
  renderActions?: (distro: Distro) => ReactNode
  /** What clicking a row opens, usually the detail page; rows that open nothing are plain text. */
  onRowClick?: (distro: Distro) => void
  /** Prefix the parameters carry, on a page that shows several listings at once. */
  paramPrefix?: string
}

/**
 * Table of distribution releases, which reads them itself and narrows them by the architecture its
 * toolbar holds — kept in the query string, so that a narrowed table can be shared and reloaded:
 * shared by the distribution listing, the search results and the detail page of a repository. A
 * listing starts at the architecture most releases are published for — unless its page says
 * otherwise — and clearing the filter reads every architecture at once.
 */
export default function DistroTable({
  load,
  emptyMessage,
  errorMessage,
  extraFilters,
  hideFilters = false,
  initialArch = defaultArch,
  renderActions,
  onRowClick,
  paramPrefix = '',
}: DistroTableProps) {
  const { t, i18n } = useTranslation()
  const [result, setResult] = useState<Paginated<Distro> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // The architecture the toolbar narrows the listing to, which the API reads, and the page of the
  // listing the reader is on; both are kept in the query string so that a narrowed table can be
  // shared and reloaded
  const [{ arch: archParam, page }, setParams] = useQueryStates(
    {
      arch: parseAsString,
      page: parseAsInteger.withDefault(1),
    },
    { urlKeys: prefixedUrlKeys(paramPrefix, paramNames) },
  )
  // What the page is read with, held as one value so that it is read again for a change of what
  // narrows it, and for nothing else
  const arch = archParam === anyArch ? null : (archParam ?? initialArch)
  const filters = useMemo<DistroFilters>(
    () => (hideFilters ? emptyDistroFilters : { ...emptyDistroFilters, arch }),
    [arch, hideFilters],
  )

  useEffect(() => {
    let active = true

    setLoading(true)
    setError(null)
    load(page, filters)
      .then((distroPage) => {
        if (!active) return
        setResult(distroPage)
      })
      .catch((reason) => {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : (errorMessage ?? t('distros.loadError')),
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

  /** A release the vendors no longer support, which the table says by colouring its end of life. */
  function isExpired(distro: Distro) {
    if (!distro.eolDate) return false
    const date = new Date(distro.eolDate)
    return !Number.isNaN(date.getTime()) && date.getTime() < Date.now()
  }

  // Every field is read by the API, so the toolbar stays where it is while another page is read —
  // the page does not move under the reader — and a listing the filter narrowed keeps it, so that
  // what was set can be taken back
  const showToolbar = !hideFilters && (result === null || result.meta.total > 0 || arch !== null)

  // An empty table is a different thing from a filter that matches nothing, which the count the
  // listing reports tells apart — a page beyond the last one holds no row either
  const noRows =
    result !== null && result.meta.total === 0 && arch !== null
      ? t('distros.filterEmpty')
      : emptyMessage

  return (
    <>
      {showToolbar && (
        <Group align='flex-end' gap='sm' mb='lg'>
          <ArchSelect
            label={t('common.architecture')}
            onChange={(next) => void setParams({ arch: next ?? anyArch, page: null })}
            placeholder={t('distros.filterAny')}
            value={arch}
          />
          {extraFilters}
        </Group>
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
          {noRows}
        </Text>
      ) : (
        <>
          <Table className={styles.table} highlightOnHover verticalSpacing='sm'>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('common.distribution')}</Table.Th>
                <Table.Th>{t('common.architecture')}</Table.Th>
                <Table.Th>{t('common.packageFormat')}</Table.Th>
                <Table.Th>{t('distros.columns.compatible')}</Table.Th>
                <Table.Th align='right'>{t('common.packages')}</Table.Th>
                <Table.Th align='right'>{t('common.apps')}</Table.Th>
                <Table.Th>{t('distros.columns.releaseDate')}</Table.Th>
                <Table.Th>{t('distros.columns.eolDate')}</Table.Th>
                {renderActions && <Table.Th />}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {result.data.map((distro) => (
                <Table.Tr
                  className={onRowClick ? styles.clickableRow : styles.row}
                  key={distro.id}
                  onClick={() => onRowClick?.(distro)}
                >
                  <Table.Td>
                    <DistroRelease distro={distro} />
                  </Table.Td>
                  <Table.Td>{distro.arch}</Table.Td>
                  <Table.Td>
                    <span className={styles.pkgType}>{distro.pkgType ?? '—'}</span>
                  </Table.Td>
                  <Table.Td>
                    {distro.compatibleDistro ? (
                      <DistroRelease arch={distro.arch} distro={distro.compatibleDistro} />
                    ) : (
                      '—'
                    )}
                  </Table.Td>
                  <Table.Td align='right'>{formatCount(distro.pkgCount, i18n.language)}</Table.Td>
                  <Table.Td align='right'>{formatCount(distro.appCount, i18n.language)}</Table.Td>
                  <Table.Td>
                    {distro.releaseDate ? formatDate(distro.releaseDate, i18n.language) : '—'}
                  </Table.Td>
                  <Table.Td>
                    {distro.eolDate ? (
                      <span className={isExpired(distro) ? styles.expired : undefined}>
                        {formatDate(distro.eolDate, i18n.language)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </Table.Td>
                  {renderActions && (
                    <Table.Td>
                      <div className={styles.actions} onClick={(event) => event.stopPropagation()}>
                        {renderActions(distro)}
                      </div>
                    </Table.Td>
                  )}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
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
