import { Tabs, Text, Title } from '@mantine/core'
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
  useQueryStates,
} from 'nuqs'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'wouter'

import AppList, { type AppFilters } from '../components/AppList'
import CountBadge from '../components/CountBadge'
import DistroTable from '../components/DistroTable'
import PkgList from '../components/PkgList'
import RepoTable from '../components/RepoTable'
import { getApps } from '../services/apps'
import { getDistros, type DistroFilters } from '../services/distros'
import { getPkgs, type PkgFilters } from '../services/pkgs'
import { getRepos, type RepoFilters } from '../services/repos'
import { getSearchCounts } from '../services/search'

import styles from './AppsPage.module.css'

/** Tabs the results are split into, in the order they are shown; the applications are the default. */
const searchTabs = ['apps', 'pkgs', 'repos', 'distros'] as const

type SearchTab = (typeof searchTabs)[number]

/** Tab a control names, falling back to the applications, which a search opens on. */
function searchTab(value: string | null | undefined): SearchTab {
  return searchTabs.find((tab) => tab === value) ?? 'apps'
}

/**
 * Every parameter the listings of the tabs keep in the query string. A tab shows one listing at a
 * time — the others are not mounted — so the tabs share the names, and opening one starts it over
 * by clearing them.
 */
const listingParams = {
  arch: parseAsString,
  category: parseAsString,
  distroId: parseAsString,
  page: parseAsInteger,
  sort: parseAsString,
  source: parseAsString,
  type: parseAsString,
}

/** What every tab of the search holds, which is nothing until the counts have been read. */
const noCounts: Record<SearchTab, number | null> = {
  apps: null,
  pkgs: null,
  repos: null,
  distros: null,
}

export default function SearchResultsPage() {
  const { t, i18n } = useTranslation()
  // The terms and the tab are both kept in the query string, so that a search is shared and reloaded
  // with what it looked for and what it was showing
  const [query] = useQueryState('q', parseAsString)
  const [tab, setTab] = useQueryState('tab', parseAsStringLiteral(searchTabs).withDefault('apps'))
  const [, clearListings] = useQueryStates(listingParams)
  const [, navigate] = useLocation()
  const terms = query?.trim() ?? ''

  const [counts, setCounts] = useState(noCounts)

  // The applications the search terms name, narrowed and ordered by the filters of the list
  const readApps = useCallback(
    (page: number, filters: AppFilters) =>
      getApps(terms, page, 12, filters.category, filters.type, filters.sort, i18n.language),
    [i18n.language, terms],
  )
  // The packages the search terms name, narrowed by the filters the list holds
  const readPkgs = useCallback(
    (page: number, filters: PkgFilters) => getPkgs(terms, page, filters),
    [i18n.language, terms],
  )
  // The repositories and the releases the search terms name, whose tables carry no toolbar here:
  // the terms of the page are the whole of what narrows them
  const readRepos = useCallback(
    (page: number, filters: RepoFilters) => getRepos('name', { ...filters, q: terms }, page),
    [terms],
  )
  const readDistros = useCallback(
    (page: number, filters: DistroFilters) => getDistros('name', { ...filters, q: terms }, page),
    [terms],
  )

  // What every tab of the search holds, which is read in one request for all of them: a tab whose
  // listing is not mounted shows its count all the same, and it is the count of the terms the
  // search was made with — a tab that is narrowed reads another page, not another count
  useEffect(() => {
    let active = true

    setCounts(noCounts)
    getSearchCounts(terms)
      .then((next) => {
        if (active) setCounts(next)
      })
      .catch(() => {
        // A count that could not be read keeps the tab waiting, which the listing it opens says
      })

    return () => {
      active = false
    }
  }, [terms])

  // The tab the reader opened is the one shown: what the listing it names was narrowed by, and the
  // page of it the reader was on, belong to the tab they were set on, so opening a tab starts the
  // listing of that tab over. The default tab is left out of the query string, the way the orders
  // of the listings are, and the terms the search was made with are kept. A tab is a place the
  // reader can come back to, so it is added to the history the way a route is
  function changeTab(nextTab: SearchTab) {
    void clearListings(null)
    void setTab(nextTab, { history: 'push' })
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Text className={styles.eyebrow}>{t('search.eyebrow')}</Text>
          <Title order={1}>{t('search.title')}</Title>
          <Text c='dimmed'>{t('search.resultsFor', { query: terms })}</Text>
        </div>
      </header>

      <Tabs mb='lg' value={tab} onChange={(value) => changeTab(searchTab(value))}>
        <Tabs.List>
          <Tabs.Tab
            value='apps'
            rightSection={
              <CountBadge count={counts.apps ?? undefined} loading={counts.apps === null} />
            }
          >
            {t('common.apps')}
          </Tabs.Tab>
          <Tabs.Tab
            value='pkgs'
            rightSection={
              <CountBadge count={counts.pkgs ?? undefined} loading={counts.pkgs === null} />
            }
          >
            {t('common.packages')}
          </Tabs.Tab>
          <Tabs.Tab
            value='repos'
            rightSection={
              <CountBadge count={counts.repos ?? undefined} loading={counts.repos === null} />
            }
          >
            {t('common.repositories')}
          </Tabs.Tab>
          <Tabs.Tab
            value='distros'
            rightSection={
              <CountBadge count={counts.distros ?? undefined} loading={counts.distros === null} />
            }
          >
            {t('common.distributions')}
          </Tabs.Tab>
        </Tabs.List>

        {/* Only the listing of the tab that is shown is mounted, and what each tab holds is the
            count the page reads for it */}
        <Tabs.Panel pt='lg' value='apps'>
          <AppList
            emptyMessage={t('common.appsNotFound')}
            errorMessage={t('search.loadError')}
            load={readApps}
          />
        </Tabs.Panel>

        <Tabs.Panel pt='lg' value='pkgs'>
          <PkgList
            emptyMessage={t('common.packagesNotFound')}
            errorMessage={t('search.loadPackagesError')}
            load={readPkgs}
          />
        </Tabs.Panel>

        <Tabs.Panel pt='lg' value='repos'>
          <RepoTable
            emptyMessage={t('repos.searchEmpty')}
            errorMessage={t('search.loadReposError')}
            hideFilters
            load={readRepos}
            onRowClick={(repo) => navigate(`/repos/${repo.id}`)}
          />
        </Tabs.Panel>

        <Tabs.Panel pt='lg' value='distros'>
          <DistroTable
            emptyMessage={t('distros.searchEmpty')}
            errorMessage={t('search.loadDistrosError')}
            hideFilters
            load={readDistros}
            onRowClick={(distro) => navigate(`/distros/${distro.id}`)}
          />
        </Tabs.Panel>
      </Tabs>
    </main>
  )
}
