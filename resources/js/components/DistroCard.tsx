import { Card, Group, Text } from '@mantine/core'
import { SquaresFourIcon } from '@phosphor-icons/react/SquaresFour'
import { UsersIcon } from '@phosphor-icons/react/Users'
import { useTranslation } from 'react-i18next'
import { Link } from 'wouter'

import { distroLabel, type Distro } from '../services/distros'
import { formatCount } from '../utils/format'

import styles from './DistroCard.module.css'

type DistroCardProps = {
  distro: Distro
}

/**
 * One release of the catalog as a card of the home page: the icon of its distribution, the release
 * it is and how many users run it and how many applications it carries; the card opens its detail
 * page. The release is named by `distroLabel`, the way the listings and the pickers name one, so
 * that its name, its version and its architecture read in one line at one size.
 */
export default function DistroCard({ distro }: DistroCardProps) {
  const { t, i18n } = useTranslation()

  return (
    <Card
      className={styles.card}
      component={Link}
      href={`/distros/${distro.id}`}
      padding='lg'
      radius='sm'
      withBorder
    >
      <img alt='' className={styles.icon} src={`/distros/${encodeURIComponent(distro.name)}.svg`} />
      <Text className={styles.name}>{distroLabel(distro)}</Text>
      <Group className={styles.counts} gap='xl' justify='center' wrap='nowrap'>
        <Text className={styles.count} component='span' title={t('common.users')}>
          <UsersIcon size={16} />
          {formatCount(distro.userCount ?? 0, i18n.language)}
        </Text>
        <Text className={styles.count} component='span' title={t('common.apps')}>
          <SquaresFourIcon size={16} />
          {formatCount(distro.appCount, i18n.language)}
        </Text>
      </Group>
    </Card>
  )
}
