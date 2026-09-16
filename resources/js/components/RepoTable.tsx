import type { Data } from '@generated/data'
import { Alert, Group, Loader, Pagination, Table, Text, TextInput } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { MagnifyingGlassIcon } from '@phosphor-icons/react/MagnifyingGlass'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { emptyRepoFilters, repoSources, type RepoFilters } from '../services/repos'
import type { Paginated } from '../types/pagination'
import DistroSelect from './DistroSelect'
import ListFilter, { filterWidth } from './ListFilter'

import styles from './RepoTable.module.css'

const packageTypesWithIcons = new Set(['deb', 'rpm'])

/** Counts run into the hundreds of thousands, so they are grouped the way the locale does it. */
function formatCount(value: number, language: string) {
  return new Intl.NumberFormat(language).format(value)
}

type RepoTableProps = {
  /**
   * Reads one page of the listing, narrowed by the fields the toolbar holds. The loader has to keep
   * its identity (`useCallback`), which is also what tells the table that it reads something else
   * now — another order, another release — and starts it over at its first page. A page that has
   * nothing to read answers with `null`, which the table shows as empty.
   */
  load: (page: number, filters: RepoFilters) => Promise<Paginated<Data.Repo> | null>
  /**
   * Message of a table that holds no repository at all, which every page names after what it shows.
   * A table whose filters match nothing says so itself.
   */
  emptyMessage: string
  /** Message of a listing that could not be read. */
  errorMessage?: string
  /** Controls the page keeps next to the table, such as the order it keeps in its URL. */
  extraFilters?: ReactNode
  /** Number of repositories the table lists, told whenever a page of it is read. */
  onCountChange?: (count: number) => void
  /** Bumped by the page when something outside the table changed it, such as a deleted repository. */
  refreshKey?: number
  /**
   * Releases every row serves. A page that lists the repositories of one release — its own detail
   * page — already says which release that is, so it leaves the column out.
   */
  showDistros?: boolean
  /**
   * Whether the table shows the fields its rows are narrowed by. A page that already fixes what the
   * table reads — the detail page of a release, whose repositories all serve it — leaves them out,
   * and the table then lists every repository the page is about.
   */
  hideFilters?: boolean
  /** Admin controls of a row, such as its edit and delete buttons; without them there is no column. */
  renderActions?: (repo: Data.Repo) => ReactNode
  /** What clicking a row opens, usually the editor; rows that open nothing are plain text. */
  onRowClick?: (repo: Data.Repo) => void
}

/**
 * Table of repositories, which reads them itself and narrows them by what its toolbar holds: shared
 * by the repository listing and the detail page of a release.
 */
export default function RepoTable({
  load,
  emptyMessage,
  errorMessage,
  extraFilters,
  onCountChange,
  refreshKey,
  showDistros = true,
  hideFilters = false,
  renderActions,
  onRowClick,
}: RepoTableProps) {
  const { t, i18n } = useTranslation()
  const [result, setResult] = useState<Paginated<Data.Repo> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // What the toolbar narrows the listing down by, which is nothing until it is used. The API reads
  // every one of them, so a change reads another page — the search terms however wait for the
  // typing to pause first, since a word would otherwise be asked for letter by letter
  const [search, setSearch] = useState('')
  const [distroFilter, setDistroFilter] = useState<string | null>(null)
  const [sourceFilter, setSourceFilter] = useState<string | null>(null)
  // The hook answers with the value, the way to drop a pending change and the handlers around it
  const [debouncedSearch] = useDebouncedValue(search, 300)
  // The callback is held in a ref, so that reading a page depends on the loader alone: a page that
  // passes an inline arrow would otherwise read another page on every one of its renders
  const reportCount = useRef(onCountChange)
  reportCount.current = onCountChange
  // What the page is read with, held as one value so that it is read again for a change of what
  // narrows it, and for nothing else
  const filters = useMemo<RepoFilters>(
    () =>
      hideFilters
        ? emptyRepoFilters
        : {
            distroId: distroFilter === null ? null : Number(distroFilter),
            q: debouncedSearch.trim(),
            source: sourceFilter,
          },
    [debouncedSearch, distroFilter, hideFilters, sourceFilter],
  )
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
      .then((repoPage) => {
        if (!active) return
        setResult(repoPage)
        reportCount.current?.(repoPage?.meta.total ?? 0)
      })
      .catch((reason) => {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : (errorMessage ?? t('repos.loadError')),
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

  function formatDate(value: string | null) {
    if (!value) return t('repos.neverSynced')
    return new Intl.DateTimeFormat(i18n.language, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  }

  // Where a repository comes from, which the table narrows down by as well
  const sourceOptions = useMemo(
    () => repoSources.map((source) => ({ value: source, label: t(`repos.sources.${source}`) })),
    [t],
  )

  // Every field is read by the API, so the toolbar stays where it is while another page is read —
  // the page does not move under the reader — and a listing the filters narrowed keeps it, so that
  // what was set can be taken back
  const narrowed = search.trim() !== '' || distroFilter !== null || sourceFilter !== null
  const showToolbar = !hideFilters && (result === null || result.meta.total > 0 || narrowed)

  // An empty table is a different thing from filters that match nothing, which the count the
  // listing reports tells apart — a page beyond the last one holds no row either
  const noRows =
    result !== null && result.meta.total === 0 && narrowed
      ? search.trim() !== ''
        ? t('repos.searchEmpty')
        : distroFilter !== null
          ? t('repos.filterEmpty')
          : t('repos.sourceEmpty')
      : emptyMessage

  return (
    <>
      {showToolbar && (
        // The filter carries a label and the search box does not, so the two are aligned at their
        // bottom edge, where the inputs themselves are
        <Group align='flex-end' gap='sm' mb='lg'>
          <TextInput
            aria-label={t('repos.filterSearch')}
            leftSection={<MagnifyingGlassIcon size={18} />}
            placeholder={t('repos.filterSearch')}
            value={search}
            w={filterWidth}
            onChange={(event) => setSearch(event.currentTarget.value)}
          />
          <DistroSelect
            label={t('common.distribution')}
            onChange={setDistroFilter}
            placeholder={t('repos.filterAny')}
            searchable
            value={distroFilter}
          />
          <ListFilter
            data={sourceOptions}
            label={t('common.source')}
            onChange={setSourceFilter}
            placeholder={t('repos.filterAnySource')}
            value={sourceFilter}
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
                <Table.Th>{t('common.packageFormat')}</Table.Th>
                <Table.Th>{t('common.source')}</Table.Th>
                <Table.Th>{t('common.repository')}</Table.Th>
                {showDistros && <Table.Th>{t('common.distributions')}</Table.Th>}
                <Table.Th>{t('common.packages')}</Table.Th>
                <Table.Th>{t('common.apps')}</Table.Th>
                <Table.Th>{t('repos.columns.syncInterval')}</Table.Th>
                <Table.Th>{t('repos.columns.lastSynced')}</Table.Th>
                {renderActions && <Table.Th />}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {result.data.map((repo) => (
                <Table.Tr
                  className={onRowClick ? styles.clickableRow : styles.row}
                  key={repo.id}
                  onClick={() => onRowClick?.(repo)}
                >
                  <Table.Td>
                    <span className={styles.typeCell}>
                      {packageTypesWithIcons.has(repo.type) && (
                        <img
                          alt=''
                          className={styles.typeIcon}
                          src={`/packages/${repo.type}.svg`}
                        />
                      )}
                      {repo.type}
                    </span>
                  </Table.Td>
                  <Table.Td>
                    <Text size='sm' c='dimmed'>
                      {/* A source the interface does not know is still named by the value it was stored as */}
                      {t(`repos.sources.${repo.source}`, { defaultValue: repo.source })}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <div className={styles.name}>{repo.name}</div>
                    <div className={styles.baseUrl}>{repo.baseUrl}</div>
                  </Table.Td>
                  {showDistros && (
                    <Table.Td>
                      {repo.distros.length === 0 ? (
                        '—'
                      ) : (
                        <div className={styles.distrosCell}>
                          {repo.distros.map((distro) => (
                            <span className={styles.distroCell} key={distro.id}>
                              <img
                                alt=''
                                className={styles.distroIcon}
                                src={`/distros/${encodeURIComponent(distro.name)}.svg`}
                              />
                              <span>{distro.name}</span>
                              {distro.version && (
                                <span className={styles.distroVersion}>{distro.version}</span>
                              )}
                              <span className={styles.distroArch}>{distro.arch}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </Table.Td>
                  )}
                  <Table.Td>
                    <Text size='sm'>{formatCount(repo.pkgCount, i18n.language)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size='sm'>{formatCount(repo.appCount, i18n.language)}</Text>
                  </Table.Td>
                  <Table.Td>
                    {repo.syncIntervalDays
                      ? t('repos.everyDays', { count: repo.syncIntervalDays })
                      : t('repos.manual')}
                  </Table.Td>
                  <Table.Td>
                    <Text size='sm' c='dimmed'>
                      {formatDate(repo.lastSyncedAt)}
                    </Text>
                  </Table.Td>
                  {renderActions && (
                    <Table.Td>
                      <div className={styles.actions} onClick={(event) => event.stopPropagation()}>
                        {renderActions(repo)}
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
              onChange={(page) => setListing({ ...listing, page })}
            />
          )}
        </>
      )}
    </>
  )
}
