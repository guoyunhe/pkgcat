import type { Data } from '@generated/data'
import { Alert, Button, Group, Loader, Pagination, Tabs, Text, Title } from '@mantine/core'
import { ArrowLeftIcon } from '@phosphor-icons/react/ArrowLeft'
import { PencilSimpleIcon } from '@phosphor-icons/react/PencilSimple'
import { TrashIcon } from '@phosphor-icons/react/Trash'
import { useEffect, useState } from 'react'
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
import type { Paginated } from '../types/pagination'
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
  const [repos, setRepos] = useState<Data.Repo[]>([])
  const [reposLoading, setReposLoading] = useState(true)
  const [pkgs, setPkgs] = useState<Paginated<Data.Pkg> | null>(null)
  const [pkgsPage, setPkgsPage] = useState(1)
  const [pkgsLoading, setPkgsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reposError, setReposError] = useState<string | null>(null)
  const [pkgsError, setPkgsError] = useState<string | null>(null)

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

  useEffect(() => {
    if (!distroId) return

    setReposLoading(true)
    setReposError(null)
    getRepos('name', distroId)
      .then(setRepos)
      .catch((reason) =>
        setReposError(reason instanceof Error ? reason.message : t('repos.loadError')),
      )
      .finally(() => setReposLoading(false))
  }, [distroId])

  useEffect(() => {
    if (!distroId) return

    setPkgsLoading(true)
    setPkgsError(null)
    getDistroPackages(distroId, pkgsPage, i18n.language)
      .then(setPkgs)
      .catch((reason) =>
        setPkgsError(reason instanceof Error ? reason.message : t('common.loadPackagesError')),
      )
      .finally(() => setPkgsLoading(false))
  }, [distroId, i18n.language, pkgsPage, t])

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
        value={activeTab}
        onChange={(value) => setActiveTab(value as DistroTab)}
      >
        <Tabs.List>
          <Tabs.Tab
            rightSection={<CountBadge count={pkgs?.meta.total} loading={pkgsLoading} />}
            value='packages'
          >
            {t('common.packages')}
          </Tabs.Tab>
          <Tabs.Tab
            rightSection={<CountBadge count={repos.length} loading={reposLoading} />}
            value='repositories'
          >
            {t('common.repositories')}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel pt='lg' value='packages'>
          {pkgsError && <Alert color='red'>{pkgsError}</Alert>}
          {pkgsLoading ? (
            <div className={styles.loading}>
              <Loader color='orange' size='sm' />
            </div>
          ) : pkgs && pkgs.data.length > 0 ? (
            <>
              <PkgList pkgs={pkgs.data} showDetails />
              {pkgs.meta.lastPage > 1 && (
                <Pagination
                  className={styles.pagination}
                  total={pkgs.meta.lastPage}
                  value={pkgs.meta.currentPage}
                  onChange={setPkgsPage}
                />
              )}
            </>
          ) : (
            <Text c='dimmed'>{t('distros.detail.noPackages')}</Text>
          )}
        </Tabs.Panel>

        <Tabs.Panel pt='lg' value='repositories'>
          {reposError && <Alert color='red'>{reposError}</Alert>}
          {reposLoading ? (
            <div className={styles.loading}>
              <Loader color='orange' size='sm' />
            </div>
          ) : repos.length === 0 ? (
            <Text c='dimmed'>{t('distros.detail.noRepos')}</Text>
          ) : (
            <RepoTable
              onRowClick={isAdmin ? (repo) => navigate(`/repos/${repo.id}/edit`) : undefined}
              repos={repos}
              showDistros={false}
            />
          )}
        </Tabs.Panel>
      </Tabs>
    </main>
  )
}
