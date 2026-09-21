import type { Data } from '@generated/data'
import { ActionIcon, Alert, Loader, Pagination, Text, Tooltip } from '@mantine/core'
import { TrashIcon } from '@phosphor-icons/react/Trash'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { prefixedUrlKeys } from '../searchParams'
import type { ReviewFilters } from '../services/reviews'
import type { Paginated } from '../types/pagination'
import { languageOptions } from '../utils/languages'
import ListFilter from './ListFilter'
import ReviewListItem from './ReviewListItem'

import styles from './ReviewList.module.css'

/** Names the parameters of the listing are kept in the query string under. */
const paramNames = ['locale', 'page'] as const

type ReviewListProps = {
  /**
   * Reads one page of the listing, narrowed by the language the reviews were written in. The loader
   * has to keep its identity (`useCallback`), which is also what tells the listing that it reads
   * something else now — the reviews of another application or user. A page that has nothing to
   * read answers with `null`, which the listing shows as empty.
   */
  load: (page: number, filters: ReviewFilters) => Promise<Paginated<Data.Review> | null>
  /** What the header links to: the reviewer on an application page, the application on a user page. */
  variant: 'app' | 'user'
  /** Language the listing is read in, which dates and application names are written in. */
  language: string
  /** Reader of the page, whose own reviews are the ones they may take back. */
  currentUserId?: number
  /** Review being taken back, which is the one whose button is shown as busy. */
  deletingId?: number | null
  onDelete?: (review: Data.Review) => void
  /**
   * Bumped by the page when a review was written or taken back, which reads the listing again. It
   * starts over at its first page then: a review is the newest entry of the listing, so what the
   * page changed is read there.
   */
  refreshKey?: number
}

/**
 * Reviews an application received, or the reviews a user wrote, read one page at a time and
 * narrowed by the language they were written in — a review is read by people who write that
 * language, which is what a reader of them filters by. What the listing is narrowed by and the page
 * of it the reader is on are kept in the query string under prefixed names (`reviewslocale`,
 * `reviewspage`), because an application page shows the packages of the application beside it, and
 * both listings are paged by a page of their own.
 */
export default function ReviewList({
  load,
  variant,
  language,
  currentUserId,
  deletingId,
  onDelete,
  refreshKey,
}: ReviewListProps) {
  const { t } = useTranslation()
  const [{ locale, page }, setParams] = useQueryStates(
    { locale: parseAsString, page: parseAsInteger.withDefault(1) },
    { urlKeys: prefixedUrlKeys('reviews', paramNames) },
  )
  const filters = useMemo<ReviewFilters>(() => ({ reviewLocale: locale }), [locale])
  const [result, setResult] = useState<Paginated<Data.Review> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // The refresh the listing has answered already, which tells a change made outside it apart from
  // the listing being read again for another reason, such as the reader turning to another page
  const answeredRefresh = useRef(refreshKey)

  useEffect(() => {
    // What the page changed is the newest entry of the listing, which the reader is shown from its
    // first page: dropping the page parameter is what reads the listing from there
    if (answeredRefresh.current !== refreshKey) {
      answeredRefresh.current = refreshKey
      if (page !== 1) {
        void setParams({ page: null })
        return
      }
    }

    let active = true

    setLoading(true)
    setError(null)
    load(page, filters)
      .then((reviewPage) => {
        if (!active) return
        setResult(reviewPage)
      })
      .catch((reason) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : t('reviews.loadError'))
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [filters, load, page, refreshKey, setParams, t])

  // Every language the catalog keeps, which is the vocabulary the language of a review comes from,
  // named in that language itself and carrying its tag, so the list is searched by either of them
  const languages = useMemo(() => languageOptions([]), [])

  return (
    <>
      <div className={styles.toolbar}>
        <ListFilter
          data={languages}
          label={t('reviews.language')}
          onChange={(next) => void setParams({ locale: next, page: null })}
          placeholder={t('reviews.filterAnyLanguage')}
          searchable
          value={locale}
        />
      </div>
      {error ? (
        <Alert color='red'>{error}</Alert>
      ) : loading ? (
        <div className={styles.loading}>
          <Loader color='orange' />
        </div>
      ) : !result || result.data.length === 0 ? (
        <Text c='dimmed' className={styles.empty}>
          {locale === null ? t('reviews.empty') : t('reviews.filterEmpty')}
        </Text>
      ) : (
        <>
          <div className={styles.list}>
            {result.data.map((review) => {
              const isOwn = currentUserId !== undefined && review.user?.id === currentUserId
              return (
                <ReviewListItem
                  actions={
                    isOwn && onDelete ? (
                      <Tooltip label={t('reviews.delete')} position='bottom' withArrow>
                        <ActionIcon
                          aria-label={t('reviews.delete')}
                          color='red'
                          loading={deletingId === review.id}
                          size='sm'
                          variant='subtle'
                          onClick={() => onDelete(review)}
                        >
                          <TrashIcon size={16} />
                        </ActionIcon>
                      </Tooltip>
                    ) : undefined
                  }
                  key={review.id}
                  language={language}
                  review={review}
                  variant={variant}
                />
              )
            })}
          </div>
          {result.meta.lastPage > 1 && (
            <Pagination
              className={styles.pagination}
              onChange={(nextPage) => void setParams({ page: nextPage })}
              total={result.meta.lastPage}
              value={page}
            />
          )}
        </>
      )}
    </>
  )
}
