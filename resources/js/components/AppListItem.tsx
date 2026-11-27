import type { Data } from '@generated/data'
import { Group, Stack, Text, Title } from '@mantine/core'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'wouter'

import { localized } from '../utils/appstream'
import { appTypeIcon } from '../utils/appTypes'
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
  const { i18n, t } = useTranslation()
  const name = localized(app.name, i18n.language)

  return (
    <Group component='article' className={styles.item}>
      <Link aria-label={name} className={styles.iconLink} href={`/apps/${app.id}`}>
        <img alt='' className={styles.icon} src={app.icon?.url ?? appTypeIcon(app.type)} />
      </Link>
      <Stack gap={4} flex={1}>
        <Title order={4}>
          <Link className={styles.link} href={`/apps/${app.id}`}>
            {name || app.appstreamId}{' '}
            {app.appstreamId && name && (
              <Text c='dimmed' component='span'>
                {app.appstreamId}
              </Text>
            )}
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
        {app.distroNames.length > 0 && (
          <Group gap={4}>
            {app.distroNames.map((distro) => {
              const unofficial = app.unofficialDistroNames.includes(distro)
              return (
                <span className={styles.distro} key={distro}>
                  <img
                    alt={distro}
                    className={styles.distroIcon}
                    src={`/distros/${encodeURIComponent(distro)}.svg`}
                    title={unofficial ? `${distro}: ${t('apps.communityRepoOnly')}` : distro}
                  />
                  {unofficial && (
                    <span className={styles.distroBadge} title={t('apps.communityRepoOnly')} />
                  )}
                </span>
              )
            })}
          </Group>
        )}
      </Stack>
      {actions && <div className={styles.actions}>{actions}</div>}
    </Group>
  )
}
