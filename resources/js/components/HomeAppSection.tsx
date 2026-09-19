import type { Data } from '@generated/data'
import { Alert, Skeleton } from '@mantine/core'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { getApps } from '../services/apps'
import AppListItem from './AppListItem'
import HomeSection from './HomeSection'

import styles from './HomeAppSection.module.css'

/** Applications the section shows, which is the page of the listing it reads. */
const appCount = 12

/** Height of the icon a row of the listing shows. */
const iconSize = 80

/**
 * The applications of the catalog on the home page: a page of the listing, read in a random order
 * and only of the applications that carry an icon, so that a visit shows other applications than
 * the one before it, all of them with an icon to show. The rows that stand in for them while the
 * page is read are the shape of the rows that replace them.
 */
export default function HomeAppSection() {
  const { t, i18n } = useTranslation()
  const [apps, setApps] = useState<Data.App[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    getApps('', 1, appCount, null, null, 'random', i18n.language, true)
      .then((page) => {
        if (active) setApps(page.data)
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : t('home.loadError'))
      })

    return () => {
      active = false
    }
  }, [i18n.language, t])

  return (
    <HomeSection eyebrow={t('common.linuxCatalog')} href='/apps' title={t('common.apps')}>
      {error ? (
        <Alert color='red'>{error}</Alert>
      ) : (
        <div className={styles.appList}>
          {Array.from({ length: apps?.length ?? appCount }, (_, index) => {
            const app = apps?.[index]
            return app ? (
              <AppListItem app={app} key={app.id} />
            ) : (
              <div className={styles.row} key={index}>
                <Skeleton height={iconSize} width={iconSize} />
                <div className={styles.lines}>
                  <Skeleton height={20} width='40%' />
                  <Skeleton height={16} mt='sm' width='70%' />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </HomeSection>
  )
}
