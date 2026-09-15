import type { Data } from '@generated/data'
import { Alert, Button, Group, Select, Text, TextInput, Title } from '@mantine/core'
import { MagnifyingGlassIcon } from '@phosphor-icons/react/MagnifyingGlass'
import { PencilSimpleIcon } from '@phosphor-icons/react/PencilSimple'
import { PlusIcon } from '@phosphor-icons/react/Plus'
import { TrashIcon } from '@phosphor-icons/react/Trash'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useSearchParams } from 'wouter'

import { useAuth } from '../auth'
import DistroSelect from '../components/DistroSelect'
import ListFilter from '../components/ListFilter'
import RepoTable from '../components/RepoTable'
import { deleteRepo, getRepos, repoSort, repoSorts, type RepoSort } from '../services/repos'

import styles from './ReposPage.module.css'

export default function ReposPage() {
  const { t } = useTranslation()
  const { ready, user } = useAuth()
  const [, navigate] = useLocation()
  const [searchParams] = useSearchParams()
  const isAdmin = ready && user?.role === 'admin'
  // The sort order is read by the API, so it is kept in the URL and the listing is re-read for it
  const sort = repoSort(searchParams.get('sort'))

  // The repositories the table read, which the controls below narrow down
  const [repos, setRepos] = useState<Data.Repo[]>([])
  const [error, setError] = useState<string | null>(null)
  // A deleted repository is not in the list anymore, which the table reads again to find out
  const [refresh, setRefresh] = useState(0)
  // A repository serves the releases of the distributions it publishes, which is how the entries the
  // loaded repositories name become the options that narrow the list down
  const [distroFilter, setDistroFilter] = useState<string | null>(null)
  const [sourceFilter, setSourceFilter] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const loadRepos = useCallback(() => getRepos(sort), [sort])

  function reposUrl(nextSort: RepoSort) {
    return nextSort === 'name' ? '/repos' : `/repos?sort=${nextSort}`
  }

  async function remove(repo: Data.Repo) {
    if (!window.confirm(t('repos.confirmDelete', { name: repo.name }))) return
    try {
      await deleteRepo(repo.id)
      setRefresh((value) => value + 1)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('repos.deleteError'))
    }
  }

  // The releases the loaded repositories name are the entries the filter offers
  const distroEntries = useMemo(() => repos.flatMap((repo) => repo.distros), [repos])

  // Where a repository comes from, which the listing narrows down by as well
  const sourceOptions = useMemo(
    () => [
      { value: 'distro', label: t('repos.sources.distro') },
      { value: 'community', label: t('repos.sources.community') },
    ],
    [t],
  )

  // The list arrives complete and small, so the filters and the search only narrow what is already
  // loaded, and the order the API returns — the repositories by name — is left untouched
  const repoIsVisible = useCallback(
    (repo: Data.Repo) => {
      if (sourceFilter !== null && repo.source !== sourceFilter) return false
      if (
        distroFilter !== null &&
        !repo.distros.some((distro) => String(distro.id) === distroFilter)
      ) {
        return false
      }

      const wanted = search.trim().toLowerCase()
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
    },
    [distroFilter, search, sourceFilter],
  )

  // An empty list is a different thing from a filter that matches nothing
  const emptyMessage =
    repos.length === 0
      ? t('repos.notFound')
      : search.trim()
        ? t('repos.searchEmpty')
        : distroFilter !== null
          ? t('repos.filterEmpty')
          : t('repos.sourceEmpty')

  // Every order is shared with the listing it names, so no label lives in the repositories section
  const sortLabels: Record<RepoSort, string> = {
    apps: t('common.apps'),
    name: t('common.name'),
    packages: t('common.packages'),
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Text className={styles.eyebrow}>{t('common.administration')}</Text>
          <Title order={1}>{t('common.repositories')}</Title>
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
      {repos.length > 0 && (
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
          <Select
            allowDeselect={false}
            data={repoSorts.map((value) => ({ value, label: sortLabels[value] }))}
            label={t('common.sortBy')}
            onChange={(nextSort) => navigate(reposUrl(repoSort(nextSort)))}
            value={sort}
            w={180}
          />
        </Group>
      )}
      <RepoTable
        emptyMessage={emptyMessage}
        filter={repoIsVisible}
        load={loadRepos}
        onLoad={setRepos}
        onRowClick={isAdmin ? (repo) => navigate(`/repos/${repo.id}/edit`) : undefined}
        refreshKey={refresh}
        renderActions={
          isAdmin
            ? (repo) => (
                <>
                  <Button
                    aria-label={t('common.edit')}
                    component={Link}
                    href={`/repos/${repo.id}/edit`}
                    size='xs'
                    variant='subtle'
                  >
                    <PencilSimpleIcon size={16} />
                  </Button>
                  <Button
                    aria-label={t('common.delete')}
                    color='red'
                    size='xs'
                    variant='subtle'
                    onClick={() => void remove(repo)}
                  >
                    <TrashIcon size={16} />
                  </Button>
                </>
              )
            : undefined
        }
      />
    </main>
  )
}
