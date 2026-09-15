import { Button, Select, Text, Title } from '@mantine/core'
import { PlusIcon } from '@phosphor-icons/react/Plus'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useSearchParams } from 'wouter'

import { useAuth } from '../auth'
import DistroTable from '../components/DistroTable'
import { filterWidth } from '../components/ListFilter'
import {
  distroSort,
  distroSorts,
  getDistros,
  type DistroFilters,
  type DistroSort,
} from '../services/distros'

import styles from './DistrosPage.module.css'

export default function DistrosPage() {
  const { t } = useTranslation()
  const { ready, user } = useAuth()
  const [, navigate] = useLocation()
  const [searchParams] = useSearchParams()
  const isAdmin = ready && user?.role === 'admin'
  // The sort order is read by the API, so it is kept in the URL and the listing is re-read for it
  const sort = distroSort(searchParams.get('sort'))

  // The order the listing is read in is kept in the URL, and the architecture the table narrows it
  // to is held by the table itself: both are read by the API, so a change of either reads the first
  // page of the listing again
  const loadDistros = useCallback(
    (page: number, filters: DistroFilters) => getDistros(sort, filters, page),
    [sort],
  )

  function distrosUrl(nextSort: DistroSort) {
    return nextSort === 'name' ? '/distros' : `/distros?sort=${nextSort}`
  }

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

      <DistroTable
        emptyMessage={t('distros.notFound')}
        extraFilters={
          <Select
            allowDeselect={false}
            data={distroSorts.map((value) => ({ value, label: sortLabels[value] }))}
            label={t('common.sortBy')}
            onChange={(nextSort) => navigate(distrosUrl(distroSort(nextSort)))}
            value={sort}
            w={filterWidth}
          />
        }
        load={loadDistros}
        onRowClick={(distro) => navigate(`/distros/${distro.id}`)}
      />
    </main>
  )
}
