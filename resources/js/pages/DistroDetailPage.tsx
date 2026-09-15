import type { Data } from '@generated/data'
import { Alert, Button, Group, Loader, Tabs, Text, Title } from '@mantine/core'
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
import RepoTable from '../components/RepoTable'
import {
  deleteDistro,
  distroLabel,
  getDistro,
  getDistroPackages,
  type Distro,
} from '../services/distros'
import { getRepos } from '../services/repos'
import { formatCount, formatDate } from '../utils/format'

import styles from './DistroDetailPage.module.css'

/** Sections of the page, which the tabs switch between. */
type DistroTab = 'packages' | 'repositories'

export default function DistroDetailPage() {
  const { t, i18n } = useTranslation()
  const { ready, user } = useAuth()
  const [, navigate] = useLocation()
  const [, params] = useRoute('/distros/:id')
  const distroId = params?.id ? Number(params.id) : undefined
  const [distro, setDistro] = useState<Distro | null>(null)
  const [activeTab, setActiveTab] = useState<DistroTab>('packages')
  // What the two listings hold, which they say themselves and the tabs show
  const [pkgCount, setPkgCount] = useState<number | null>(null)
  const [repoCount, setRepoCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  // A route without a release reads nothing; the page shows the invalid id instead of the listings
  const loadRepos = useCallback(
    () => (distroId ? getRepos('name', distroId) : Promise.resolve<Data.Repo[]>([])),
    [distroId],
  )
  // The packages the release serves, which its repositories hold for its architecture
  const readPkgs = useCallback(
    (page: number) =>
      distroId ? getDistroPackages(distroId, page, i18n.language) : Promise.resolve(null),
    [distroId, i18n.language],
  )

  useEffect(() => {
    if (!distroId) {
      setError(t('distros.detail.invalidId'))
      return
    }
    getDistro(distroId)
      .then(setDistro)
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : t('distros.detail.loadError')),
      )
  }, [distroId])

  if (error) {
    return (
      <main className={styles.page}>
        <Alert color='red'>{error}</Alert>
      </main>
    )
  }
  if (!distro || !ready) {
    return (
      <div className={styles.loading}>
        <Loader color='orange' />
      </div>
    )
  }

  const isAdmin = user?.role === 'admin'
  // A rolling release has no version number, so it is named by its distribution alone
  const name = distro.version ? `${distro.name} ${distro.version}` : distro.name
  const isExpired = distro.eolDate ? new Date(distro.eolDate).getTime() < Date.now() : false

  async function remove() {
    if (!distro) return
    if (!window.confirm(t('distros.confirmDelete', { name: distroLabel(distro) }))) return
    try {
      await deleteDistro(distro.id)
      navigate('/distros')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('distros.deleteError'))
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Button
          component={Link}
          href='/distros'
          leftSection={<ArrowLeftIcon size={18} />}
          variant='subtle'
        >
          {t('distros.detail.back')}
        </Button>
        {isAdmin && (
          <Group gap='xs'>
            <Button
              component={Link}
              href={`/distros/${distro.id}/edit`}
              leftSection={<PencilSimpleIcon size={18} />}
              variant='default'
            >
              {t('distros.editDistro')}
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
        <img
          alt=''
          className={styles.icon}
          src={`/distros/${encodeURIComponent(distro.name)}.svg`}
        />
        <div>
          <Text className={styles.eyebrow}>{t('distros.detail.eyebrow')}</Text>
          <Title order={1}>{name}</Title>
        </div>
      </section>

      <section className={styles.metadata}>
        <div>
          <Text size='sm' c='dimmed'>
            {t('common.version')}
          </Text>
          <Text>{distro.version ?? t('common.notSpecified')}</Text>
        </div>
        <div>
          <Text size='sm' c='dimmed'>
            {t('common.packageFormat')}
          </Text>
          <Text className={styles.status}>{distro.pkgType ?? t('common.notSpecified')}</Text>
        </div>
        <div>
          <Text size='sm' c='dimmed'>
            {t('common.architecture')}
          </Text>
          <Text>{distro.arch}</Text>
        </div>
        <div>
          <Text size='sm' c='dimmed'>
            {t('distros.columns.releaseDate')}
          </Text>
          <Text>{distro.releaseDate ? formatDate(distro.releaseDate, i18n.language) : '—'}</Text>
        </div>
        <div>
          <Text size='sm' c='dimmed'>
            {t('distros.columns.eolDate')}
          </Text>
          <Text className={isExpired ? styles.expired : undefined}>
            {distro.eolDate ? formatDate(distro.eolDate, i18n.language) : '—'}
          </Text>
        </div>
        <div>
          <Text size='sm' c='dimmed'>
            {t('distros.columns.compatible')}
          </Text>
          {distro.compatibleDistro ? (
            <DistroRelease arch={distro.arch} distro={distro.compatibleDistro} />
          ) : (
            <Text>—</Text>
          )}
        </div>
        <div>
          <Text size='sm' c='dimmed'>
            {t('common.packages')}
          </Text>
          <Text>{formatCount(distro.pkgCount, i18n.language)}</Text>
        </div>
        <div>
          <Text size='sm' c='dimmed'>
            {t('common.apps')}
          </Text>
          <Text>{formatCount(distro.appCount, i18n.language)}</Text>
        </div>
      </section>

      <Tabs
        className={styles.listings}
        keepMounted
        keepMountedMode='display-none'
        value={activeTab}
        onChange={(value) => setActiveTab(value as DistroTab)}
      >
        <Tabs.List>
          <Tabs.Tab
            rightSection={<CountBadge count={pkgCount ?? undefined} loading={pkgCount === null} />}
            value='packages'
          >
            {t('common.packages')}
          </Tabs.Tab>
          <Tabs.Tab
            rightSection={
              <CountBadge count={repoCount ?? undefined} loading={repoCount === null} />
            }
            value='repositories'
          >
            {t('common.repositories')}
          </Tabs.Tab>
        </Tabs.List>

        {/* Both listings are read on their own, and the count of each of them is what the tabs show */}
        <Tabs.Panel pt='lg' value='packages'>
          <PkgList
            emptyMessage={t('distros.detail.noPackages')}
            load={readPkgs}
            onCountChange={setPkgCount}
            showDetails
            showFilters={false}
          />
        </Tabs.Panel>

        <Tabs.Panel pt='lg' value='repositories'>
          <RepoTable
            emptyMessage={t('distros.detail.noRepos')}
            load={loadRepos}
            onCountChange={setRepoCount}
            onRowClick={isAdmin ? (repo) => navigate(`/repos/${repo.id}/edit`) : undefined}
            showDistros={false}
          />
        </Tabs.Panel>
      </Tabs>
    </main>
  )
}
