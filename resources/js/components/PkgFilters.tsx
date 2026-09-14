import { useLocalStorage } from '@guoyunhe/react-storage'
import { Button, Group, Select } from '@mantine/core'
import { XIcon } from '@phosphor-icons/react/X'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { PkgFilters as PkgFiltersValue } from '../services/apps'
import { distroLabel, getDistros } from '../services/distros'
import { packageTypes } from '../utils/pkgTypes'

import styles from './PkgFilters.module.css'

const storageKey = 'pkg-filters'
const emptyFilters: PkgFiltersValue = { distroId: null, type: null, arch: null }

type DistroOption = {
  value: string
  label: string
  icon: string
}

function distroIcon(name: string) {
  return `/distros/${encodeURIComponent(name)}.svg`
}

/**
 * Filters are remembered across visits, but older shapes (distributions by name, or lists from when
 * multi selection was supported) fall back to "no filter".
 */
function parseFilters(raw: string) {
  try {
    const value = JSON.parse(raw) as Partial<PkgFiltersValue>
    return {
      distroId: typeof value.distroId === 'string' ? value.distroId : null,
      type: typeof value.type === 'string' ? value.type : null,
      arch: typeof value.arch === 'string' ? value.arch : null,
    }
  } catch {
    return emptyFilters
  }
}

/**
 * The selected filters are remembered in the local storage, so the stored value is also what the
 * first query uses.
 */
export function useStoredPkgFilters() {
  return useLocalStorage<PkgFiltersValue>(storageKey, emptyFilters, { parser: parseFilters })
}

type PkgFiltersProps = {
  value: PkgFiltersValue
  onChange: (value: PkgFiltersValue) => void
}

/**
 * Distribution, package format and architecture filters for the package listings. A distribution is
 * one release for one architecture, and packages are matched against the package format and the
 * architecture of that entry.
 */
export default function PkgFilters({ value, onChange }: PkgFiltersProps) {
  const { t } = useTranslation()
  const [distros, setDistros] = useState<DistroOption[]>([])
  const [archs, setArchs] = useState<string[]>([])

  useEffect(() => {
    let active = true
    getDistros()
      .then((result) => {
        if (!active) return
        // Only distributions with a native package format can match packages
        const filterable = result
          .filter((distro) => distro.pkgType)
          .sort(
            (a, b) =>
              a.name.localeCompare(b.name) ||
              (a.version ?? '').localeCompare(b.version ?? '', undefined, { numeric: true }) ||
              a.arch.localeCompare(b.arch),
          )
        setDistros(
          filterable.map((distro) => ({
            value: String(distro.id),
            label: distroLabel(distro),
            icon: distroIcon(distro.name),
          })),
        )
        setArchs([...new Set(result.map((distro) => distro.arch))].sort())
      })
      .catch(() => {
        // Without options the filters stay empty, which is the same as having no filter
      })
    return () => {
      active = false
    }
  }, [])

  const selectedDistro = distros.find((distro) => distro.value === value.distroId)
  const hasFilters = value.distroId !== null || value.type !== null || value.arch !== null

  return (
    <Group align='flex-end' gap='sm' mb='lg'>
      <Select
        clearable
        data={distros}
        label={t('packages.filterDistro')}
        leftSection={
          selectedDistro ? <img alt='' className={styles.icon} src={selectedDistro.icon} /> : null
        }
        onChange={(distroId) => onChange({ ...value, distroId })}
        placeholder={t('packages.filterAny')}
        renderOption={({ option }) => (
          <Group gap='xs' wrap='nowrap'>
            <img alt='' className={styles.icon} src={(option as DistroOption).icon} />
            <span>{option.label}</span>
          </Group>
        )}
        searchable
        value={value.distroId}
        w={240}
      />
      <Select
        clearable
        data={archs}
        label={t('packages.filterArch')}
        onChange={(arch) => onChange({ ...value, arch })}
        placeholder={t('packages.filterAny')}
        searchable
        value={value.arch}
        w={240}
      />
      <Select
        clearable
        data={packageTypes}
        label={t('packages.filterType')}
        onChange={(type) => onChange({ ...value, type })}
        placeholder={t('packages.filterAny')}
        value={value.type}
        w={160}
      />
      {hasFilters && (
        <Button
          leftSection={<XIcon size={16} />}
          onClick={() => onChange(emptyFilters)}
          variant='subtle'
        >
          {t('packages.filterClear')}
        </Button>
      )}
    </Group>
  )
}
