import { Button, Text, Title } from '@mantine/core'
import { PlusIcon } from '@phosphor-icons/react/Plus'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'wouter'

import { useAuth } from '../auth'
import PkgList from '../components/PkgList'
import { getPkgs, type PkgFilters } from '../services/pkgs'

import styles from './AppsPage.module.css'

export default function PkgsPage() {
  const { t, i18n } = useTranslation()
  const { ready, user } = useAuth()
  const isAdmin = ready && user?.role === 'admin'
  // The listing the filters in its toolbar name, which the list reads one page of at a time
  const readPkgs = useCallback(
    (page: number, filters: PkgFilters) => getPkgs('', page, filters, i18n.language),
    [i18n.language],
  )

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Text className={styles.eyebrow}>{t('common.linuxCatalog')}</Text>
          <Title order={1}>{t('common.packages')}</Title>
          <Text c='dimmed'>{t('packages.subtitle')}</Text>
        </div>
        {isAdmin && (
          <Button
            component={Link}
            href='/pkgs/new'
            leftSection={<PlusIcon size={18} weight='bold' />}
          >
            {t('common.addPackage')}
          </Button>
        )}
      </header>

      {/* A package is edited and deleted on its own page, which the title of its row opens; the
          filters of the toolbar are kept in the query string and remembered for a later visit */}
      <PkgList emptyMessage={t('common.packagesNotFound')} load={readPkgs} rememberFilters />
    </main>
  )
}
