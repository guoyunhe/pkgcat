import type { Data } from '@generated/data'
import { Alert, Group, Loader, Pagination, Tabs, Text, Title } from '@mantine/core'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'wouter'

import AppList from '../components/AppList'
import CategoryFilter from '../components/CategoryFilter'
import CountBadge from '../components/CountBadge'
import PkgFilters, { useStoredPkgFilters } from '../components/PkgFilters'
import PkgList from '../components/PkgList'
import { getApps, searchPackages } from '../services/apps'
import type { Paginated } from '../types/pagination'

import styles from './AppsPage.module.css'

type SearchTab = 'apps' | 'packages'

export default function SearchResultsPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q')?.trim() ?? ''

  const [activeTab, setActiveTab] = useState<SearchTab>('apps')
  const [appsPage, setAppsPage] = useState(1)
  const [appsCategory, setAppsCategory] = useState<string | null>(null)
  const [pkgsPage, setPkgsPage] = useState(1)

  const [appsResult, setAppsResult] = useState<Paginated<Data.App> | null>(null)
  const [appsLoading, setAppsLoading] = useState(true)
  const [appsError, setAppsError] = useState<string | null>(null)

  const [pkgsResult, setPkgsResult] = useState<Paginated<Data.Pkg> | null>(null)
  const [pkgsLoading, setPkgsLoading] = useState(true)
  const [pkgsError, setPkgsError] = useState<string | null>(null)
  const [filters, setFilters] = useStoredPkgFilters()

  useEffect(() => {
    setAppsPage(1)
    setPkgsPage(1)
  }, [query])

  useEffect(() => {
    setPkgsPage(1)
  }, [filters])

  useEffect(() => {
    setAppsPage(1)
  }, [appsCategory])

  useEffect(() => {
    let active = true
    setAppsLoading(true)
    setAppsError(null)
    getApps(query, appsPage, 12, appsCategory)
      .then((result) => {
        if (active) setAppsResult(result)
      })
      .catch((reason) => {
        if (active) {
          setAppsError(reason instanceof Error ? reason.message : t('search.loadError'))
        }
      })
      .finally(() => {
        if (active) setAppsLoading(false)
      })
    return () => {
      active = false
    }
  }, [appsCategory, appsPage, query, t])

  useEffect(() => {
    let active = true
    setPkgsLoading(true)
    setPkgsError(null)
    searchPackages(query, pkgsPage, filters)
      .then((result) => {
        if (active) setPkgsResult(result)
      })
      .catch((reason) => {
        if (active) {
          setPkgsError(reason instanceof Error ? reason.message : t('search.loadPackagesError'))
        }
      })
      .finally(() => {
        if (active) setPkgsLoading(false)
      })
    return () => {
      active = false
    }
  }, [filters, pkgsPage, query, t])

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Text className={styles.eyebrow}>{t('search.eyebrow')}</Text>
          <Title order={1}>{t('search.title')}</Title>
          <Text c='dimmed'>{t('search.resultsFor', { query })}</Text>
        </div>
      </header>

      <Tabs mb='lg' value={activeTab} onChange={(value) => setActiveTab(value as SearchTab)}>
        <Tabs.List>
          <Tabs.Tab
            value='apps'
            rightSection={<CountBadge count={appsResult?.meta.total} loading={appsLoading} />}
          >
            {t('search.tabs.apps')}
          </Tabs.Tab>
          <Tabs.Tab
            value='packages'
            rightSection={<CountBadge count={pkgsResult?.meta.total} loading={pkgsLoading} />}
          >
            {t('search.tabs.packages')}
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {activeTab === 'packages' && <PkgFilters onChange={setFilters} value={filters} />}

      {activeTab === 'apps' && (
        <Group mb='lg'>
          <CategoryFilter onChange={setAppsCategory} value={appsCategory} />
        </Group>
      )}

      {activeTab === 'apps' &&
        (appsError ? (
          <Alert color='red'>{appsError}</Alert>
        ) : appsLoading ? (
          <div className={styles.loading}>
            <Loader color='orange' />
          </div>
        ) : appsResult && appsResult.data.length > 0 ? (
          <>
            <AppList apps={appsResult.data} />
            {appsResult.meta.lastPage > 1 && (
              <Pagination
                className={styles.pagination}
                total={appsResult.meta.lastPage}
                value={appsResult.meta.currentPage}
                onChange={setAppsPage}
              />
            )}
          </>
        ) : (
          <Text c='dimmed'>{t('search.notFound')}</Text>
        ))}

      {activeTab === 'packages' &&
        (pkgsError ? (
          <Alert color='red'>{pkgsError}</Alert>
        ) : pkgsLoading ? (
          <div className={styles.loading}>
            <Loader color='orange' />
          </div>
        ) : pkgsResult && pkgsResult.data.length > 0 ? (
          <>
            <PkgList pkgs={pkgsResult.data} />
            {pkgsResult.meta.lastPage > 1 && (
              <Pagination
                className={styles.pagination}
                total={pkgsResult.meta.lastPage}
                value={pkgsResult.meta.currentPage}
                onChange={setPkgsPage}
              />
            )}
          </>
        ) : (
          <Text c='dimmed'>{t('search.packagesNotFound')}</Text>
        ))}
    </main>
  )
}
