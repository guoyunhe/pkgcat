import type { Data } from '@generated/data'
import { Alert, Button, Group, Loader, Pagination, Text, Title } from '@mantine/core'
import { SquaresFourIcon } from '@phosphor-icons/react/SquaresFour'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'wouter'

import { getUserFavorites } from '../services/users'
import type { Paginated } from '../types/pagination'
import AppListItem from './AppListItem'
import FavoriteButton from './FavoriteButton'

import styles from './FavoriteList.module.css'

type FavoriteListProps = {
  /** User whose favorites are listed. */
  userId: number
  /**
   * Whether the favorites are the reader's own, which the empty list tells apart — the reader is
   * offered the catalog to browse, the favorites of another user are just empty.
   */
  isOwn: boolean
}

/**
 * Favorites of one user: the applications marked, shown as the rows the catalog listings use and
 * read one page at a time. The page of the listing is held here instead of in the address, because
 * nothing links to a page of it — a favorite is taken back on the listing itself, which then reads
 * the page it shows again.
 */
export default function FavoriteList({ userId, isOwn }: FavoriteListProps) {
  const { t, i18n } = useTranslation()
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<Paginated<Data.App> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  /** Bumped when a favorite is taken back, which reads the listing again. */
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    let active = true

    setLoading(true)
    setError(null)
    getUserFavorites(userId, page, i18n.language)
      .then((favorites) => {
        if (!active) return
        // Taking back the favorites of the last page leaves it empty, and the listing goes back to
        // the page that still holds one rather than showing an empty one
        if (favorites.data.length === 0 && page > 1) {
          setPage(favorites.meta.lastPage || 1)
          return
        }
        setResult(favorites)
      })
      .catch((reason) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : t('common.loadAppsError'))
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [i18n.language, page, refresh, t, userId])

  return (
    <section className={styles.favorites}>
      <Group justify='space-between'>
        <Title order={2}>{t('profile.favoritesTitle')}</Title>
        {result && <Text c='dimmed'>{result.meta.total}</Text>}
      </Group>

      {error ? (
        <Alert color='red'>{error}</Alert>
      ) : loading ? (
        <div className={styles.loading}>
          <Loader color='orange' />
        </div>
      ) : result && result.data.length > 0 ? (
        <>
          <div className={styles.grid}>
            {result.data.map((app) => (
              <AppListItem
                actions={
                  <FavoriteButton
                    appId={app.id}
                    favorite={app.isFavorite}
                    // The listing the reader is looking at may lose the application it just had
                    onChange={isOwn ? () => setRefresh((value) => value + 1) : undefined}
                  />
                }
                app={app}
                key={app.id}
              />
            ))}
          </div>
          {result.meta.lastPage > 1 && (
            <Pagination
              className={styles.pagination}
              onChange={setPage}
              total={result.meta.lastPage}
              value={result.meta.currentPage}
            />
          )}
        </>
      ) : (
        <div className={styles.empty}>
          <Text c='dimmed'>{isOwn ? t('profile.noFavorites') : t('profile.noFavoritesOther')}</Text>
          {isOwn && (
            <Button
              component={Link}
              href='/apps'
              leftSection={<SquaresFourIcon size={18} />}
              mt='md'
            >
              {t('profile.browseApps')}
            </Button>
          )}
        </div>
      )}
    </section>
  )
}
