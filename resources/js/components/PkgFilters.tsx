import { useLocalStorage } from '@guoyunhe/react-storage'
import { Button, Group } from '@mantine/core'
import { XIcon } from '@phosphor-icons/react/X'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { getDistroCatalog, type Distro } from '../services/distros'
import type { PkgFilters as PkgFiltersValue } from '../services/pkgs'
import { packageTypes } from '../utils/pkgTypes'
import DistroSelect from './DistroSelect'
import ListFilter, { filterWidth } from './ListFilter'

const storageKey = 'pkg-filters'

/** Filters that narrow nothing, which a listing that shows no toolbar reads with. */
export const emptyPkgFilters: PkgFiltersValue = { distroId: null, type: null }

/**
 * The filter a listing is remembered by: only the distribution, since the package format is a
 * question about one visit rather than about the listing.
 */
export type RememberedPkgFilters = Pick<PkgFiltersValue, 'distroId'>

const noRememberedFilters: RememberedPkgFilters = { distroId: null }

/**
 * Filters are read as the distribution alone: a value from when the package format was remembered
 * as well (or from when the distributions were named instead of identified) reads as a distribution
 * or as no filter at all.
 */
function parseFilters(raw: string): RememberedPkgFilters {
  try {
    const value = JSON.parse(raw) as Partial<RememberedPkgFilters>
    return { distroId: typeof value.distroId === 'string' ? value.distroId : null }
  } catch {
    return noRememberedFilters
  }
}

/**
 * The distribution the reader narrowed to is remembered in the local storage, so the stored value
 * is also what the first query uses.
 */
export function useStoredPkgFilters() {
  return useLocalStorage<RememberedPkgFilters>(storageKey, noRememberedFilters, {
    parser: parseFilters,
  })
}

type PkgFiltersProps = {
  value: PkgFiltersValue
  onChange: (value: PkgFiltersValue) => void
}

export default function PkgFilters({ value, onChange }: PkgFiltersProps) {
  const { t } = useTranslation()
  const [distros, setDistros] = useState<Distro[]>([])

  useEffect(() => {
    let active = true
    getDistroCatalog()
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

  const hasFilters = value.distroId !== null || value.type !== null

  return (
    <Group align='flex-end' gap='sm' mb='lg'>
      <DistroSelect
        distros={distros}
        label={t('common.distribution')}
        onChange={(distroId) => onChange({ ...value, distroId })}
        placeholder={t('packages.filterAny')}
        searchable
        value={value.distroId}
        w={filterWidth}
      />
      <ListFilter
        data={packageTypes.map((type) => ({ label: type, value: type }))}
        label={t('common.packageFormat')}
        onChange={(type) => onChange({ ...value, type })}
        placeholder={t('packages.filterAny')}
        value={value.type}
      />
      {hasFilters && (
        <Button
          leftSection={<XIcon size={16} />}
          onClick={() => onChange(emptyPkgFilters)}
          variant='subtle'
        >
          {t('common.clearFilters')}
        </Button>
      )}
    </Group>
  )
}
