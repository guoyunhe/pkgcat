import { Tabs, Text, Title } from '@mantine/core'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useSearchParams } from 'wouter'

import AppList, { type AppFilters } from '../components/AppList'
import CountBadge from '../components/CountBadge'
import DistroTable from '../components/DistroTable'
import PkgList from '../components/PkgList'
import RepoTable from '../components/RepoTable'
import { getApps } from '../services/apps'
import { getDistros, type DistroFilters } from '../services/distros'
import { getPkgs, type PkgFilters } from '../services/pkgs'
import { getRepos, type RepoFilters } from '../services/repos'

import styles from './AppsPage.module.css'

/** Tabs the results are split into, in the order they are shown; the applications are the default. */
const searchTabs = ['apps', 'pkgs', 'repos', 'distros'] as const

type SearchTab = (typeof searchTabs)[number]

/** Tab a query string names, falling back to the applications, which a search opens on. */
function searchTab(value: string | null | undefined): SearchTab {
  return searchTabs.find((tab) => tab === value) ?? 'apps'
}

export default function SearchResultsPage() {
  const { t, i18n } = useTranslation()
  // The terms and the tab are both kept in the query string, so that a search is shared and reloaded
  // with what it looked for and what it was showing
  const [searchParams, setSearchParams] = useSearchParams()
  const [, navigate] = useLocation()
  const query = searchParams.get('q')?.trim() ?? ''
  const activeTab = searchTab(searchParams.get('tab'))

  const [appsCount, setAppsCount] = useState<number | null>(null)
  const [pkgsCount, setPkgsCount] = useState<number | null>(null)
  const [reposCount, setReposCount] = useState<number | null>(null)
  const [distrosCount, setDistrosCount] = useState<number | null>(null)

  // The applications the search terms name, narrowed and ordered by the filters of the list
  const readApps = useCallback(
    (page: number, filters: AppFilters) =>
      getApps(query, page, 12, filters.category, filters.type, filters.sort, i18n.language),
    [i18n.language, query],
  )
  // The packages the search terms name, narrowed by the filters the list holds
  const readPkgs = useCallback(
    (page: number, filters: PkgFilters) => getPkgs(query, page, filters, i18n.language),
    [i18n.language, query],
  )
  // The repositories and the releases the search terms name, whose tables carry no toolbar here:
  // the terms of the page are the whole of what narrows them
  const readRepos = useCallback(
    (page: number, filters: RepoFilters) => getRepos('name', { ...filters, q: query }, page),
    [query],
  )
  const readDistros = useCallback(
    (page: number, filters: DistroFilters) => getDistros('name', { ...filters, q: query }, page),
    [query],
  )

  // The tab the reader opened is the one shown, which leaves the rest of the query string — the
  // terms the search was made with, and the filters the listings keep there — as it is. The default
  // tab is left out, the way the orders of the listings are
  function changeTab(nextTab: SearchTab) {
    setSearchParams((current) => {
      const params = new URLSearchParams(current)
      if (nextTab === 'apps') params.delete('tab')
      else params.set('tab', nextTab)
      return params
    })
  }

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
        onChange={(value) => changeTab(searchTab(value))}
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
            value='pkgs'
            rightSection={
              <CountBadge count={pkgsCount ?? undefined} loading={pkgsCount === null} />
            }
          >
            {t('common.packages')}
          </Tabs.Tab>
          <Tabs.Tab
            value='repos'
            rightSection={
              <CountBadge count={reposCount ?? undefined} loading={reposCount === null} />
            }
          >
            {t('common.repositories')}
          </Tabs.Tab>
          <Tabs.Tab
            value='distros'
            rightSection={
              <CountBadge count={distrosCount ?? undefined} loading={distrosCount === null} />
            }
          >
            {t('common.distributions')}
          </Tabs.Tab>
        </Tabs.List>

        {/* Every listing is read on its own, and the count of each of them is what the tabs show */}
        <Tabs.Panel pt='lg' value='apps'>
          <AppList
            emptyMessage={t('common.appsNotFound')}
            errorMessage={t('search.loadError')}
            load={readApps}
            onCountChange={setAppsCount}
          />
        </Tabs.Panel>

        <Tabs.Panel pt='lg' value='pkgs'>
          <PkgList
            emptyMessage={t('common.packagesNotFound')}
            errorMessage={t('search.loadPackagesError')}
            load={readPkgs}
            onCountChange={setPkgsCount}
          />
        </Tabs.Panel>

        <Tabs.Panel pt='lg' value='repos'>
          <RepoTable
            emptyMessage={t('repos.searchEmpty')}
            errorMessage={t('search.loadReposError')}
            hideFilters
            load={readRepos}
            onCountChange={setReposCount}
            onRowClick={(repo) => navigate(`/repos/${repo.id}`)}
          />
        </Tabs.Panel>

        <Tabs.Panel pt='lg' value='distros'>
          <DistroTable
            emptyMessage={t('distros.searchEmpty')}
            errorMessage={t('search.loadDistrosError')}
            hideFilters
            load={readDistros}
            onCountChange={setDistrosCount}
            onRowClick={(distro) => navigate(`/distros/${distro.id}`)}
          />
        </Tabs.Panel>
      </Tabs>
    </main>
  )
}
