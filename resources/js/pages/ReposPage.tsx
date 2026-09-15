import type { Data } from '@generated/data'
import { Alert, Button, Group, Loader, Select, Table, Text, TextInput, Title } from '@mantine/core'
import { MagnifyingGlassIcon } from '@phosphor-icons/react/MagnifyingGlass'
import { PencilSimpleIcon } from '@phosphor-icons/react/PencilSimple'
import { PlusIcon } from '@phosphor-icons/react/Plus'
import { TrashIcon } from '@phosphor-icons/react/Trash'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useSearchParams } from 'wouter'

import { useAuth } from '../auth'
import DistroSelect from '../components/DistroSelect'
import ListFilter from '../components/ListFilter'
import { deleteRepo, getRepos, repoSort, repoSorts, type RepoSort } from '../services/repos'

import styles from './ReposPage.module.css'

const packageTypesWithIcons = new Set(['deb', 'rpm'])

/** Counts run into the hundreds of thousands, so they are grouped the way the locale does it. */
function formatCount(value: number, language: string) {
  return new Intl.NumberFormat(language).format(value)
}

export default function ReposPage() {
  const { t, i18n } = useTranslation()
  const { ready, user } = useAuth()
  const [, navigate] = useLocation()
  const [searchParams] = useSearchParams()
  const isAdmin = ready && user?.role === 'admin'
  // The sort order is read by the API, so it is kept in the URL and the listing is re-read for it
  const sort = repoSort(searchParams.get('sort'))

  const [repos, setRepos] = useState<Data.Repo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // A repository serves the releases of the distributions it publishes, which is how the entries the
  // loaded repositories name become the options that narrow the list down
  const [distroFilter, setDistroFilter] = useState<string | null>(null)
  const [sourceFilter, setSourceFilter] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  async function loadRepos() {
    try {
      setLoading(true)
      setRepos(await getRepos(sort))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('repos.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRepos()
  }, [sort])

  function reposUrl(nextSort: RepoSort) {
    return nextSort === 'name' ? '/repos' : `/repos?sort=${nextSort}`
  }

  async function remove(repo: Data.Repo) {
    if (!window.confirm(t('repos.confirmDelete', { name: repo.name }))) return
    try {
      await deleteRepo(repo.id)
      setRepos((current) => current.filter((item) => item.id !== repo.id))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('repos.deleteError'))
    }
  }

  function formatDate(value: string | null) {
    if (!value) return t('repos.neverSynced')
    return new Intl.DateTimeFormat(i18n.language, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  }

  // The releases the loaded repositories name are the entries the filter offers
  const distroEntries = useMemo(() => repos.flatMap((repo) => repo.distros), [repos])

  // Where a repository comes from, which the list shows and narrows down by as well
  const sourceOptions = useMemo(
    () => [
      { value: 'distro', label: t('repos.sources.distro') },
      { value: 'community', label: t('repos.sources.community') },
    ],
    [t],
  )
  const sourceLabels = useMemo(
    () => new Map(sourceOptions.map((option) => [option.value, option.label])),
    [sourceOptions],
  )

  // The list arrives complete and small, so the filters and the search only narrow what is already
  // loaded, and the order the API returns — the repositories by name — is left untouched
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

  // An empty list is a different thing from a filter that matches nothing
  const emptyMessage =
    repos.length === 0
      ? t('repos.notFound')
      : search.trim()
        ? t('repos.searchEmpty')
        : distroFilter !== null
          ? t('repos.filterEmpty')
          : t('repos.sourceEmpty')

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Text className={styles.eyebrow}>{t('repos.eyebrow')}</Text>
          <Title order={1}>{t('repos.title')}</Title>
          <Text c='dimmed'>{t('repos.subtitle')}</Text>
        </div>
        {isAdmin && (
          <Button
            component={Link}
            href='/repos/new'
            leftSection={<PlusIcon size={18} weight='bold' />}
          >
            {t('repos.addRepo')}
          </Button>
        )}
      </header>

      {error && (
        <Alert color='red' mb='lg'>
          {error}
        </Alert>
      )}
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
              label={t('repos.filterDistro')}
              onChange={setDistroFilter}
              placeholder={t('repos.filterAny')}
              searchable
              value={distroFilter}
            />
            <ListFilter
              data={sourceOptions}
              label={t('repos.filterSource')}
              onChange={setSourceFilter}
              placeholder={t('repos.filterAnySource')}
              value={sourceFilter}
            />
            <Select
              allowDeselect={false}
              data={repoSorts.map((value) => ({ value, label: t(`repos.sort.${value}`) }))}
              label={t('repos.sort.label')}
              onChange={(nextSort) => navigate(reposUrl(repoSort(nextSort)))}
              value={sort}
              w={180}
            />
          </Group>
        )}
      {loading ? (
        <div className={styles.loading}>
          <Loader color='orange' />
        </div>
      ) : visibleRepos.length === 0 ? (
        <Text c='dimmed'>{emptyMessage}</Text>
      ) : (
        <Table className={styles.table} highlightOnHover verticalSpacing='sm'>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('repos.columns.type')}</Table.Th>
              <Table.Th>{t('repos.columns.source')}</Table.Th>
              <Table.Th>{t('repos.columns.name')}</Table.Th>
              <Table.Th>{t('repos.columns.distros')}</Table.Th>
              <Table.Th>{t('repos.columns.packages')}</Table.Th>
              <Table.Th>{t('repos.columns.apps')}</Table.Th>
              <Table.Th>{t('repos.columns.syncInterval')}</Table.Th>
              <Table.Th>{t('repos.columns.lastSynced')}</Table.Th>
              {isAdmin && <Table.Th />}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {visibleRepos.map((repo) => (
              <Table.Tr
                className={isAdmin ? styles.clickableRow : styles.row}
                key={repo.id}
                onClick={() => {
                  if (isAdmin) navigate(`/repos/${repo.id}/edit`)
                }}
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
                    {sourceLabels.get(repo.source) ?? repo.source}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <div className={styles.name}>{repo.name}</div>
                  <div className={styles.baseUrl}>{repo.baseUrl}</div>
                </Table.Td>
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
                {isAdmin && (
                  <Table.Td>
                    <div className={styles.actions} onClick={(event) => event.stopPropagation()}>
                      <Button
                        aria-label={t('repos.edit')}
                        component={Link}
                        href={`/repos/${repo.id}/edit`}
                        size='xs'
                        variant='subtle'
                      >
                        <PencilSimpleIcon size={16} />
                      </Button>
                      <Button
                        aria-label={t('repos.delete')}
                        color='red'
                        size='xs'
                        variant='subtle'
                        onClick={() => void remove(repo)}
                      >
                        <TrashIcon size={16} />
                      </Button>
                    </div>
                  </Table.Td>
                )}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </main>
  )
}
