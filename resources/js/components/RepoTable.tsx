import type { Data } from '@generated/data'
import { Alert, Group, Loader, Table, Text, TextInput } from '@mantine/core'
import { MagnifyingGlassIcon } from '@phosphor-icons/react/MagnifyingGlass'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import DistroSelect from './DistroSelect'
import ListFilter from './ListFilter'

import styles from './RepoTable.module.css'

const packageTypesWithIcons = new Set(['deb', 'rpm'])

/** Counts run into the hundreds of thousands, so they are grouped the way the locale does it. */
function formatCount(value: number, language: string) {
  return new Intl.NumberFormat(language).format(value)
}

type RepoTableProps = {
  /**
   * Reads the repositories to show. The loader has to keep its identity (`useCallback`), which is
   * also what tells the table to read again — the repositories of another release, or the same list
   * in another order.
   */
  load: () => Promise<Data.Repo[]>
  /**
   * Message of a table that holds no repository at all, which every page names after what it shows.
   * A table whose filters match nothing says so itself.
   */
  emptyMessage: string
  /** Controls the page keeps next to the table, such as the order it keeps in its URL. */
  extraFilters?: ReactNode
  /** Number of repositories the table holds, told whenever they are read. */
  onCountChange?: (count: number) => void
  /** Bumped by the page when something outside the table changed it, such as a deleted repository. */
  refreshKey?: number
  /**
   * Releases every row serves. A page that lists the repositories of one release — its own detail
   * page — already says which release that is, so it leaves the column out.
   */
  showDistros?: boolean
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
  extraFilters,
  onCountChange,
  refreshKey,
  showDistros = true,
  renderActions,
  onRowClick,
}: RepoTableProps) {
  const { t, i18n } = useTranslation()
  const [repos, setRepos] = useState<Data.Repo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // What the toolbar narrows the loaded repositories down by, which is nothing until it is used
  const [search, setSearch] = useState('')
  const [distroFilter, setDistroFilter] = useState<string | null>(null)
  const [sourceFilter, setSourceFilter] = useState<string | null>(null)
  // The callback is held in a ref, so that reading the repositories depends on the loader alone: a
  // page that passes an inline arrow would otherwise read them again on every one of its renders
  const reportCount = useRef(onCountChange)
  reportCount.current = onCountChange

  useEffect(() => {
    let active = true

    setLoading(true)
    setError(null)
    load()
      .then((repositories) => {
        if (!active) return
        setRepos(repositories)
        reportCount.current?.(repositories.length)
      })
      .catch((reason) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : t('repos.loadError'))
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [load, refreshKey, t])

  function formatDate(value: string | null) {
    if (!value) return t('repos.neverSynced')
    return new Intl.DateTimeFormat(i18n.language, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  }

  // The releases the loaded repositories name are the entries the distribution filter offers, so
  // that every option matches at least one row
  const distroEntries = useMemo(() => repos.flatMap((repo) => repo.distros), [repos])

  // Where a repository comes from, which the table narrows down by as well
  const sourceOptions = useMemo(
    () => [
      { value: 'distro', label: t('repos.sources.distro') },
      { value: 'community', label: t('repos.sources.community') },
    ],
    [t],
  )

  // The list arrives complete and small, so the filters and the search only narrow what is already
  // loaded, and the order the API returns is left untouched
  const visibleRepos = useMemo(() => {
    const wanted = search.trim().toLowerCase()

    return repos.filter((repo) => {
      if (sourceFilter !== null && repo.source !== sourceFilter) return false
      if (
        distroFilter !== null &&
        !repo.distros.some((distro) => String(distro.id) === distroFilter)
      ) {
        return false
      }
      if (!wanted) return true

      // A repository is found by its name, by the URL it reads from, and by the releases it serves
      const fields = [
        repo.name,
        repo.baseUrl,
        repo.type,
        repo.source,
        ...repo.distros.flatMap((distro) => [distro.name, distro.version ?? '', distro.arch]),
      ]
      return fields.join(' ').toLowerCase().includes(wanted)
    })
  }, [distroFilter, repos, search, sourceFilter])

  // An empty table is a different thing from filters that match nothing
  const noRows =
    repos.length === 0
      ? emptyMessage
      : search.trim()
        ? t('repos.searchEmpty')
        : distroFilter !== null
          ? t('repos.filterEmpty')
          : t('repos.sourceEmpty')

  return (
    <>
      {!loading &&
        repos.length > 0 && (
          // The filter carries a label and the search box does not, so the two are aligned at their
          // bottom edge, where the inputs themselves are
          <Group align='flex-end' mb='lg'>
            <TextInput
              aria-label={t('repos.filterSearch')}
              leftSection={<MagnifyingGlassIcon size={18} />}
              placeholder={t('repos.filterSearch')}
              value={search}
              w={240}
              onChange={(event) => setSearch(event.currentTarget.value)}
            />
            <DistroSelect
              distros={distroEntries}
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
      ) : visibleRepos.length === 0 ? (
        <Text c='dimmed'>{noRows}</Text>
      ) : (
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
            {visibleRepos.map((repo) => (
              <Table.Tr
                className={onRowClick ? styles.clickableRow : styles.row}
                key={repo.id}
                onClick={() => onRowClick?.(repo)}
              >
                <Table.Td>
                  <span className={styles.typeCell}>
                    {packageTypesWithIcons.has(repo.type) && (
                      <img alt='' className={styles.typeIcon} src={`/packages/${repo.type}.svg`} />
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
      )}
    </>
  )
}
