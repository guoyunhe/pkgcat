import type { Data } from '@generated/data'
import { Alert, Button, Container, DataList, Group, Loader, Text, Title } from '@mantine/core'
import { useModals } from '@mantine/modals'
import { ArrowLeftIcon } from '@phosphor-icons/react/ArrowLeft'
import { ArrowSquareOutIcon } from '@phosphor-icons/react/ArrowSquareOut'
import { PencilSimpleIcon } from '@phosphor-icons/react/PencilSimple'
import { PlusIcon } from '@phosphor-icons/react/Plus'
import { TrashIcon } from '@phosphor-icons/react/Trash'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useParams } from 'wouter'

import { useAuth } from '../auth'
import AppMergeModal from '../components/AppMergeModal'
import AverageRating from '../components/AverageRating'
import CategoryBadges from '../components/CategoryBadges'
import FavoriteButton from '../components/FavoriteButton'
import PackageUpload from '../components/PackageUpload'
import PkgList from '../components/PkgList'
import ReviewForm from '../components/ReviewForm'
import ReviewList from '../components/ReviewList'
import ScreenshotCarousel from '../components/ScreenshotCarousel'
import { deleteApp, getApp, getAppPackages } from '../services/apps'
import type { PkgFilters } from '../services/pkgs'
import { deleteReview, getAppReviews, type ReviewFilters } from '../services/reviews'
import {
  localized,
  parseAppStreamContent,
  resolveDescription,
  selectScreenshots,
} from '../utils/appstream'
import { appTypeKey } from '../utils/appTypes'
import { formatPkgNameMapping } from '../utils/pkgNames'

import styles from './AppDetailPage.module.css'

export default function AppDetailPage() {
  const { t, i18n } = useTranslation()
  const { ready, user } = useAuth()
  const modals = useModals()
  const [, navigate] = useLocation()
  const { id } = useParams()
  const appId = Number(id)
  const [app, setApp] = useState<Data.App | null>(null)
  const [packagesRefresh, setPackagesRefresh] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [reviewsRefresh, setReviewsRefresh] = useState(0)
  const [reviewsError, setReviewsError] = useState<string | null>(null)
  const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null)
  const component = useMemo(
    () => parseAppStreamContent(app?.appstreamContent),
    [app?.appstreamContent],
  )
  // The packages of the application, narrowed by the filters the list holds
  const readPkgs = useCallback(
    (page: number, filters: PkgFilters) =>
      appId ? getAppPackages(appId, page, filters, i18n.language) : Promise.resolve(null),
    [appId, i18n.language],
  )
  // The reviews of the application, narrowed by the language the list is set to
  const readReviews = useCallback(
    (page: number, filters: ReviewFilters) =>
      appId ? getAppReviews(appId, page, filters, i18n.language) : Promise.resolve(null),
    [appId, i18n.language],
  )

  useEffect(() => {
    if (!appId) {
      setError(t('detail.invalidId'))
      return
    }
    getApp(appId, i18n.language)
      .then(setApp)
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : t('common.loadAppError')),
      )
  }, [appId, i18n.language])

  if (error) {
    return (
      <Container component='main' py={{ base: 32, xs: 56 }} size='md'>
        <Alert color='red'>{error}</Alert>
      </Container>
    )
  }
  if (!app || !ready) {
    return (
      <div className={styles.loading}>
        <Loader color='orange' />
      </div>
    )
  }

  const name = localized(app.name, i18n.language)
  const description = resolveDescription(component, i18n.language)
  const screenshots = selectScreenshots(component?.screenshots ?? [], i18n.language)
  const isAdmin = user?.role === 'admin'

  function remove() {
    if (!app) return
    modals.openConfirmModal({
      centered: true,
      children: <Text>{t('detail.deleteConfirm', { name })}</Text>,
      confirmProps: { color: 'red' },
      labels: { cancel: t('common.cancel'), confirm: t('common.delete') },
      onConfirm: async () => {
        try {
          await deleteApp(app.id)
          navigate('/apps')
        } catch (reason) {
          setError(reason instanceof Error ? reason.message : t('detail.deleteError'))
        }
      },
      title: t('common.confirm'),
    })
  }

  function handleReviewSubmitted() {
    setReviewsError(null)
    setReviewsRefresh((value) => value + 1)
  }

  function handlePackageUploaded() {
    setPackagesRefresh((value) => value + 1)
  }

  function handleDeleteReview(review: Data.Review) {
    modals.openConfirmModal({
      centered: true,
      children: <Text>{t('reviews.deleteConfirm')}</Text>,
      confirmProps: { color: 'red' },
      labels: { cancel: t('common.cancel'), confirm: t('common.delete') },
      onConfirm: async () => {
        setReviewsError(null)
        setDeletingReviewId(review.id)
        try {
          await deleteReview(app!.id, review.id)
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

  return (
    <Container component='main' py={{ base: 32, xs: 56 }} size='md'>
      <header className={styles.header}>
        <Button
          component={Link}
          href='/apps'
          leftSection={<ArrowLeftIcon size={18} />}
          variant='subtle'
        >
          {t('detail.backToApps')}
        </Button>
        {isAdmin && (
          <Group gap='xs'>
            <AppMergeModal app={app} onMerged={setApp} />
            <Button
              component={Link}
              href={`/apps/${app.id}/edit`}
              leftSection={<PencilSimpleIcon size={18} />}
              variant='default'
            >
              {t('common.edit')}
            </Button>
            <Button
              color='red'
              leftSection={<TrashIcon size={18} />}
              variant='subtle'
              onClick={() => void remove()}
            >
              {t('common.delete')}
            </Button>
          </Group>
        )}
      </header>

      <section className={styles.intro}>
        {app.icon ? (
          <img alt='' className={styles.icon} src={app.icon.url} />
        ) : (
          <div className={`${styles.icon} ${styles.emptyIcon}`} />
        )}
        <div>
          <Text className={styles.eyebrow}>{t('detail.eyebrow')}</Text>
          <Group align='center' gap='sm' wrap='nowrap'>
            <Title order={1}>{name || app.appstreamId}</Title>
            <FavoriteButton appId={app.id} favorite={app.isFavorite} size='xl' />
          </Group>
          <AverageRating count={app.reviewCount} size='lg' value={app.avgRating} />
          <Text c='dimmed' size='lg'>
            {localized(app.summary, i18n.language)}
          </Text>
        </div>
      </section>

      <DataList className={styles.metadata} gap='md'>
        <DataList.Item>
          <DataList.ItemLabel>{t('common.version')}</DataList.ItemLabel>
          <DataList.ItemValue>{app.version ?? t('common.notSpecified')}</DataList.ItemValue>
        </DataList.Item>
        <DataList.Item>
          <DataList.ItemLabel>{t('common.license')}</DataList.ItemLabel>
          <DataList.ItemValue>{app.license ?? t('common.notSpecified')}</DataList.ItemValue>
        </DataList.Item>
        <DataList.Item>
          <DataList.ItemLabel>{t('common.appstreamId')}</DataList.ItemLabel>
          <DataList.ItemValue>{app.appstreamId ?? t('common.notSpecified')}</DataList.ItemValue>
        </DataList.Item>
        <DataList.Item>
          <DataList.ItemLabel>{t('common.type')}</DataList.ItemLabel>
          <DataList.ItemValue>
            {t(appTypeKey(app.type), { defaultValue: app.type })}
          </DataList.ItemValue>
        </DataList.Item>
        {app.appstreamIdAliases.length > 0 && (
          <DataList.Item>
            <DataList.ItemLabel>{t('common.appstreamIdAliases')}</DataList.ItemLabel>
            <DataList.ItemValue>{app.appstreamIdAliases.join(', ')}</DataList.ItemValue>
          </DataList.Item>
        )}
        {app.pkgNames.length > 0 && (
          <DataList.Item>
            <DataList.ItemLabel>{t('common.pkgNames')}</DataList.ItemLabel>
            <DataList.ItemValue>
              {app.pkgNames.map(formatPkgNameMapping).join(', ')}
            </DataList.ItemValue>
          </DataList.Item>
        )}
        {app.categories.length > 0 && (
          <DataList.Item>
            <DataList.ItemLabel>{t('detail.categories')}</DataList.ItemLabel>
            <DataList.ItemValue>
              <CategoryBadges categories={app.categories} />
            </DataList.ItemValue>
          </DataList.Item>
        )}
      </DataList>

      {screenshots.length > 0 && (
        <section className={styles.screenshots}>
          <ScreenshotCarousel screenshots={screenshots} />
        </section>
      )}

      {description && (
        <section className={styles.description}>
          <div
            className={styles.descriptionBody}
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </section>
      )}

      {(app.homepage || app.appstreamUrl || app.desktopUrl) && (
        <section className={styles.sources}>
          <Title order={2}>{t('detail.sources')}</Title>
          <Group gap='xs'>
            {app.homepage && (
              <Button
                component='a'
                href={app.homepage}
                rel='noreferrer'
                target='_blank'
                rightSection={<ArrowSquareOutIcon size={18} />}
                variant='default'
              >
                {t('common.homepage')}
              </Button>
            )}
            {app.appstreamUrl && (
              <Button
                component='a'
                href={app.appstreamUrl}
                rel='noreferrer'
                target='_blank'
                rightSection={<ArrowSquareOutIcon size={18} />}
                variant='default'
              >
                {t('detail.appstreamMetadata')}
              </Button>
            )}
            {app.desktopUrl && (
              <Button
                component='a'
                href={app.desktopUrl}
                rel='noreferrer'
                target='_blank'
                rightSection={<ArrowSquareOutIcon size={18} />}
                variant='default'
              >
                {t('common.desktopEntry')}
              </Button>
            )}
          </Group>
        </section>
      )}

      <section className={styles.packages}>
        <Group align='center' justify='space-between'>
          <Title order={2}>{t('common.packages')}</Title>
          {isAdmin && (
            <Group gap='xs'>
              <PackageUpload appId={app.id} onUploaded={handlePackageUploaded} />
              <Button
                component={Link}
                href={`/pkgs/new?appId=${app.id}`}
                leftSection={<PlusIcon size={16} weight='bold' />}
                size='xs'
              >
                {t('common.add')}
              </Button>
            </Group>
          )}
        </Group>
        <PkgList
          emptyMessage={t('detail.noPackages')}
          filteredEmptyMessage={t('common.packagesNotFound')}
          load={readPkgs}
          refreshKey={packagesRefresh}
          showDetails
        />
      </section>

      <section className={styles.reviews}>
        <Title order={2}>{t('reviews.title')}</Title>
        <ReviewForm appId={app.id} onSubmitted={handleReviewSubmitted} />
        {reviewsError && <Alert color='red'>{reviewsError}</Alert>}
        <ReviewList
          currentUserId={user?.id}
          deletingId={deletingReviewId}
          language={i18n.language}
          load={readReviews}
          onDelete={handleDeleteReview}
          refreshKey={reviewsRefresh}
          variant='app'
        />
      </section>
    </Container>
  )
}
