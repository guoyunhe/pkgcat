import type { Data } from '@generated/data'
import { Alert, Anchor, Loader, Text, Title } from '@mantine/core'
import { ArrowRightIcon } from '@phosphor-icons/react/ArrowRight'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'wouter'

import HomeAppCard from '../components/HomeAppCard'
import HomeDistroCard from '../components/HomeDistroCard'
import { getApps } from '../services/apps'
import { getDistros, type Distro } from '../services/distros'

import styles from './HomePage.module.css'

export default function HomePage() {
  const { t, i18n } = useTranslation()
  const [apps, setApps] = useState<Data.App[]>([])
  const [distros, setDistros] = useState<Distro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getApps('', 1, 12, null, null, 'newest', i18n.language), getDistros()])
      .then(([appPage, distroList]) => {
        setApps(appPage.data.slice(0, 6))
        setDistros(distroList)
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
            <div className={styles.appGrid}>
              {apps.map((app) => (
                <HomeAppCard app={app} key={app.id} />
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
