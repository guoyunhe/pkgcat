import type { Data } from '@generated/data'
import {
  Alert,
  Anchor,
  Button,
  Container,
  DataList,
  Group,
  Loader,
  Stack,
  Tabs,
  Text,
  Title,
} from '@mantine/core'
import { useModals } from '@mantine/modals'
import { ArrowLeftIcon } from '@phosphor-icons/react/ArrowLeft'
import { PencilSimpleIcon } from '@phosphor-icons/react/PencilSimple'
import { TrashIcon } from '@phosphor-icons/react/Trash'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useParams } from 'wouter'

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
  const modals = useModals()
  const [, navigate] = useLocation()
  const { id } = useParams()
  const repoId = Number(id)
  const [repo, setRepo] = useState<Data.Repo | null>(null)
  const [activeTab, setActiveTab] = useState<RepoTab>('packages')
  const [error, setError] = useState<string | null>(null)

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
      <Container component='main' py={{ base: 32, xs: 56 }} size='md'>
        <Alert color='red'>{error}</Alert>
      </Container>
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

  function remove() {
    if (!repo) return
    modals.openConfirmModal({
      centered: true,
      children: <Text>{t('repos.confirmDelete', { name: repo.name })}</Text>,
      confirmProps: { color: 'red' },
      labels: { cancel: t('common.cancel'), confirm: t('common.delete') },
      onConfirm: async () => {
        try {
          await deleteRepo(repo.id)
          navigate('/repos')
        } catch (reason) {
          setError(reason instanceof Error ? reason.message : t('repos.deleteError'))
        }
      },
      title: t('common.confirm'),
    })
  }

  return (
    <Container component='main' py={{ base: 32, xs: 56 }} size='md'>
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
              {t('common.edit')}
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

      <DataList className={styles.metadata} gap='md'>
        <DataList.Item>
          <DataList.ItemLabel>{t('common.packageFormat')}</DataList.ItemLabel>
          <DataList.ItemValue className={styles.status}>{repo.type}</DataList.ItemValue>
        </DataList.Item>
        <DataList.Item>
          <DataList.ItemLabel>{t('common.source')}</DataList.ItemLabel>
          {/* A source the interface does not know is still named by the value it was stored as */}
          <DataList.ItemValue>
            {t(`repos.sources.${repo.source}`, { defaultValue: repo.source })}
          </DataList.ItemValue>
        </DataList.Item>
        <DataList.Item>
          <DataList.ItemLabel>{t('repos.columns.syncInterval')}</DataList.ItemLabel>
          <DataList.ItemValue>
            {repo.syncIntervalDays
              ? t('repos.everyDays', { count: repo.syncIntervalDays })
              : t('repos.manual')}
          </DataList.ItemValue>
        </DataList.Item>
        <DataList.Item>
          <DataList.ItemLabel>{t('repos.columns.lastSynced')}</DataList.ItemLabel>
          <DataList.ItemValue>
            {repo.lastSyncedAt
              ? new Intl.DateTimeFormat(i18n.language, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(repo.lastSyncedAt))
              : t('repos.neverSynced')}
          </DataList.ItemValue>
        </DataList.Item>
        <DataList.Item>
          <DataList.ItemLabel>{t('common.packages')}</DataList.ItemLabel>
          <DataList.ItemValue>{formatCount(repo.pkgCount, i18n.language)}</DataList.ItemValue>
        </DataList.Item>
        <DataList.Item>
          <DataList.ItemLabel>{t('common.apps')}</DataList.ItemLabel>
          <DataList.ItemValue>{formatCount(repo.appCount, i18n.language)}</DataList.ItemValue>
        </DataList.Item>
        <DataList.Item>
          <DataList.ItemLabel>{t('common.distributions')}</DataList.ItemLabel>
          <DataList.ItemValue>{formatCount(repo.distros.length, i18n.language)}</DataList.ItemValue>
        </DataList.Item>
      </DataList>

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
            rightSection={<CountBadge count={repo.pkgCount} loading={false} />}
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
    </Container>
  )
}
