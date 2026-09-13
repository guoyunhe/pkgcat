import type { Data } from '@generated/data'
import { Alert, Button, Group, Loader, Pagination, Select, Text, Title } from '@mantine/core'
import { PlusIcon } from '@phosphor-icons/react/Plus'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useSearchParams } from 'wouter'

import { useAuth } from '../auth'
import AppList from '../components/AppList'
import CategoryFilter from '../components/CategoryFilter'
import FavoriteButton from '../components/FavoriteButton'
import { appSort, appSorts, getApps, type AppSort } from '../services/apps'
import type { Paginated } from '../types/pagination'

import styles from './AppsPage.module.css'

export default function AppsPage() {
  const { t } = useTranslation()
  const { ready, user } = useAuth()
  const isAdmin = ready && user?.role === 'admin'
  const [, navigate] = useLocation()
  const [searchParams] = useSearchParams()
  const [result, setResult] = useState<Paginated<Data.App> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const query = searchParams.get('q') ?? ''
  const category = searchParams.get('category')
  const sort = appSort(searchParams.get('sort'))
  const page = Number(searchParams.get('page') ?? 1) || 1

  /**
   * The listing is driven by the URL, so query, category, sort order and page stay shareable and
   * reloadable.
   */
  function appsUrl(options: { category?: string | null; page?: number; sort?: AppSort } = {}) {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    const nextCategory = options.category === undefined ? category : options.category
    if (nextCategory) params.set('category', nextCategory)
    const nextSort = options.sort ?? sort
    if (nextSort !== 'newest') params.set('sort', nextSort)
    if (options.page && options.page > 1) params.set('page', String(options.page))
    return `/apps${params.toString() ? `?${params}` : ''}`
  }

  async function loadApps() {
    try {
      setLoading(true)
      setResult(await getApps(query, page, 12, category, sort))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('apps.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadApps()
  }, [category, page, query, sort])

  const sortOptions = appSorts.map((value) => ({ value, label: t(`apps.sort.${value}`) }))

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Text className={styles.eyebrow}>{t('apps.eyebrow')}</Text>
          <Title order={1}>{t('apps.title')}</Title>
          <Text c='dimmed'>{t('apps.subtitle')}</Text>
        </div>
        {isAdmin && (
          <Button
            component={Link}
            href='/apps/new'
            leftSection={<PlusIcon size={18} weight='bold' />}
          >
            {t('header.addApplication')}
          </Button>
        )}
      </header>

      {error && (
        <Alert color='red' mb='lg'>
          {error}
        </Alert>
      )}
      <Group align='flex-end' gap='sm' mb='lg'>
        <CategoryFilter
          onChange={(nextCategory) => navigate(appsUrl({ category: nextCategory }))}
          value={category}
        />
        <Select
          allowDeselect={false}
          data={sortOptions}
          label={t('apps.sort.label')}
          onChange={(nextSort) => navigate(appsUrl({ sort: appSort(nextSort) }))}
          value={sort}
          w={180}
        />
      </Group>
      {loading ? (
        <div className={styles.loading}>
          <Loader color='orange' />
        </div>
      ) : (
        <>
          {result?.data.length === 0 ? (
            <Text c='dimmed'>{t('apps.notFound')}</Text>
          ) : (
            <>
              <AppList
                apps={result?.data ?? []}
                renderActions={(app) => <FavoriteButton appId={app.id} favorite={app.isFavorite} />}
              />
              {result && result.meta.lastPage > 1 && (
                <Pagination
                  className={styles.pagination}
                  total={result.meta.lastPage}
                  value={result.meta.currentPage}
                  onChange={(nextPage) => {
                    navigate(appsUrl({ page: nextPage }))
                  }}
                />
              )}
            </>
          )}
        </>
      )}
    </main>
  )
}
