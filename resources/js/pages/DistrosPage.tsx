import { Button, Container, Select, Text, Title } from '@mantine/core'
import { PlusIcon } from '@phosphor-icons/react/Plus'
import { parseAsInteger, parseAsStringLiteral, useQueryStates } from 'nuqs'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'wouter'

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
  const isAdmin = ready && user?.role === 'admin'
  // The sort order is read by the API, so it is kept in the query string and the listing is re-read
  // for it — as no order of its own when it is the one the listing starts at. The page of the
  // listing belongs to the table, so it is cleared here: another order reads the first page of the
  // listing again, the way another narrowing does
  const [{ sort }, setListingParams] = useQueryStates({
    page: parseAsInteger,
    sort: parseAsStringLiteral(distroSorts).withDefault('name'),
  })

  // The order the listing is read in is kept in the query string, and so is the architecture the
  // table narrows it to: both are read by the API, so a change of either reads the first page of
  // the listing again
  const loadDistros = useCallback(
    (page: number, filters: DistroFilters) => getDistros(sort, filters, page),
    [sort],
  )

  // Every order is shared with the listing it names, so no label lives in the distributions section
  const sortLabels: Record<DistroSort, string> = {
    apps: t('common.apps'),
    name: t('common.name'),
    packages: t('common.packages'),
    users: t('common.users'),
  }

  return (
    <Container component='main' py={{ base: 44, xs: 72 }} size='lg'>
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
            {t('common.add')}
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
            onChange={(nextSort) =>
              void setListingParams({ page: null, sort: distroSort(nextSort) })
            }
            value={sort}
            w={filterWidth}
          />
        }
        load={loadDistros}
        onRowClick={(distro) => navigate(`/distros/${distro.id}`)}
      />
    </Container>
  )
}
