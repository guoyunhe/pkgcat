import { Alert, Button, Group, Loader, Select, Table, Text, Title } from '@mantine/core'
import { PlusIcon } from '@phosphor-icons/react/Plus'
import { useEffect, useMemo, useState } from 'react'
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

  const [distros, setDistros] = useState<Distro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // One release is an entry per architecture, so the same release appears as many times as it is
  // published for; the architectures of the loaded entries become the options that narrow it down
  const [archFilter, setArchFilter] = useState<string | null>(null)

  async function loadDistros() {
    try {
      setLoading(true)
      setDistros(await getDistros(sort))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('distros.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDistros()
  }, [sort])

  function distrosUrl(nextSort: DistroSort) {
    return nextSort === 'name' ? '/distros' : `/distros?sort=${nextSort}`
  }

  function isExpired(distro: Distro) {
    if (!distro.eolDate) return false
    const date = new Date(distro.eolDate)
    return !Number.isNaN(date.getTime()) && date.getTime() < Date.now()
  }

  // The list arrives complete and small, so the filter only narrows what is already loaded, and the
  // order the API returns — a distribution's releases together, newest first — is left untouched
  const visibleDistros = useMemo(
    () => (archFilter === null ? distros : distros.filter((distro) => distro.arch === archFilter)),
    [archFilter, distros],
  )

  // An empty list is a different thing from a filter that matches nothing
  const emptyMessage = distros.length === 0 ? t('distros.notFound') : t('distros.filterEmpty')

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Text className={styles.eyebrow}>{t('distros.eyebrow')}</Text>
          <Title order={1}>{t('distros.title')}</Title>
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
      {!loading && distros.length > 0 && (
        <Group align='flex-end' mb='lg'>
          <ArchSelect
            label={t('distros.filterArch')}
            onChange={setArchFilter}
            placeholder={t('distros.filterAny')}
            value={archFilter}
          />
          <Select
            allowDeselect={false}
            data={distroSorts.map((value) => ({ value, label: t(`distros.sort.${value}`) }))}
            label={t('distros.sort.label')}
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
      ) : visibleDistros.length === 0 ? (
        <Text c='dimmed'>{emptyMessage}</Text>
      ) : (
        <Table className={styles.table} highlightOnHover verticalSpacing='sm'>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('distros.columns.name')}</Table.Th>
              <Table.Th>{t('distros.columns.arch')}</Table.Th>
              <Table.Th>{t('distros.columns.pkgType')}</Table.Th>
              <Table.Th>{t('distros.columns.compatible')}</Table.Th>
              <Table.Th>{t('distros.columns.packages')}</Table.Th>
              <Table.Th>{t('distros.columns.apps')}</Table.Th>
              <Table.Th>{t('distros.columns.releaseDate')}</Table.Th>
              <Table.Th>{t('distros.columns.eolDate')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {visibleDistros.map((distro) => (
              <Table.Tr
                className={styles.row}
                key={distro.id}
                onClick={() => navigate(`/distros/${distro.id}`)}
              >
                <Table.Td>
                  <DistroRelease distro={distro} />
                </Table.Td>
                <Table.Td>
                  <span className={styles.arch}>{distro.arch}</span>
                </Table.Td>
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
                <Table.Td>
                  <Text size='sm'>{formatCount(distro.pkgCount, i18n.language)}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size='sm'>{formatCount(distro.appCount, i18n.language)}</Text>
                </Table.Td>
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
      )}
    </main>
  )
}
