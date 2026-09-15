import type { Data } from '@generated/data'
import { Alert, Button, Group, Loader, Text, Title } from '@mantine/core'
import { ArrowLeftIcon } from '@phosphor-icons/react/ArrowLeft'
import { PencilSimpleIcon } from '@phosphor-icons/react/PencilSimple'
import { TrashIcon } from '@phosphor-icons/react/Trash'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useRoute } from 'wouter'

import { useAuth } from '../auth'
import DistroRelease from '../components/DistroRelease'
import RepoTable from '../components/RepoTable'
import { deleteDistro, distroLabel, getDistro, type Distro } from '../services/distros'
import { getRepos } from '../services/repos'
import { formatCount, formatDate } from '../utils/format'

import styles from './DistroDetailPage.module.css'

export default function DistroDetailPage() {
  const { t, i18n } = useTranslation()
  const { ready, user } = useAuth()
  const [, navigate] = useLocation()
  const [, params] = useRoute('/distros/:id')
  const distroId = params?.id ? Number(params.id) : undefined
  const [distro, setDistro] = useState<Distro | null>(null)
  const [repos, setRepos] = useState<Data.Repo[]>([])
  const [reposLoading, setReposLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reposError, setReposError] = useState<string | null>(null)

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
              {t('distros.delete')}
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
            {t('distros.columns.version')}
          </Text>
          <Text>{distro.version ?? t('common.notSpecified')}</Text>
        </div>
        <div>
          <Text size='sm' c='dimmed'>
            {t('distros.columns.pkgType')}
          </Text>
          <Text className={styles.status}>{distro.pkgType ?? t('common.notSpecified')}</Text>
        </div>
        <div>
          <Text size='sm' c='dimmed'>
            {t('distros.columns.arch')}
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
            {t('distros.columns.packages')}
          </Text>
          <Text>{formatCount(distro.pkgCount, i18n.language)}</Text>
        </div>
        <div>
          <Text size='sm' c='dimmed'>
            {t('distros.columns.apps')}
          </Text>
          <Text>{formatCount(distro.appCount, i18n.language)}</Text>
        </div>
      </section>

      <section className={styles.repos}>
        <Title order={2}>{t('distros.detail.repos')}</Title>
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
      </section>
    </main>
  )
}
