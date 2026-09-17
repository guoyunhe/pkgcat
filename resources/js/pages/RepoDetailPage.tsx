import type { Data } from '@generated/data'
import { Alert, Anchor, Button, Group, Loader, Stack, Tabs, Text, Title } from '@mantine/core'
import { ArrowLeftIcon } from '@phosphor-icons/react/ArrowLeft'
import { PencilSimpleIcon } from '@phosphor-icons/react/PencilSimple'
import { TrashIcon } from '@phosphor-icons/react/Trash'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useRoute } from 'wouter'

import { useAuth } from '../auth'
import CountBadge from '../components/CountBadge'
import DistroRelease from '../components/DistroRelease'
import PkgList from '../components/PkgList'
import { deleteRepo, getRepo, getRepoPackages } from '../services/repos'
import { formatCount } from '../utils/format'

import styles from './DetailPage.module.css'

/** Sections of the page, which the tabs switch between. */
type RepoTab = 'packages' | 'distros'

/**
 * Details of one repository: what it is, where it reads from and how it is set up, along with the
 * packages extracted from it and the releases it serves.
 */
export default function RepoDetailPage() {
  const { t, i18n } = useTranslation()
  const { ready, user } = useAuth()
  const [, navigate] = useLocation()
  const [, params] = useRoute('/repos/:id')
  const repoId = params?.id ? Number(params.id) : undefined
  const [repo, setRepo] = useState<Data.Repo | null>(null)
  const [activeTab, setActiveTab] = useState<RepoTab>('packages')
  // What the package listing holds, which it says itself and the tab shows
  const [pkgCount, setPkgCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  // A route without a repository reads nothing; the page shows the invalid id instead of the listing
  const readPkgs = useCallback(
    (page: number) =>
      repoId ? getRepoPackages(repoId, page, i18n.language) : Promise.resolve(null),
    [repoId, i18n.language],
  )

  useEffect(() => {
    if (!repoId) {
      setError(t('repos.detail.invalidId'))
      return
    }
    getRepo(repoId)
      .then(setRepo)
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : t('repos.detail.loadError')),
      )
  }, [repoId, t])

  if (error) {
    return (
      <main className={styles.page}>
        <Alert color='red'>{error}</Alert>
      </main>
    )
  }
  if (!repo || !ready) {
    return (
      <div className={styles.loading}>
        <Loader color='orange' />
      </div>
    )
  }

  const isAdmin = user?.role === 'admin'

  /** One field of the setup, which is only shown when the repository carries it. */
  function setup(label: string, value: string | null) {
    if (!value) return null
    return (
      <section className={styles.section}>
        <Title order={2}>{label}</Title>
        <Text className={styles.code}>{value}</Text>
      </section>
    )
  }

  async function remove() {
    if (!repo) return
    if (!window.confirm(t('repos.confirmDelete', { name: repo.name }))) return
    try {
      await deleteRepo(repo.id)
      navigate('/repos')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('repos.deleteError'))
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Button
          component={Link}
          href='/repos'
          leftSection={<ArrowLeftIcon size={18} />}
          variant='subtle'
        >
          {t('repos.detail.back')}
        </Button>
        {isAdmin && (
          <Group gap='xs'>
            <Button
              component={Link}
              href={`/repos/${repo.id}/edit`}
              leftSection={<PencilSimpleIcon size={18} />}
              variant='default'
            >
              {t('repos.editRepo')}
            </Button>
            <Button
              color='red'
              leftSection={<TrashIcon size={18} />}
              variant='subtle'
              onClick={() => void remove()}
            >
              {t('common.delete')}
            </Button>
          </Group>
        )}
      </header>

      <section className={styles.intro}>
        {repo.type === 'deb' || repo.type === 'rpm' || repo.type === 'pacman' ? (
          <img alt='' className={styles.icon} src={`/packages/${repo.type}.svg`} />
        ) : (
          <div className={styles.icon} />
        )}
        <div>
          <Text className={styles.eyebrow}>{t('repos.detail.eyebrow')}</Text>
          <Title order={1}>{repo.name}</Title>
          <Text c='dimmed'>{repo.baseUrl}</Text>
        </div>
      </section>

      <section className={styles.metadata}>
        <div>
          <Text size='sm' c='dimmed'>
            {t('common.packageFormat')}
          </Text>
          <Text className={styles.status}>{repo.type}</Text>
        </div>
        <div>
          <Text size='sm' c='dimmed'>
            {t('common.source')}
          </Text>
          {/* A source the interface does not know is still named by the value it was stored as */}
          <Text>{t(`repos.sources.${repo.source}`, { defaultValue: repo.source })}</Text>
        </div>
        <div>
          <Text size='sm' c='dimmed'>
            {t('repos.columns.syncInterval')}
          </Text>
          <Text>
            {repo.syncIntervalDays
              ? t('repos.everyDays', { count: repo.syncIntervalDays })
              : t('repos.manual')}
          </Text>
        </div>
        <div>
          <Text size='sm' c='dimmed'>
            {t('repos.columns.lastSynced')}
          </Text>
          <Text>
            {repo.lastSyncedAt
              ? new Intl.DateTimeFormat(i18n.language, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(repo.lastSyncedAt))
              : t('repos.neverSynced')}
          </Text>
        </div>
        <div>
          <Text size='sm' c='dimmed'>
            {t('common.packages')}
          </Text>
          <Text>{formatCount(repo.pkgCount, i18n.language)}</Text>
        </div>
        <div>
          <Text size='sm' c='dimmed'>
            {t('common.apps')}
          </Text>
          <Text>{formatCount(repo.appCount, i18n.language)}</Text>
        </div>
        <div>
          <Text size='sm' c='dimmed'>
            {t('common.distributions')}
          </Text>
          <Text>{formatCount(repo.distros.length, i18n.language)}</Text>
        </div>
      </section>

      {repo.configUrl && (
        <section className={styles.section}>
          <Title order={2}>{t('repos.fields.configUrl')}</Title>
          <Anchor href={repo.configUrl} rel='noreferrer' target='_blank'>
            {repo.configUrl}
          </Anchor>
        </section>
      )}
      {setup(t('repos.fields.configContent'), repo.configContent)}
      {setup(t('repos.fields.installScript'), repo.installScript)}

      <Tabs
        className={styles.listings}
        keepMounted
        keepMountedMode='display-none'
        value={activeTab}
        onChange={(value) => setActiveTab(value as RepoTab)}
      >
        <Tabs.List>
          <Tabs.Tab
            rightSection={<CountBadge count={pkgCount ?? undefined} loading={pkgCount === null} />}
            value='packages'
          >
            {t('common.packages')}
          </Tabs.Tab>
          <Tabs.Tab
            rightSection={<CountBadge count={repo.distros.length} loading={false} />}
            value='distros'
          >
            {t('common.distributions')}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel pt='lg' value='packages'>
          <PkgList
            emptyMessage={t('repos.detail.noPackages')}
            load={readPkgs}
            onCountChange={setPkgCount}
            showFilters={false}
          />
        </Tabs.Panel>

        <Tabs.Panel pt='lg' value='distros'>
          {repo.distros.length === 0 ? (
            <Text c='dimmed'>{t('repos.detail.noDistros')}</Text>
          ) : (
            // Every architecture of a release is an entry of its own, and the repository serves all
            // of them
            <Stack gap={4}>
              {repo.distros.map((distro) => (
                <Anchor
                  className={styles.namedLink}
                  component={Link}
                  href={`/distros/${distro.id}`}
                  key={distro.id}
                >
                  <DistroRelease distro={distro} />
                </Anchor>
              ))}
            </Stack>
          )}
        </Tabs.Panel>
      </Tabs>
    </main>
  )
}
