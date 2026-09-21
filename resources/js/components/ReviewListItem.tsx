import type { Data } from '@generated/data'
import { Group, Rating, Text } from '@mantine/core'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'wouter'

import { localized } from '../utils/appstream'
import { languageLabel } from '../utils/languages'
import DistroRelease from './DistroRelease'
import UserAvatar from './UserAvatar'

import styles from './ReviewListItem.module.css'

/** Review date in the language of the listing, or `null` when the review carries no date. */
function formatDate(value: string | null, language: string) {
  if (!value) return null
  const date = new Date(value)
  return date.toLocaleDateString(language.startsWith('zh') ? language : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

type ReviewListItemProps = {
  review: Data.Review
  /** What the header links to: the reviewer on an application page, the application on a user page. */
  variant: 'app' | 'user'
  language: string
  /** Extra controls rendered next to the rating, such as the delete button. */
  actions?: ReactNode
}

/** A single review: who wrote it (or which application it belongs to), its rating and its comment. */
export default function ReviewListItem({
  review,
  variant,
  language,
  actions,
}: ReviewListItemProps) {
  const { t } = useTranslation()
  const date = formatDate(review.createdAt, language)

  return (
    <article className={styles.item}>
      <div className={styles.row}>
        {variant === 'app' && review.user && <UserAvatar size={40} user={review.user} />}
        <div className={styles.body}>
          <Group justify='space-between' wrap='nowrap'>
            <div className={styles.heading}>
              {variant === 'app' ? (
                review.user ? (
                  <Link className={styles.link} href={`/users/${review.user.id}`}>
                    {review.user.name}
                  </Link>
                ) : (
                  <Text c='dimmed' size='sm'>
                    {t('reviews.deletedUser')}
                  </Text>
                )
              ) : review.app ? (
                <Link className={styles.link} href={`/apps/${review.app.id}`}>
                  {localized(review.app.name, language)}
                </Link>
              ) : null}
              {date && (
                <Text c='dimmed' size='xs'>
                  {date}
                </Text>
              )}
              {review.distro && (
                <Text c='dimmed' component='span' size='xs'>
                  <DistroRelease distro={review.distro} showArch />
                </Text>
              )}
              {review.locale && (
                <Text c='dimmed' component='span' size='xs'>
                  {languageLabel(review.locale)}
                </Text>
              )}
            </div>
            <Group gap='xs' wrap='nowrap'>
              <Rating count={5} readOnly value={review.rating} />
              {actions}
            </Group>
          </Group>
          {review.comment && (
            <Text className={styles.comment} size='sm'>
              {review.comment}
            </Text>
          )}
        </div>
      </div>
    </article>
  )
}
