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
import ListFilter from '../components/ListFilter'
import { appSort, appSorts, getApps, type AppSort } from '../services/apps'
import type { Paginated } from '../types/pagination'
import { appTypes } from '../utils/appTypes'

import styles from './AppsPage.module.css'

/** Types the listing can be narrowed to, which are the component types AppStream names. */
const typeOptions = appTypes.map((type) => ({ value: type, label: type }))

export default function AppsPage() {
  const { t, i18n } = useTranslation()
  const { ready, user } = useAuth()
  const isAdmin = ready && user?.role === 'admin'
  const [, navigate] = useLocation()
  const [searchParams] = useSearchParams()
  const [result, setResult] = useState<Paginated<Data.App> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const query = searchParams.get('q') ?? ''
  const category = searchParams.get('category')
  const type = searchParams.get('type')
  const sort = appSort(searchParams.get('sort'))
  const page = Number(searchParams.get('page') ?? 1) || 1
  const filtered = Boolean(query || category || type)

  /**
   * The listing is driven by the URL, so query, category, type, sort order and page stay shareable
   * and reloadable.
   */
  function appsUrl(
    options: { category?: string | null; page?: number; sort?: AppSort; type?: string | null } = {},
  ) {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    const nextCategory = options.category === undefined ? category : options.category
    if (nextCategory) params.set('category', nextCategory)
    const nextType = options.type === undefined ? type : options.type
    if (nextType) params.set('type', nextType)
    const nextSort = options.sort ?? sort
    if (nextSort !== 'newest') params.set('sort', nextSort)
    if (options.page && options.page > 1) params.set('page', String(options.page))
    return `/apps${params.toString() ? `?${params}` : ''}`
  }

  async function loadApps() {
    try {
      setLoading(true)
      setResult(await getApps(query, page, 12, category, type, sort, i18n.language))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('common.loadAppsError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadApps()
  }, [category, i18n.language, page, query, sort, type])

  // `name` is the shared label of every name field, the other three are orders of this listing
  const sortLabels: Record<AppSort, string> = {
    favorites: t('apps.sort.favorites'),
    name: t('common.name'),
    newest: t('apps.sort.newest'),
    rating: t('apps.sort.rating'),
  }
  const sortOptions = appSorts.map((value) => ({ value, label: sortLabels[value] }))

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Text className={styles.eyebrow}>{t('common.linuxCatalog')}</Text>
          <Title order={1}>{t('common.apps')}</Title>
          <Text c='dimmed'>{t('apps.subtitle')}</Text>
        </div>
        {isAdmin && (
          <Button
            component={Link}
            href='/apps/new'
            leftSection={<PlusIcon size={18} weight='bold' />}
          >
            {t('common.addApp')}
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
        <ListFilter
          data={typeOptions}
          label={t('common.type')}
          onChange={(nextType) => navigate(appsUrl({ type: nextType }))}
          placeholder={t('apps.filterAny')}
          value={type}
        />
        <Select
          allowDeselect={false}
          data={sortOptions}
          label={t('common.sortBy')}
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
            <Text c='dimmed'>{filtered ? t('apps.filterEmpty') : t('common.appsNotFound')}</Text>
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
