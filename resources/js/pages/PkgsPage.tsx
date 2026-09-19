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

  const readPkgs = useCallback(
    (page: number, filters: PkgFilters) => getPkgs('', page, filters),
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
            {t('common.add')}
          </Button>
        )}
      </header>

      <PkgList emptyMessage={t('common.packagesNotFound')} load={readPkgs} rememberFilters />
    </main>
  )
}
