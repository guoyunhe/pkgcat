import type { Data } from '@generated/data'
import { Alert, Button, Loader, Pagination, Text, Title } from '@mantine/core'
import { PencilSimpleIcon } from '@phosphor-icons/react/PencilSimple'
import { PlusIcon } from '@phosphor-icons/react/Plus'
import { TrashIcon } from '@phosphor-icons/react/Trash'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'wouter'

import { useAuth } from '../auth'
import PkgFilters, { useStoredPkgFilters } from '../components/PkgFilters'
import PkgList from '../components/PkgList'
import { searchPackages } from '../services/apps'
import { deletePkg } from '../services/pkgs'
import type { Paginated } from '../types/pagination'

import styles from './AppsPage.module.css'

export default function PkgsPage() {
  const { t, i18n } = useTranslation()
  const { ready, user } = useAuth()
  const isAdmin = ready && user?.role === 'admin'
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useStoredPkgFilters()
  const [result, setResult] = useState<Paginated<Data.Pkg> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    setPage(1)
  }, [filters])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    searchPackages('', page, filters, i18n.language)
      .then((res) => {
        if (active) setResult(res)
      })
      .catch((reason) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : t('common.loadPackagesError'))
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [filters, i18n.language, page, t, refresh])

  async function remove(pkg: Data.Pkg) {
    if (!window.confirm(t('packages.deleteConfirm', { name: pkg.name }))) return
    try {
      await deletePkg(pkg.id)
      setRefresh((value) => value + 1)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('packages.deleteError'))
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Text className={styles.eyebrow}>{t('common.linuxCatalog')}</Text>
          <Title order={1}>{t('common.packages')}</Title>
          <Text c='dimmed'>{t('packages.subtitle')}</Text>
        </div>
        {isAdmin && (
          <Button
            component={Link}
            href='/pkgs/new'
            leftSection={<PlusIcon size={18} weight='bold' />}
          >
            {t('common.addPackage')}
          </Button>
        )}
      </header>

      <PkgFilters onChange={setFilters} value={filters} />

      {error && (
        <Alert color='red' mb='lg'>
          {error}
        </Alert>
      )}
      {loading ? (
        <div className={styles.loading}>
          <Loader color='orange' />
        </div>
      ) : result && result.data.length > 0 ? (
        <>
          <PkgList
            pkgs={result.data}
            renderActions={
              isAdmin
                ? (pkg) => (
                    <>
                      <Button
                        aria-label={t('packages.editPackage')}
                        component={Link}
                        href={`/pkgs/${pkg.id}/edit`}
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
                        onClick={() => void remove(pkg)}
                      >
                        <TrashIcon size={16} />
                      </Button>
                    </>
                  )
                : undefined
            }
          />
          {result.meta.lastPage > 1 && (
            <Pagination
              className={styles.pagination}
              total={result.meta.lastPage}
              value={result.meta.currentPage}
              onChange={setPage}
            />
          )}
        </>
      ) : (
        <Text c='dimmed'>{t('common.packagesNotFound')}</Text>
      )}
    </main>
  )
}
