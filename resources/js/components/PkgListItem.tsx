import type { Data } from '@generated/data'
import { Button, Group, Text, Title } from '@mantine/core'
import { DownloadSimpleIcon } from '@phosphor-icons/react/DownloadSimple'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'wouter'

import { localized } from '../utils/appstream'
import { pkgDownloadUrl } from '../utils/pkgs'

import styles from './PkgListItem.module.css'

const packageTypesWithIcons = new Set(['rpm', 'deb', 'pacman', 'appimage'])

type PkgListItemProps = {
  pkg: Data.Pkg
  /** Extra controls rendered after the download button, such as the admin actions. */
  actions?: ReactNode
  /** Render the longer package details (license and install command). */
  showDetails?: boolean
}

/** A single package row: type icon, name, summary, metadata and the download (plus extra) actions. */
export default function PkgListItem({ pkg, actions, showDetails = false }: PkgListItemProps) {
  const { t, i18n } = useTranslation()
  const downloadUrl = pkgDownloadUrl(pkg)

  return (
    <article className={styles.pkgItem}>
      {packageTypesWithIcons.has(pkg.type) ? (
        <img alt='' className={styles.pkgTypeIcon} src={`/packages/${pkg.type}.svg`} />
      ) : (
        <div className={styles.pkgTypeIcon} />
      )}
      <div className={styles.copy}>
        <Title order={3}>
          {/* The package has a page of its own, which the lists it appears in all link to */}
          <Link className={styles.link} href={`/pkgs/${pkg.id}`}>
            {pkg.name}
          </Link>
        </Title>
        <div className={styles.meta}>
          <span>{pkg.type}</span>
          {pkg.version && <span>{pkg.version}</span>}
          {pkg.release && <span>{pkg.release}</span>}
          {pkg.arch && <span>{pkg.arch}</span>}
          {showDetails && pkg.license && <span>{pkg.license}</span>}
          {/* A package provides every application it ships metadata for */}
          {pkg.apps.map((app) => (
            <Link className={styles.appLink} href={`/apps/${app.id}`} key={app.id}>
              {localized(app.name, i18n.language) ?? String(app.id)}
            </Link>
          ))}
        </div>
        {pkg.summary && (
          <Text c='dimmed' className={styles.summary} size='sm'>
            {pkg.summary}
          </Text>
        )}
        {showDetails && pkg.installCommand && (
          <Text className={styles.installCommand} component='code' size='sm'>
            {pkg.installCommand}
          </Text>
        )}
      </div>
      <Group gap='xs'>
        {downloadUrl && (
          <Button
            component='a'
            href={downloadUrl}
            leftSection={<DownloadSimpleIcon size={16} />}
            rel='noreferrer'
            size='xs'
            target='_blank'
            variant='default'
          >
            {t('common.download')}
          </Button>
        )}
        {actions}
      </Group>
    </article>
  )
}
