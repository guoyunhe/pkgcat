import type { Data } from '@generated/data'
import { Alert, Button, Group, Loader, Table, Text, Title } from '@mantine/core'
import { PencilSimpleIcon } from '@phosphor-icons/react/PencilSimple'
import { PlusIcon } from '@phosphor-icons/react/Plus'
import { TrashIcon } from '@phosphor-icons/react/Trash'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'wouter'

import { useAuth } from '../auth'
import DistroSelect from '../components/DistroSelect'
import { deleteRepo, getRepos } from '../services/repos'

import styles from './ReposPage.module.css'

const packageTypesWithIcons = new Set(['deb', 'rpm'])

export default function ReposPage() {
  const { t, i18n } = useTranslation()
  const { ready, user } = useAuth()
  const [, navigate] = useLocation()
  const isAdmin = ready && user?.role === 'admin'

  const [repos, setRepos] = useState<Data.Repo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // A repository serves the releases of the distributions it publishes, which is how the entries the
  // loaded repositories name become the options that narrow the list down
  const [distroFilter, setDistroFilter] = useState<string | null>(null)

  async function loadRepos() {
    try {
      setLoading(true)
      setRepos(await getRepos())
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('repos.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRepos()
  }, [])

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

  // The list arrives complete and small, so the filter only narrows what is already loaded, and the
  // order the API returns — the repositories by name — is left untouched
  const visibleRepos = useMemo(
    () =>
      distroFilter === null
        ? repos
        : repos.filter((repo) => repo.distros.some((distro) => String(distro.id) === distroFilter)),
    [distroFilter, repos],
  )

  // An empty list is a different thing from a filter that matches nothing
  const emptyMessage = repos.length === 0 ? t('repos.notFound') : t('repos.filterEmpty')

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
      {!loading && repos.length > 0 && (
        <Group mb='lg'>
          <DistroSelect
            distros={distroEntries}
            label={t('repos.filterDistro')}
            onChange={setDistroFilter}
            placeholder={t('repos.filterAny')}
            searchable
            value={distroFilter}
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
              <Table.Th>{t('repos.columns.name')}</Table.Th>
              <Table.Th>{t('repos.columns.distros')}</Table.Th>
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
