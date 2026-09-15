import type { Data } from '@generated/data'
import { Alert, Button, Group, Loader, Pagination, Text, Title } from '@mantine/core'
import { ArrowLeftIcon } from '@phosphor-icons/react/ArrowLeft'
import { ArrowSquareOutIcon } from '@phosphor-icons/react/ArrowSquareOut'
import { PencilSimpleIcon } from '@phosphor-icons/react/PencilSimple'
import { PlusIcon } from '@phosphor-icons/react/Plus'
import { TrashIcon } from '@phosphor-icons/react/Trash'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useRoute } from 'wouter'

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
import { deletePkg, type PkgFilters } from '../services/pkgs'
import { deleteReview, getAppReviews } from '../services/reviews'
import type { Paginated } from '../types/pagination'
import {
  localized,
  parseAppStreamContent,
  resolveDescription,
  selectScreenshots,
} from '../utils/appstream'
import { formatPkgNameMapping } from '../utils/pkgNames'

import styles from './AppDetailPage.module.css'

export default function AppDetailPage() {
  const { t, i18n } = useTranslation()
  const { ready, user } = useAuth()
  const [, navigate] = useLocation()
  const [, params] = useRoute('/apps/:id')
  const appId = params?.id ? Number(params.id) : undefined
  const [app, setApp] = useState<Data.App | null>(null)
  const [packagesRefresh, setPackagesRefresh] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [reviews, setReviews] = useState<Paginated<Data.Review> | null>(null)
  const [reviewsPage, setReviewsPage] = useState(1)
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [reviewsError, setReviewsError] = useState<string | null>(null)
  const [reviewsRefresh, setReviewsRefresh] = useState(0)
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

  useEffect(() => {
    if (!appId) return

    setReviewsLoading(true)
    setReviewsError(null)
    getAppReviews(appId, reviewsPage, i18n.language)
      .then(setReviews)
      .catch((reason) =>
        setReviewsError(reason instanceof Error ? reason.message : t('reviews.loadError')),
      )
      .finally(() => setReviewsLoading(false))
  }, [appId, i18n.language, reviewsPage, reviewsRefresh])

  if (error) {
    return (
      <main className={styles.page}>
        <Alert color='red'>{error}</Alert>
      </main>
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

  async function remove() {
    if (!app) return
    if (!window.confirm(t('detail.deleteConfirm', { name }))) return
    try {
      await deleteApp(app.id)
      navigate('/apps')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('detail.deleteError'))
    }
  }

  function handleReviewSubmitted() {
    setReviewsPage(1)
    setReviewsRefresh((value) => value + 1)
  }

  function handlePackageUploaded() {
    setPackagesRefresh((value) => value + 1)
  }

  async function handleDeleteReview(review: Data.Review) {
    if (!window.confirm(t('reviews.deleteConfirm'))) return
    setDeletingReviewId(review.id)
    try {
      await deleteReview(app!.id, review.id)
      setReviewsRefresh((value) => value + 1)
    } catch (reason) {
      setReviewsError(reason instanceof Error ? reason.message : t('reviews.deleteError'))
    } finally {
      setDeletingReviewId(null)
    }
  }

  async function handleDeletePkg(pkg: Data.Pkg) {
    if (!window.confirm(t('packages.deleteConfirm', { name: pkg.name }))) return
    try {
      await deletePkg(pkg.id)
      setPackagesRefresh((value) => value + 1)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('packages.deleteError'))
    }
  }

  return (
    <main className={styles.page}>
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
              {t('common.editApp')}
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
            <Title order={1}>{name}</Title>
            <FavoriteButton appId={app.id} favorite={app.isFavorite} size='xl' />
          </Group>
          <AverageRating count={app.reviewCount} size='lg' value={app.avgRating} />
          <Text c='dimmed' size='lg'>
            {localized(app.summary, i18n.language)}
          </Text>
        </div>
      </section>

      <section className={styles.metadata}>
        <div>
          <Text size='sm' c='dimmed'>
            {t('common.version')}
          </Text>
          <Text>{app.version ?? t('common.notSpecified')}</Text>
        </div>
        <div>
          <Text size='sm' c='dimmed'>
            {t('common.license')}
          </Text>
          <Text>{app.license ?? t('common.notSpecified')}</Text>
        </div>
        <div>
          <Text size='sm' c='dimmed'>
            {t('common.appstreamId')}
          </Text>
          <Text>{app.appstreamId ?? t('common.notSpecified')}</Text>
        </div>
        <div>
          <Text size='sm' c='dimmed'>
            {t('common.type')}
          </Text>
          <Text>{app.type}</Text>
        </div>
        {app.appstreamIdAliases.length > 0 && (
          <div>
            <Text size='sm' c='dimmed'>
              {t('common.appstreamIdAliases')}
            </Text>
            <Text>{app.appstreamIdAliases.join(', ')}</Text>
          </div>
        )}
        {app.pkgNames.length > 0 && (
          <div>
            <Text size='sm' c='dimmed'>
              {t('common.pkgNames')}
            </Text>
            <Text>{app.pkgNames.map(formatPkgNameMapping).join(', ')}</Text>
          </div>
        )}
        {app.categories.length > 0 && (
          <div>
            <Text size='sm' c='dimmed'>
              {t('detail.categories')}
            </Text>
            <CategoryBadges categories={app.categories} />
          </div>
        )}
      </section>

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
                {t('common.addPackage')}
              </Button>
            </Group>
          )}
        </Group>
        <PkgList
          emptyMessage={t('detail.noPackages')}
          filteredEmptyMessage={t('common.packagesNotFound')}
          load={readPkgs}
          refreshKey={packagesRefresh}
          renderActions={
            isAdmin
              ? (pkg) => (
                  <>
                    <Button
                      aria-label={t('common.edit')}
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
                      onClick={() => void handleDeletePkg(pkg)}
                    >
                      <TrashIcon size={16} />
                    </Button>
                  </>
                )
              : undefined
          }
          showDetails
        />
      </section>

      <section className={styles.reviews}>
        <Title order={2}>{t('reviews.title')}</Title>
        <ReviewForm appId={app.id} onSubmitted={handleReviewSubmitted} />
        {reviewsError && <Alert color='red'>{reviewsError}</Alert>}
        {reviewsLoading ? (
          <div className={styles.packagesLoading}>
            <Loader color='orange' size='sm' />
          </div>
        ) : reviews ? (
          <ReviewList
            currentUserId={user?.id}
            deletingId={deletingReviewId}
            language={i18n.language}
            onDelete={handleDeleteReview}
            onPageChange={setReviewsPage}
            page={reviewsPage}
            reviews={reviews}
            variant='app'
          />
        ) : null}
      </section>
    </main>
  )
}
