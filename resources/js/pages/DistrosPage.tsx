import { Alert, Button, Group, Loader, Pagination, Select, Table, Text, Title } from '@mantine/core'
import { PlusIcon } from '@phosphor-icons/react/Plus'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useSearchParams } from 'wouter'

import { useAuth } from '../auth'
import ArchSelect from '../components/ArchSelect'
import DistroRelease from '../components/DistroRelease'
import {
  distroSort,
  distroSorts,
  getDistros,
  type Distro,
  type DistroSort,
} from '../services/distros'
import type { Paginated } from '../types/pagination'
import { formatCount, formatDate } from '../utils/format'

import styles from './DistrosPage.module.css'

export default function DistrosPage() {
  const { t, i18n } = useTranslation()
  const { ready, user } = useAuth()
  const [, navigate] = useLocation()
  const [searchParams] = useSearchParams()
  const isAdmin = ready && user?.role === 'admin'
  // The sort order is read by the API, so it is kept in the URL and the listing is re-read for it
  const sort = distroSort(searchParams.get('sort'))

  const [archFilter, setArchFilter] = useState<string | null>(null)
  const [result, setResult] = useState<Paginated<Distro> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // What the listing is read by — the order its URL keeps, the architecture it is narrowed to and
  // the page the reader was left on — held in one state object rather than three, because a
  // function handed to `useState` is read as an updater and would be called with the previous state
  const [listing, setListing] = useState({ arch: archFilter, page: 1, sort })

  // Another order, or another architecture, starts the listing over: the page the reader was left on
  // belongs to the listing it was read from. It is adjusted while rendering, so that the first page
  // is read instead of the page the previous listing was left on
  if (listing.arch !== archFilter || listing.sort !== sort) {
    setListing({ arch: archFilter, page: 1, sort })
  }

  useEffect(() => {
    let active = true

    setLoading(true)
    setError(null)
    getDistros(listing.sort, { arch: listing.arch }, listing.page)
      .then((distroPage) => {
        if (active) setResult(distroPage)
      })
      .catch((reason) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : t('distros.loadError'))
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [listing, t])

  function distrosUrl(nextSort: DistroSort) {
    return nextSort === 'name' ? '/distros' : `/distros?sort=${nextSort}`
  }

  function isExpired(distro: Distro) {
    if (!distro.eolDate) return false
    const date = new Date(distro.eolDate)
    return !Number.isNaN(date.getTime()) && date.getTime() < Date.now()
  }

  // The architecture is read by the API, so the toolbar stays where it is while another page is
  // read — the page does not move under the reader — and a listing the filter narrowed keeps it, so
  // that what was set can be taken back
  const showToolbar = result === null || result.meta.total > 0 || archFilter !== null

  // An empty catalog is a different thing from a filter that matches nothing, which the count the
  // listing reports tells apart — a page beyond the last one holds no row either
  const emptyMessage =
    result !== null && result.meta.total === 0 && archFilter !== null
      ? t('distros.filterEmpty')
      : t('distros.notFound')

  // Every order is shared with the listing it names, so no label lives in the distributions section
  const sortLabels: Record<DistroSort, string> = {
    apps: t('common.apps'),
    name: t('common.name'),
    packages: t('common.packages'),
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Text className={styles.eyebrow}>{t('common.administration')}</Text>
          <Title order={1}>{t('common.distributions')}</Title>
          <Text c='dimmed'>{t('distros.subtitle')}</Text>
        </div>
        {isAdmin && (
          <Button
            component={Link}
            href='/distros/new'
            leftSection={<PlusIcon size={18} weight='bold' />}
          >
            {t('distros.addDistro')}
          </Button>
        )}
      </header>

      {error && (
        <Alert color='red' mb='lg'>
          {error}
        </Alert>
      )}
      {showToolbar && (
        <Group align='flex-end' gap='sm' mb='lg'>
          <ArchSelect
            label={t('common.architecture')}
            onChange={setArchFilter}
            placeholder={t('distros.filterAny')}
            value={archFilter}
          />
          <Select
            allowDeselect={false}
            data={distroSorts.map((value) => ({ value, label: sortLabels[value] }))}
            label={t('common.sortBy')}
            onChange={(nextSort) => navigate(distrosUrl(distroSort(nextSort)))}
            value={sort}
            w={180}
          />
        </Group>
      )}
      {loading ? (
        <div className={styles.loading}>
          <Loader color='orange' />
        </div>
      ) : !result || result.data.length === 0 ? (
        <Text c='dimmed'>{emptyMessage}</Text>
      ) : (
        <>
          <Table className={styles.table} highlightOnHover verticalSpacing='sm'>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('common.distribution')}</Table.Th>
                <Table.Th>{t('common.architecture')}</Table.Th>
                <Table.Th>{t('common.packageFormat')}</Table.Th>
                <Table.Th>{t('distros.columns.compatible')}</Table.Th>
                <Table.Th align='right'>{t('common.packages')}</Table.Th>
                <Table.Th align='right'>{t('common.apps')}</Table.Th>
                <Table.Th>{t('distros.columns.releaseDate')}</Table.Th>
                <Table.Th>{t('distros.columns.eolDate')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {result.data.map((distro) => (
                <Table.Tr
                  className={styles.row}
                  key={distro.id}
                  onClick={() => navigate(`/distros/${distro.id}`)}
                >
                  <Table.Td>
                    <DistroRelease distro={distro} />
                  </Table.Td>
                  <Table.Td>{distro.arch}</Table.Td>
                  <Table.Td>
                    <span className={styles.pkgType}>{distro.pkgType ?? '—'}</span>
                  </Table.Td>
                  <Table.Td>
                    {distro.compatibleDistro ? (
                      <DistroRelease arch={distro.arch} distro={distro.compatibleDistro} />
                    ) : (
                      '—'
                    )}
                  </Table.Td>
                  <Table.Td align='right'>{formatCount(distro.pkgCount, i18n.language)}</Table.Td>
                  <Table.Td align='right'>{formatCount(distro.appCount, i18n.language)}</Table.Td>
                  <Table.Td>
                    {distro.releaseDate ? formatDate(distro.releaseDate, i18n.language) : '—'}
                  </Table.Td>
                  <Table.Td>
                    {distro.eolDate ? (
                      <span className={isExpired(distro) ? styles.expired : undefined}>
                        {formatDate(distro.eolDate, i18n.language)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          {result.meta.lastPage > 1 && (
            <Pagination
              className={styles.pagination}
              total={result.meta.lastPage}
              value={result.meta.currentPage}
              onChange={(page) => setListing({ ...listing, page })}
            />
          )}
        </>
      )}
    </main>
  )
}
