import { Card, Text } from '@mantine/core'

import type { Distro } from '../services/distros'

import styles from './HomeCards.module.css'

type HomeDistroCardProps = {
  distro: Distro
}

export default function HomeDistroCard({ distro }: HomeDistroCardProps) {
  return (
    <Card className={styles.distroItem} padding='md' radius='sm' withBorder>
      <div className={styles.distroHeading}>
        <img
          alt=''
          className={styles.distroIcon}
          src={`/distros/${encodeURIComponent(distro.name)}.svg`}
        />
        <Text className={styles.distroName} fw={700}>
          {distro.name}
        </Text>
        {distro.version && (
          <Text className={styles.distroVersion} fw={700}>
            {distro.version}
          </Text>
        )}
        <Text className={styles.distroArch}>{distro.arch}</Text>
      </div>
    </Card>
  )
}
