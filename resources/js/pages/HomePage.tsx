import type { Data } from '@generated/data'
import { Alert, Anchor, Loader, Text, Title } from '@mantine/core'
import { ArrowRightIcon } from '@phosphor-icons/react/ArrowRight'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'wouter'

import AppListItem from '../components/AppListItem'
import HomeDistroCard from '../components/HomeDistroCard'
import { getApps } from '../services/apps'
import { getDistros, type Distro } from '../services/distros'

import styles from './HomePage.module.css'

/** Number of applications the home page shows, each with the icon the listing shows it with. */
const appCount = 6

/**
 * Number of releases the home page shows: the ones the most users run. The listing pages its
 * entries ten at a time, so the first page it reads is the list shown here.
 */
const distroCount = 10

export default function HomePage() {
  const { t, i18n } = useTranslation()
  const [apps, setApps] = useState<Data.App[]>([])
  const [distros, setDistros] = useState<Distro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // The applications are read in a random order and only those that carry an icon, so that a visit
    // shows other applications than the one before it, all of them with an icon to show; the releases
    // are the ones the most users run, which the listing reads as its own first page
    Promise.all([
      getApps('', 1, appCount, null, null, 'random', i18n.language, true),
      getDistros('users'),
    ])
      .then(([appPage, distroPage]) => {
        setApps(appPage.data)
        setDistros(distroPage.data.slice(0, distroCount))
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : t('home.loadError')))
      .finally(() => setLoading(false))
  }, [i18n.language])

  return (
    <main className={styles.page}>
      {error && (
        <Alert color='red' mb='lg'>
          {error}
        </Alert>
      )}
      {loading ? (
        <div className={styles.loading}>
          <Loader color='orange' />
        </div>
      ) : (
        <>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <Text className={styles.eyebrow}>{t('common.linuxCatalog')}</Text>
                <Title order={1}>{t('common.apps')}</Title>
              </div>
              <Anchor component={Link} href='/apps'>
                {t('home.viewAll')} <ArrowRightIcon size={16} />
              </Anchor>
            </div>
            <div className={styles.appList}>
              {apps.map((app) => (
                <AppListItem app={app} key={app.id} />
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <Text className={styles.eyebrow}>{t('home.operatingSystems')}</Text>
                <Title order={2}>{t('common.distributions')}</Title>
              </div>
            </div>
            <div className={styles.distroGrid}>
              {distros.map((distro) => (
                <HomeDistroCard distro={distro} key={distro.id} />
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  )
}
