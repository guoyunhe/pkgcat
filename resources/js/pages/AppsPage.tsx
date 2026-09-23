import { Button, Container, Group, Text, Title } from '@mantine/core'
import { PlusIcon } from '@phosphor-icons/react/Plus'
import { parseAsString, useQueryState } from 'nuqs'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'wouter'

import { useAuth } from '../auth'
import AppList, { type AppFilters } from '../components/AppList'
import AppRequestButton from '../components/AppRequestButton'
import FavoriteButton from '../components/FavoriteButton'
import { getApps } from '../services/apps'

import styles from './AppsPage.module.css'

export default function AppsPage() {
  const { t, i18n } = useTranslation()
  const { ready, user } = useAuth()
  const isAdmin = ready && user?.role === 'admin'
  // The terms the page was searched with are what its listing is read with; the filters and the page
  // of the listing are kept in the query string by the list itself
  const [query] = useQueryState('q', parseAsString)

  const readApps = useCallback(
    (page: number, filters: AppFilters) =>
      getApps(query ?? '', page, 12, filters.category, filters.type, filters.sort, i18n.language),
    [i18n.language, query],
  )

  return (
    <Container component='main' py={{ base: 44, xs: 72 }} size='lg'>
      <header className={styles.header}>
        <div>
          <Text className={styles.eyebrow}>{t('common.linuxCatalog')}</Text>
          <Title order={1}>{t('common.apps')}</Title>
          <Text c='dimmed'>{t('apps.subtitle')}</Text>
        </div>
        <Group>
          <AppRequestButton />
          {isAdmin && (
            <Button component={Link} href='/apps/new' leftSection={<PlusIcon size={18} />}>
              {t('common.add')}
            </Button>
          )}
        </Group>
      </header>

      <AppList
        emptyMessage={t('common.appsNotFound')}
        filteredEmptyMessage={t('apps.filterEmpty')}
        load={readApps}
        renderActions={(app) => <FavoriteButton appId={app.id} favorite={app.isFavorite} />}
      />
    </Container>
  )
}
