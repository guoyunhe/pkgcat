import type { Data } from '@generated/data'
import { Group, Stack, Text, Title } from '@mantine/core'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'wouter'

import { localized } from '../utils/appstream'
import AverageRating from './AverageRating'
import CategoryBadges from './CategoryBadges'

import styles from './AppListItem.module.css'

type AppListItemProps = {
  app: Data.App
  /** Extra controls rendered in the rightmost column, such as the favorite button. */
  actions?: ReactNode
}

/** A single application row: icon, localized name and summary, categories, rating and metadata. */
export default function AppListItem({ app, actions }: AppListItemProps) {
  const { i18n } = useTranslation()
  const name = localized(app.name, i18n.language)

  return (
    <Group component='article' className={styles.item}>
      <Link aria-label={name} className={styles.iconLink} href={`/apps/${app.id}`}>
        {app.icon ? (
          <img alt='' className={styles.icon} src={app.icon.url} />
        ) : (
          <div className={`${styles.icon} ${styles.emptyIcon}`} />
        )}
      </Link>
      <Stack gap={4} flex={1}>
        <Title order={4}>
          <Link className={styles.link} href={`/apps/${app.id}`}>
            {name || app.appstreamId}{' '}
            {app.version && (
              <Text c='dimmed' component='span'>
                {app.version}
              </Text>
            )}
          </Link>
        </Title>
        <Text c='dimmed'>{localized(app.summary, i18n.language)}</Text>
        <Group>
          <AverageRating count={app.reviewCount} value={app.avgRating} />
          <CategoryBadges categories={app.categories} />
        </Group>
      </Stack>
      {actions && <div className={styles.actions}>{actions}</div>}
    </Group>
  )
}
