import { Button, Text, Title } from '@mantine/core'
import { PlusIcon } from '@phosphor-icons/react/Plus'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useSearchParams } from 'wouter'

import { useAuth } from '../auth'
import AppList, { type AppFilters } from '../components/AppList'
import FavoriteButton from '../components/FavoriteButton'
import { getApps } from '../services/apps'

import styles from './AppsPage.module.css'

export default function AppsPage() {
  const { t, i18n } = useTranslation()
  const { ready, user } = useAuth()
  const isAdmin = ready && user?.role === 'admin'
  const [, navigate] = useLocation()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const category = searchParams.get('category')

  /**
   * The listing is driven by the URL, so the query, the category and what the list keeps in it —
   * the type and the order — stay shareable and reloadable. A control of this page replaces the one
   * parameter it owns and leaves the rest. The page of the listing is the one the list itself is
   * on.
   */
  function appsUrl(nextCategory: string | null) {
    const params = new URLSearchParams(searchParams)
    if (nextCategory) params.set('category', nextCategory)
    else params.delete('category')
    return `/apps${params.toString() ? `?${params}` : ''}`
  }

  // The listing the URL names, which the list reads one page of at a time
  const readApps = useCallback(
    (page: number, filters: AppFilters) =>
      getApps(query, page, 12, filters.category, filters.type, filters.sort, i18n.language),
    [i18n.language, query],
  )

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
        emptyMessage={t('common.appsNotFound')}
        filteredEmptyMessage={t('apps.filterEmpty')}
        load={readApps}
        onCategoryChange={(nextCategory) => navigate(appsUrl(nextCategory))}
        renderActions={(app) => <FavoriteButton appId={app.id} favorite={app.isFavorite} />}
      />
    </main>
  )
}
