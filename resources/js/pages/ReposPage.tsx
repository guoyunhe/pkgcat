import type { Data } from '@generated/data'
import { Alert, Button, Select, Text, Title } from '@mantine/core'
import { PencilSimpleIcon } from '@phosphor-icons/react/PencilSimple'
import { PlusIcon } from '@phosphor-icons/react/Plus'
import { TrashIcon } from '@phosphor-icons/react/Trash'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useSearchParams } from 'wouter'

import { useAuth } from '../auth'
import { filterWidth } from '../components/ListFilter'
import RepoTable from '../components/RepoTable'
import {
  deleteRepo,
  getRepos,
  repoSort,
  repoSorts,
  type RepoFilters,
  type RepoSort,
} from '../services/repos'

import styles from './ReposPage.module.css'

export default function ReposPage() {
  const { t } = useTranslation()
  const { ready, user } = useAuth()
  const [, navigate] = useLocation()
  const [searchParams] = useSearchParams()
  const isAdmin = ready && user?.role === 'admin'
  // The sort order is read by the API, so it is kept in the URL and the listing is re-read for it
  const sort = repoSort(searchParams.get('sort'))

  const [error, setError] = useState<string | null>(null)
  // A deleted repository is not in the list anymore, which the table reads again to find out
  const [refresh, setRefresh] = useState(0)
  // The order is kept in the URL and the API reads it, and so are the filters the table holds: a
  // change of either reads the first page of the listing again
  const loadRepos = useCallback(
    (page: number, filters: RepoFilters) => getRepos(sort, filters, page),
    [sort],
  )

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
      <RepoTable
        emptyMessage={t('repos.notFound')}
        extraFilters={
          <Select
            allowDeselect={false}
            data={repoSorts.map((value) => ({ value, label: sortLabels[value] }))}
            label={t('common.sortBy')}
            onChange={(nextSort) => navigate(reposUrl(repoSort(nextSort)))}
            value={sort}
            w={filterWidth}
          />
        }
        load={loadRepos}
        onRowClick={(repo) => navigate(`/repos/${repo.id}`)}
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
