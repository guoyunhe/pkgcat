import type { Data } from '@generated/data'
import { Alert, Button, Group, Loader, Pagination, Text, Title } from '@mantine/core'
import { ArrowRightIcon } from '@phosphor-icons/react/ArrowRight'
import { SquaresFourIcon } from '@phosphor-icons/react/SquaresFour'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useRoute, useSearchParams } from 'wouter'

import { useAuth } from '../auth'
import DistroRelease from '../components/DistroRelease'
import FavoriteButton from '../components/FavoriteButton'
import ReviewList from '../components/ReviewList'
import UserAvatar from '../components/UserAvatar'
import { deleteReview, getUserReviews } from '../services/reviews'
import { getUser, getUserFavorites } from '../services/users'
import type { Paginated } from '../types/pagination'
import { localized } from '../utils/appstream'

import styles from './UserDetailPage.module.css'

export default function UserDetailPage() {
  const { t, i18n } = useTranslation()
  const { ready, user } = useAuth()
  const [, navigate] = useLocation()
  const [searchParams] = useSearchParams()
  const [, routeParams] = useRoute('/users/:id')
  const userId = routeParams?.id ? Number(routeParams.id) : NaN
  const page = Number(searchParams.get('page') ?? 1) || 1

  const [profile, setProfile] = useState<Data.User | null>(null)
  const [result, setResult] = useState<Paginated<Data.App> | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reviews, setReviews] = useState<Paginated<Data.Review> | null>(null)
  const [reviewsPage, setReviewsPage] = useState(1)
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [reviewsError, setReviewsError] = useState<string | null>(null)
  const [reviewsRefresh, setReviewsRefresh] = useState(0)
  const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null)

  const isOwn = ready && !!user && user.id === userId

  async function loadPage() {
    if (!Number.isInteger(userId) || userId <= 0) {
      setNotFound(true)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setNotFound(false)
      setError(null)
      const foundUser = await getUser(userId)
      setProfile(foundUser)

      const favorites = await getUserFavorites(userId, page, i18n.language)
      if (favorites.data.length === 0 && page > 1) {
        navigate(`/users/${userId}?page=${favorites.meta.lastPage || 1}`, { replace: true })
        return
      }
      setResult(favorites)
    } catch (reason) {
      const status =
        reason && typeof reason === 'object' && 'response' in reason
          ? (reason as { response?: { status?: number } }).response?.status
          : undefined
      if (status === 404) {
        setNotFound(true)
      } else {
        setError(reason instanceof Error ? reason.message : t('profile.loadError'))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPage()
  }, [i18n.language, userId, page])

  useEffect(() => {
    if (!Number.isInteger(userId) || userId <= 0) return

    setReviewsLoading(true)
    setReviewsError(null)
    getUserReviews(userId, reviewsPage, i18n.language)
      .then(setReviews)
      .catch((reason) =>
        setReviewsError(reason instanceof Error ? reason.message : t('reviews.loadError')),
      )
      .finally(() => setReviewsLoading(false))
  }, [i18n.language, userId, reviewsPage, reviewsRefresh])

  async function handleDeleteReview(review: Data.Review) {
    if (!review.app || !window.confirm(t('reviews.deleteConfirm'))) return
    setDeletingReviewId(review.id)
    try {
      await deleteReview(review.app.id, review.id)
      setReviewsRefresh((value) => value + 1)
    } catch (reason) {
      setReviewsError(reason instanceof Error ? reason.message : t('reviews.deleteError'))
    } finally {
      setDeletingReviewId(null)
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <Loader color='orange' />
      </div>
    )
  }

  if (notFound) {
    return (
      <main className={styles.page}>
        <Alert color='red'>{t('profile.notFound')}</Alert>
      </main>
    )
  }

  if (error || !profile) {
    return (
      <main className={styles.page}>
        <Alert color='red'>{error ?? t('profile.loadError')}</Alert>
      </main>
    )
  }

  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(
        i18n.language.startsWith('zh') ? i18n.language : 'en-US',
        { year: 'numeric', month: 'long', day: 'numeric' },
      )
    : null

  return (
    <main className={styles.page}>
      <header className={styles.profileHeader}>
        <UserAvatar size={88} user={profile} />
        <div>
          <Text className={styles.eyebrow}>
            {isOwn ? t('profile.eyebrowOwn') : t('profile.eyebrow')}
          </Text>
          <Title order={1}>{profile.name}</Title>
          {memberSince && (
            <Text c='dimmed' size='sm'>
              {t('memberSince')} {memberSince}
            </Text>
          )}
          {profile.distro && (
            <Text c='dimmed' size='sm'>
              {t('common.distribution')} <DistroRelease distro={profile.distro} showArch />
            </Text>
          )}
        </div>
      </header>

      <section className={styles.favorites}>
        <Group justify='space-between'>
          <Title order={2}>{t('profile.favoritesTitle')}</Title>
          {result && <Text c='dimmed'>{result.meta.total}</Text>}
        </Group>

        {loading ? (
          <div className={styles.loading}>
            <Loader color='orange' />
          </div>
        ) : result && result.data.length > 0 ? (
          <>
            <section className={styles.grid}>
              {result.data.map((app) => (
                <article className={styles.item} key={app.id}>
                  {app.icon ? (
                    <img alt='' className={styles.icon} src={app.icon.url} />
                  ) : (
                    <div className={`${styles.icon} ${styles.emptyIcon}`} />
                  )}
                  <div className={styles.copy}>
                    <Title order={3}>
                      <Link className={styles.link} href={`/apps/${app.id}`}>
                        {localized(app.name, i18n.language)}{' '}
                        <ArrowRightIcon size={18} weight='bold' />
                      </Link>
                    </Title>
                    <Text c='dimmed'>{localized(app.summary, i18n.language)}</Text>
                    <div className={styles.metadata}>
                      {app.version && <span>{app.version}</span>}
                      {app.license && <span>{app.license}</span>}
                    </div>
                  </div>
                  <div className={styles.favorite}>
                    <FavoriteButton
                      appId={app.id}
                      favorite={app.isFavorite}
                      onChange={isOwn ? () => void loadPage() : undefined}
                    />
                  </div>
                </article>
              ))}
            </section>
            {result.meta.lastPage > 1 && (
              <Pagination
                className={styles.pagination}
                total={result.meta.lastPage}
                value={result.meta.currentPage}
                onChange={(nextPage) => {
                  navigate(nextPage > 1 ? `/users/${userId}?page=${nextPage}` : `/users/${userId}`)
                }}
              />
            )}
          </>
        ) : (
          <div className={styles.empty}>
            <Text c='dimmed'>
              {isOwn ? t('profile.noFavorites') : t('profile.noFavoritesOther')}
            </Text>
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

      <section className={styles.reviews}>
        <Title order={2}>{t('reviews.title')}</Title>
        {reviewsError && <Alert color='red'>{reviewsError}</Alert>}
        {reviewsLoading ? (
          <div className={styles.loading}>
            <Loader color='orange' />
          </div>
        ) : reviews ? (
          <ReviewList
            currentUserId={user?.id}
            deletingId={deletingReviewId}
            language={i18n.language}
            onDelete={isOwn ? handleDeleteReview : undefined}
            onPageChange={setReviewsPage}
            page={reviewsPage}
            reviews={reviews}
            variant='user'
          />
        ) : null}
      </section>
    </main>
  )
}
