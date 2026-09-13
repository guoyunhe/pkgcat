import type { Data } from '@generated/data'
import { ActionIcon, Pagination, Text, Tooltip } from '@mantine/core'
import { TrashIcon } from '@phosphor-icons/react/Trash'
import { useTranslation } from 'react-i18next'

import type { Paginated } from '../types/pagination'
import ReviewListItem from './ReviewListItem'

import styles from './ReviewList.module.css'

type ReviewListProps = {
  reviews: Paginated<Data.Review>
  page: number
  onPageChange: (page: number) => void
  variant: 'app' | 'user'
  language: string
  currentUserId?: number
  deletingId?: number | null
  onDelete?: (review: Data.Review) => void
}

/** Reviews an application received, or the reviews a user wrote, with the paging of the list. */
export default function ReviewList({
  reviews,
  page,
  onPageChange,
  variant,
  language,
  currentUserId,
  deletingId,
  onDelete,
}: ReviewListProps) {
  const { t } = useTranslation()

  if (reviews.data.length === 0) {
    return (
      <Text c='dimmed' mt='md'>
        {t('reviews.empty')}
      </Text>
    )
  }

  return (
    <div>
      <div className={styles.list}>
        {reviews.data.map((review) => {
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
      {reviews.meta.lastPage > 1 && (
        <Pagination
          className={styles.pagination}
          onChange={onPageChange}
          total={reviews.meta.lastPage}
          value={page}
        />
      )}
    </div>
  )
}
