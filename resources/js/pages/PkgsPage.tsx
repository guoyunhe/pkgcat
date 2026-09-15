import type { Data } from '@generated/data'
import { Alert, Button, Text, Title } from '@mantine/core'
import { PencilSimpleIcon } from '@phosphor-icons/react/PencilSimple'
import { PlusIcon } from '@phosphor-icons/react/Plus'
import { TrashIcon } from '@phosphor-icons/react/Trash'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'wouter'

import { useAuth } from '../auth'
import PkgList from '../components/PkgList'
import { deletePkg, getPkgs, type PkgFilters } from '../services/pkgs'

import styles from './AppsPage.module.css'

export default function PkgsPage() {
  const { t, i18n } = useTranslation()
  const { ready, user } = useAuth()
  const isAdmin = ready && user?.role === 'admin'
  const [error, setError] = useState<string | null>(null)
  const [refresh, setRefresh] = useState(0)
  // The listing the filters in its toolbar name, which the list reads one page of at a time
  const readPkgs = useCallback(
    (page: number, filters: PkgFilters) => getPkgs('', page, filters, i18n.language),
    [i18n.language],
  )

  async function remove(pkg: Data.Pkg) {
    if (!window.confirm(t('packages.deleteConfirm', { name: pkg.name }))) return
    try {
      await deletePkg(pkg.id)
      setRefresh((value) => value + 1)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('packages.deleteError'))
    }
  }

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

      {error && (
        <Alert color='red' mb='lg'>
          {error}
        </Alert>
      )}
      <PkgList
        emptyMessage={t('common.packagesNotFound')}
        load={readPkgs}
        refreshKey={refresh}
        renderActions={
          isAdmin
            ? (pkg) => (
                <>
                  <Button
                    aria-label={t('packages.editPackage')}
                    component={Link}
                    href={`/pkgs/${pkg.id}/edit`}
                    size='xs'
                    variant='subtle'
                  >
                    <PencilSimpleIcon size={16} />
                  </Button>
                  <Button
                    aria-label={t('common.delete')}
                    color='red'
                    size='xs'
                    variant='subtle'
                    onClick={() => void remove(pkg)}
                  >
                    <TrashIcon size={16} />
                  </Button>
                </>
              )
            : undefined
        }
      />
    </main>
  )
}
