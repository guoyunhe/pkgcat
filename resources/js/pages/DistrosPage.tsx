import { Alert, Button, Loader, Table, Text, Title } from '@mantine/core'
import { PencilSimpleIcon } from '@phosphor-icons/react/PencilSimple'
import { PlusIcon } from '@phosphor-icons/react/Plus'
import { TrashIcon } from '@phosphor-icons/react/Trash'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'wouter'

import { useAuth } from '../auth'
import { deleteDistro, getDistros, type Distro } from '../services/distros'

import styles from './DistrosPage.module.css'

/** Lucid serializes `date` columns as a UTC ISO string; format it without timezone drift. */
function formatDate(value: string, language: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeZone: 'UTC' }).format(date)
}

export default function DistrosPage() {
  const { t, i18n } = useTranslation()
  const { ready, user } = useAuth()
  const [, navigate] = useLocation()
  const isAdmin = ready && user?.role === 'admin'

  const [distros, setDistros] = useState<Distro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadDistros() {
    try {
      setLoading(true)
      setDistros(await getDistros())
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('distros.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDistros()
  }, [])

  async function remove(distro: Distro) {
    const label = distro.version ? `${distro.name} ${distro.version}` : distro.name
    if (!window.confirm(t('distros.confirmDelete', { name: label }))) return
    try {
      await deleteDistro(distro.id)
      setDistros((current) => current.filter((item) => item.id !== distro.id))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('distros.deleteError'))
    }
  }

  function isExpired(distro: Distro) {
    if (!distro.eolDate) return false
    const date = new Date(distro.eolDate)
    return !Number.isNaN(date.getTime()) && date.getTime() < Date.now()
  }

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
      {loading ? (
        <div className={styles.loading}>
          <Loader color='orange' />
        </div>
      ) : distros.length === 0 ? (
        <Text c='dimmed'>{t('distros.notFound')}</Text>
      ) : (
        <Table className={styles.table} highlightOnHover verticalSpacing='sm'>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('distros.columns.name')}</Table.Th>
              <Table.Th>{t('distros.columns.version')}</Table.Th>
              <Table.Th>{t('distros.columns.pkgType')}</Table.Th>
              <Table.Th>{t('distros.columns.arch')}</Table.Th>
              <Table.Th>{t('distros.columns.releaseDate')}</Table.Th>
              <Table.Th>{t('distros.columns.eolDate')}</Table.Th>
              {isAdmin && <Table.Th />}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {distros.map((distro) => (
              <Table.Tr
                className={isAdmin ? styles.clickableRow : styles.row}
                key={distro.id}
                onClick={() => {
                  if (isAdmin) navigate(`/distros/${distro.id}/edit`)
                }}
              >
                <Table.Td>
                  <span className={styles.nameCell}>
                    <img
                      alt=''
                      className={styles.distroIcon}
                      src={`/distros/${encodeURIComponent(distro.name)}.svg`}
                    />
                    <span className={styles.name}>{distro.name}</span>
                  </span>
                </Table.Td>
                <Table.Td>{distro.version ?? '∞'}</Table.Td>
                <Table.Td>
                  <span className={styles.pkgType}>{distro.pkgType ?? '—'}</span>
                </Table.Td>
                <Table.Td>
                  <span className={styles.archs}>
                    {distro.arch.length > 0 ? distro.arch.join(', ') : '—'}
                  </span>
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
                {isAdmin && (
                  <Table.Td>
                    <div className={styles.actions} onClick={(event) => event.stopPropagation()}>
                      <Button
                        aria-label={t('distros.edit')}
                        component={Link}
                        href={`/distros/${distro.id}/edit`}
                        size='xs'
                        variant='subtle'
                      >
                        <PencilSimpleIcon size={16} />
                      </Button>
                      <Button
                        aria-label={t('distros.delete')}
                        color='red'
                        size='xs'
                        variant='subtle'
                        onClick={() => void remove(distro)}
                      >
                        <TrashIcon size={16} />
                      </Button>
                    </div>
                  </Table.Td>
                )}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </main>
  )
}
