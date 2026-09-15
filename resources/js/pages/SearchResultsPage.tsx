import { Group, Tabs, Text, Title } from '@mantine/core'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'wouter'

import AppList from '../components/AppList'
import CategoryFilter from '../components/CategoryFilter'
import CountBadge from '../components/CountBadge'
import PkgFilters, { useStoredPkgFilters } from '../components/PkgFilters'
import PkgList from '../components/PkgList'
import { getApps } from '../services/apps'
import { getPkgs } from '../services/pkgs'

import styles from './AppsPage.module.css'

type SearchTab = 'apps' | 'packages'

export default function SearchResultsPage() {
  const { t, i18n } = useTranslation()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q')?.trim() ?? ''

  const [activeTab, setActiveTab] = useState<SearchTab>('apps')
  const [appsCategory, setAppsCategory] = useState<string | null>(null)
  const [appsCount, setAppsCount] = useState<number | null>(null)
  const [pkgsCount, setPkgsCount] = useState<number | null>(null)

  const [filters, setFilters] = useStoredPkgFilters()
  // The applications the search terms and the category name, which the list reads one page of at a
  // time
  const readApps = useCallback(
    (page: number) => getApps(query, page, 12, appsCategory, null, 'newest', i18n.language),
    [appsCategory, i18n.language, query],
  )
  // The packages the search terms and the filters name, which the list reads one page of at a time
  const readPkgs = useCallback(
    (page: number) => getPkgs(query, page, filters, i18n.language),
    [filters, i18n.language, query],
  )

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Text className={styles.eyebrow}>{t('search.eyebrow')}</Text>
          <Title order={1}>{t('search.title')}</Title>
          <Text c='dimmed'>{t('search.resultsFor', { query })}</Text>
        </div>
      </header>

      <Tabs
        keepMounted
        keepMountedMode='display-none'
        mb='lg'
        value={activeTab}
        onChange={(value) => setActiveTab(value as SearchTab)}
      >
        <Tabs.List>
          <Tabs.Tab
            value='apps'
            rightSection={
              <CountBadge count={appsCount ?? undefined} loading={appsCount === null} />
            }
          >
            {t('common.apps')}
          </Tabs.Tab>
          <Tabs.Tab
            value='packages'
            rightSection={
              <CountBadge count={pkgsCount ?? undefined} loading={pkgsCount === null} />
            }
          >
            {t('common.packages')}
          </Tabs.Tab>
        </Tabs.List>

        {/* Both listings are read on their own, and the count of each of them is what the tabs show */}
        <Tabs.Panel value='apps'>
          <Group mb='lg'>
            <CategoryFilter onChange={setAppsCategory} value={appsCategory} />
          </Group>
          <AppList
            emptyMessage={t('common.appsNotFound')}
            errorMessage={t('search.loadError')}
            load={readApps}
            onCountChange={setAppsCount}
          />
        </Tabs.Panel>

        <Tabs.Panel value='packages'>
          <PkgFilters onChange={setFilters} value={filters} />
          <PkgList
            emptyMessage={t('common.packagesNotFound')}
            errorMessage={t('search.loadPackagesError')}
            load={readPkgs}
            onCountChange={setPkgsCount}
          />
        </Tabs.Panel>
      </Tabs>
    </main>
  )
}
