import { useLocalStorage } from '@guoyunhe/react-storage'
import { Button, Group } from '@mantine/core'
import { XIcon } from '@phosphor-icons/react/X'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { PkgFilters as PkgFiltersValue } from '../services/apps'
import { getDistros, type Distro } from '../services/distros'
import { packageTypes } from '../utils/pkgTypes'
import ArchSelect from './ArchSelect'
import DistroSelect from './DistroSelect'
import ListFilter from './ListFilter'

const storageKey = 'pkg-filters'
const emptyFilters: PkgFiltersValue = { distroId: null, type: null, arch: null }

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
 * one release for one architecture, and the packages it serves are the ones its repositories hold
 * for that architecture.
 */
export default function PkgFilters({ value, onChange }: PkgFiltersProps) {
  const { t } = useTranslation()
  const [distros, setDistros] = useState<Distro[]>([])

  useEffect(() => {
    let active = true
    getDistros()
      .then((result) => {
        if (!active) return
        // A release that ships no native package is served by no repository of packages
        setDistros(result.filter((distro) => distro.pkgType))
      })
      .catch(() => {
        // Without options the filters stay empty, which is the same as having no filter
      })
    return () => {
      active = false
    }
  }, [])

  const hasFilters = value.distroId !== null || value.type !== null || value.arch !== null

  return (
    <Group align='flex-end' gap='sm' mb='lg'>
      <DistroSelect
        distros={distros}
        label={t('common.distribution')}
        onChange={(distroId) => onChange({ ...value, distroId })}
        placeholder={t('packages.filterAny')}
        searchable
        value={value.distroId}
      />
      <ArchSelect
        label={t('common.architecture')}
        onChange={(arch) => onChange({ ...value, arch })}
        placeholder={t('packages.filterAny')}
        searchable
        value={value.arch}
      />
      <ListFilter
        data={packageTypes.map((type) => ({ label: type, value: type }))}
        label={t('common.packageFormat')}
        onChange={(type) => onChange({ ...value, type })}
        placeholder={t('packages.filterAny')}
        value={value.type}
        width={160}
      />
      {hasFilters && (
        <Button
          leftSection={<XIcon size={16} />}
          onClick={() => onChange(emptyFilters)}
          variant='subtle'
        >
          {t('common.clearFilters')}
        </Button>
      )}
    </Group>
  )
}
