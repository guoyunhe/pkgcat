import { Button, Select, Text, Title } from '@mantine/core'
import { PlusIcon } from '@phosphor-icons/react/Plus'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useSearchParams } from 'wouter'

import { useAuth } from '../auth'
import AppList from '../components/AppList'
import FavoriteButton from '../components/FavoriteButton'
import ListFilter from '../components/ListFilter'
import { appSort, appSorts, getApps, type AppSort } from '../services/apps'
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
  const query = searchParams.get('q') ?? ''
  const category = searchParams.get('category')
  const type = searchParams.get('type')
  const sort = appSort(searchParams.get('sort'))
  const filtered = Boolean(query || category || type)

  /**
   * The listing is driven by the URL, so query, category, type and sort order stay shareable and
   * reloadable. The page of the listing is the one the list itself is on.
   */
  function appsUrl(
    options: { category?: string | null; sort?: AppSort; type?: string | null } = {},
  ) {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    const nextCategory = options.category === undefined ? category : options.category
    if (nextCategory) params.set('category', nextCategory)
    const nextType = options.type === undefined ? type : options.type
    if (nextType) params.set('type', nextType)
    const nextSort = options.sort ?? sort
    if (nextSort !== 'newest') params.set('sort', nextSort)
    return `/apps${params.toString() ? `?${params}` : ''}`
  }

  // The listing the URL names, which the list reads one page of at a time
  const readApps = useCallback(
    (page: number, category: string | null) =>
      getApps(query, page, 12, category, type, sort, i18n.language),
    [i18n.language, query, sort, type],
  )

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

      <AppList
        category={category}
        emptyMessage={filtered ? t('apps.filterEmpty') : t('common.appsNotFound')}
        extraFilters={
          // The type and the order are read by the API too, so they are kept in the URL as well
          <>
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
          </>
        }
        load={readApps}
        onCategoryChange={(nextCategory) => navigate(appsUrl({ category: nextCategory }))}
        renderActions={(app) => <FavoriteButton appId={app.id} favorite={app.isFavorite} />}
      />
    </main>
  )
}
