import type { Data } from '@generated/data'
import { Alert, Anchor, Badge, Button, Container, Group, Loader, Text, Title } from '@mantine/core'
import { ArrowLeftIcon } from '@phosphor-icons/react/ArrowLeft'
import { DownloadSimpleIcon } from '@phosphor-icons/react/DownloadSimple'
import { PencilSimpleIcon } from '@phosphor-icons/react/PencilSimple'
import { TrashIcon } from '@phosphor-icons/react/Trash'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useParams } from 'wouter'

import { useAuth } from '../auth'
import { deletePkg, getPkg } from '../services/pkgs'
import { localized } from '../utils/appstream'
import { formatBytes } from '../utils/format'
import { pkgDownloadUrl } from '../utils/pkgs'

import styles from './DetailPage.module.css'

/** The formats the catalog ships an icon for; a package of any other format shows no image. */
const packageTypesWithIcons = new Set(['rpm', 'deb', 'pacman', 'appimage'])

/**
 * Details of one package: what it is, where it comes from, what it holds and which applications it
 * provides — the same fields the package form edits, read as one page.
 */
export default function PkgDetailPage() {
  const { t, i18n } = useTranslation()
  const { ready, user } = useAuth()
  const [, navigate] = useLocation()
  const { id } = useParams()
  const pkgId = Number(id)
  const [pkg, setPkg] = useState<Data.Pkg | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!pkgId) {
      setError(t('packages.detail.invalidId'))
      return
    }
    // The names of the applications are read with every translation they have, so the page follows
    // a language switch without reading the package again
    getPkg(pkgId)
      .then(setPkg)
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : t('packages.detail.loadError')),
      )
  }, [pkgId, t])

  if (error) {
    return (
      <Container component='main' py={{ base: 32, xs: 56 }} size='md'>
        <Alert color='red'>{error}</Alert>
      </Container>
    )
  }
  if (!pkg || !ready) {
    return (
      <div className={styles.loading}>
        <Loader color='orange' />
      </div>
    )
  }

  const isAdmin = user?.role === 'admin'
  const downloadUrl = pkgDownloadUrl(pkg)
  // Everything that names the package at a glance, without the fields it may not carry
  const version = [pkg.type, pkg.version, pkg.release, pkg.arch].filter(Boolean).join(' · ')

  async function remove() {
    if (!pkg) return
    if (!window.confirm(t('packages.deleteConfirm', { name: pkg.name }))) return
    try {
      await deletePkg(pkg.id)
      navigate('/pkgs')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('packages.deleteError'))
    }
  }

  return (
    <Container component='main' py={{ base: 32, xs: 56 }} size='md'>
      <header className={styles.header}>
        <Button
          component={Link}
          href='/pkgs'
          leftSection={<ArrowLeftIcon size={18} />}
          variant='subtle'
        >
          {t('packages.detail.back')}
        </Button>
        <Group gap='xs'>
          {downloadUrl && (
            <Button
              component='a'
              href={downloadUrl}
              leftSection={<DownloadSimpleIcon size={18} />}
              rel='noreferrer'
              target='_blank'
              variant='default'
            >
              {t('common.download')}
            </Button>
          )}
          {isAdmin && (
            <>
              <Button
                component={Link}
                href={`/pkgs/${pkg.id}/edit`}
                leftSection={<PencilSimpleIcon size={18} />}
                variant='default'
              >
                {t('common.edit')}
              </Button>
              <Button
                color='red'
                leftSection={<TrashIcon size={18} />}
                variant='subtle'
                onClick={() => void remove()}
              >
                {t('common.delete')}
              </Button>
            </>
          )}
        </Group>
      </header>

      <section className={styles.intro}>
        {packageTypesWithIcons.has(pkg.type) ? (
          <img alt='' className={styles.icon} src={`/packages/${pkg.type}.svg`} />
        ) : (
          <div className={styles.icon} />
        )}
        <div>
          <Text className={styles.eyebrow}>{t('packages.detail.eyebrow')}</Text>
          <Title order={1}>{pkg.name}</Title>
          {version && <Text c='dimmed'>{version}</Text>}
          {pkg.summary && <Text mt='sm'>{pkg.summary}</Text>}
        </div>
      </section>

      <section className={styles.metadata}>
        <div>
          <Text size='sm' c='dimmed'>
            {t('common.packageFormat')}
          </Text>
          <Text className={styles.status}>{pkg.type}</Text>
        </div>
        <div>
          <Text size='sm' c='dimmed'>
            {t('common.version')}
          </Text>
          <Text>{pkg.version ?? t('common.notSpecified')}</Text>
        </div>
        <div>
          <Text size='sm' c='dimmed'>
            {t('packages.fields.release')}
          </Text>
          <Text>{pkg.release ?? t('common.notSpecified')}</Text>
        </div>
        <div>
          <Text size='sm' c='dimmed'>
            {t('common.architecture')}
          </Text>
          <Text>{pkg.arch ?? t('common.notSpecified')}</Text>
        </div>
        <div>
          <Text size='sm' c='dimmed'>
            {t('common.license')}
          </Text>
          <Text>{pkg.license ?? t('common.notSpecified')}</Text>
        </div>
        <div>
          <Text size='sm' c='dimmed'>
            {t('packages.detail.size')}
          </Text>
          <Text>
            {pkg.size === null ? t('common.notSpecified') : formatBytes(pkg.size, i18n.language)}
          </Text>
        </div>
        <div>
          <Text size='sm' c='dimmed'>
            {t('common.repository')}
          </Text>
          {pkg.repo ? (
            <Anchor component={Link} href={`/repos/${pkg.repo.id}`} className={styles.namedLink}>
              {pkg.repo.name}
            </Anchor>
          ) : (
            <Text>—</Text>
          )}
        </div>
      </section>

      {pkg.description && (
        <section className={styles.section}>
          <Title order={2}>{t('packages.fields.description')}</Title>
          <Text className={styles.code}>{pkg.description}</Text>
        </section>
      )}

      {pkg.installCommand && (
        <section className={styles.section}>
          <Title order={2}>{t('packages.fields.installCommand')}</Title>
          <Text className={styles.code} component='code'>
            {pkg.installCommand}
          </Text>
        </section>
      )}

      {pkg.checksum && (
        <section className={styles.section}>
          <Title order={2}>
            {pkg.checksumType
              ? `${t('packages.fields.checksum')} · ${pkg.checksumType}`
              : t('packages.fields.checksum')}
          </Title>
          <Text className={styles.code} component='code'>
            {pkg.checksum}
          </Text>
        </section>
      )}

      {pkg.downloadUrl && (
        <section className={styles.section}>
          <Title order={2}>{t('packages.fields.downloadUrl')}</Title>
          <Anchor href={pkg.downloadUrl} rel='noreferrer' target='_blank'>
            {pkg.downloadUrl}
          </Anchor>
        </section>
      )}

      <section className={styles.section}>
        <Title order={2}>{t('common.apps')}</Title>
        {pkg.apps.length === 0 ? (
          <Text c='dimmed'>{t('packages.detail.noApps')}</Text>
        ) : (
          // A package provides every application it ships AppStream metadata for
          <Group gap='xs' mt='sm'>
            {/* An application is named the way it spells itself, not the way a badge shouts */}
            {pkg.apps.map((app) => (
              <Badge
                component={Link}
                href={`/apps/${app.id}`}
                key={app.id}
                size='lg'
                tt='none'
                variant='light'
              >
                {localized(app.name, i18n.language) ?? String(app.id)}
              </Badge>
            ))}
          </Group>
        )}
      </section>
    </Container>
  )
}
