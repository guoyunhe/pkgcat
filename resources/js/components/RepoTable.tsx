import type { Data } from '@generated/data'
import { Table, Text } from '@mantine/core'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import styles from './RepoTable.module.css'

const packageTypesWithIcons = new Set(['deb', 'rpm'])

/** Counts run into the hundreds of thousands, so they are grouped the way the locale does it. */
function formatCount(value: number, language: string) {
  return new Intl.NumberFormat(language).format(value)
}

type RepoTableProps = {
  repos: Data.Repo[]
  /**
   * Releases every row serves. A page that lists the repositories of one release — its own detail
   * page — already says which release that is, so it leaves the column out.
   */
  showDistros?: boolean
  /** Admin controls of a row, such as its edit and delete buttons; without them there is no column. */
  renderActions?: (repo: Data.Repo) => ReactNode
  /** What clicking a row opens, usually the editor; rows that open nothing are plain text. */
  onRowClick?: (repo: Data.Repo) => void
}

/** Table of repositories, shared by the repository listing and the detail page of a release. */
export default function RepoTable({
  repos,
  showDistros = true,
  renderActions,
  onRowClick,
}: RepoTableProps) {
  const { t, i18n } = useTranslation()

  function formatDate(value: string | null) {
    if (!value) return t('repos.neverSynced')
    return new Intl.DateTimeFormat(i18n.language, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  }

  return (
    <Table className={styles.table} highlightOnHover verticalSpacing='sm'>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>{t('common.packageFormat')}</Table.Th>
          <Table.Th>{t('common.source')}</Table.Th>
          <Table.Th>{t('common.repository')}</Table.Th>
          {showDistros && <Table.Th>{t('common.distributions')}</Table.Th>}
          <Table.Th>{t('common.packages')}</Table.Th>
          <Table.Th>{t('common.apps')}</Table.Th>
          <Table.Th>{t('repos.columns.syncInterval')}</Table.Th>
          <Table.Th>{t('repos.columns.lastSynced')}</Table.Th>
          {renderActions && <Table.Th />}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {repos.map((repo) => (
          <Table.Tr
            className={onRowClick ? styles.clickableRow : styles.row}
            key={repo.id}
            onClick={() => onRowClick?.(repo)}
          >
            <Table.Td>
              <span className={styles.typeCell}>
                {packageTypesWithIcons.has(repo.type) && (
                  <img alt='' className={styles.typeIcon} src={`/packages/${repo.type}.svg`} />
                )}
                {repo.type}
              </span>
            </Table.Td>
            <Table.Td>
              <Text size='sm' c='dimmed'>
                {/* A source the interface does not know is still named by the value it was stored as */}
                {t(`repos.sources.${repo.source}`, { defaultValue: repo.source })}
              </Text>
            </Table.Td>
            <Table.Td>
              <div className={styles.name}>{repo.name}</div>
              <div className={styles.baseUrl}>{repo.baseUrl}</div>
            </Table.Td>
            {showDistros && (
              <Table.Td>
                {repo.distros.length === 0 ? (
                  '—'
                ) : (
                  <div className={styles.distrosCell}>
                    {repo.distros.map((distro) => (
                      <span className={styles.distroCell} key={distro.id}>
                        <img
                          alt=''
                          className={styles.distroIcon}
                          src={`/distros/${encodeURIComponent(distro.name)}.svg`}
                        />
                        <span>{distro.name}</span>
                        {distro.version && (
                          <span className={styles.distroVersion}>{distro.version}</span>
                        )}
                        <span className={styles.distroArch}>{distro.arch}</span>
                      </span>
                    ))}
                  </div>
                )}
              </Table.Td>
            )}
            <Table.Td>
              <Text size='sm'>{formatCount(repo.pkgCount, i18n.language)}</Text>
            </Table.Td>
            <Table.Td>
              <Text size='sm'>{formatCount(repo.appCount, i18n.language)}</Text>
            </Table.Td>
            <Table.Td>
              {repo.syncIntervalDays
                ? t('repos.everyDays', { count: repo.syncIntervalDays })
                : t('repos.manual')}
            </Table.Td>
            <Table.Td>
              <Text size='sm' c='dimmed'>
                {formatDate(repo.lastSyncedAt)}
              </Text>
            </Table.Td>
            {renderActions && (
              <Table.Td>
                <div className={styles.actions} onClick={(event) => event.stopPropagation()}>
                  {renderActions(repo)}
                </div>
              </Table.Td>
            )}
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  )
}
