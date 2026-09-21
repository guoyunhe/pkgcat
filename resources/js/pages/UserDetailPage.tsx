import type { Data } from '@generated/data'
import { Alert, Container, Loader, Text, Title } from '@mantine/core'
import { useModals } from '@mantine/modals'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'wouter'

import { useAuth } from '../auth'
import DistroRelease from '../components/DistroRelease'
import FavoriteList from '../components/FavoriteList'
import ReviewList from '../components/ReviewList'
import UserAvatar from '../components/UserAvatar'
import { deleteReview, getUserReviews, type ReviewFilters } from '../services/reviews'
import { getUser } from '../services/users'

import styles from './UserDetailPage.module.css'

export default function UserDetailPage() {
  const { t, i18n } = useTranslation()
  const { ready, user } = useAuth()
  const modals = useModals()
  const { id } = useParams()
  const userId = Number(id)

  const [profile, setProfile] = useState<Data.User | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reviewsRefresh, setReviewsRefresh] = useState(0)
  const [reviewsError, setReviewsError] = useState<string | null>(null)
  const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null)

  const isOwn = ready && !!user && user.id === userId
  // The reviews the user wrote, narrowed by the language the list is set to
  const readReviews = useCallback(
    (page: number, filters: ReviewFilters) =>
      Number.isInteger(userId) && userId > 0
        ? getUserReviews(userId, page, filters, i18n.language)
        : Promise.resolve(null),
    [i18n.language, userId],
  )

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
  }, [i18n.language, userId])

  function handleDeleteReview(review: Data.Review) {
    const appId = review.app?.id
    if (!appId) return
    modals.openConfirmModal({
      centered: true,
      children: <Text>{t('reviews.deleteConfirm')}</Text>,
      confirmProps: { color: 'red' },
      labels: { cancel: t('common.cancel'), confirm: t('common.delete') },
      onConfirm: async () => {
        setReviewsError(null)
        setDeletingReviewId(review.id)
        try {
          await deleteReview(appId, review.id)
          setReviewsRefresh((value) => value + 1)
        } catch (reason) {
          setReviewsError(reason instanceof Error ? reason.message : t('reviews.deleteError'))
        } finally {
          setDeletingReviewId(null)
        }
      },
      title: t('common.confirm'),
    })
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
      <Container component='main' size='md' py='xl'>
        <Alert color='red'>{t('profile.notFound')}</Alert>
      </Container>
    )
  }

  if (error || !profile) {
    return (
      <Container component='main' size='md' py='xl'>
        <Alert color='red'>{error ?? t('profile.loadError')}</Alert>
      </Container>
    )
  }

  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(
        i18n.language.startsWith('zh') ? i18n.language : 'en-US',
        { year: 'numeric', month: 'long', day: 'numeric' },
      )
    : null

  return (
    <Container component='main' size='md' py='xl'>
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
              <DistroRelease distro={profile.distro} showArch />
            </Text>
          )}
        </div>
      </header>

      <FavoriteList isOwn={isOwn} userId={userId} />

      <section className={styles.reviews}>
        <Title order={2}>{t('reviews.title')}</Title>
        {reviewsError && <Alert color='red'>{reviewsError}</Alert>}
        <ReviewList
          currentUserId={user?.id}
          deletingId={deletingReviewId}
          language={i18n.language}
          load={readReviews}
          onDelete={isOwn ? handleDeleteReview : undefined}
          refreshKey={reviewsRefresh}
          variant='user'
        />
      </section>
    </Container>
  )
}
