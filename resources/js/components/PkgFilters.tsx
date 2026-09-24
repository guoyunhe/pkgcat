import { useLocalStorage } from '@guoyunhe/react-storage'
import { Button, Group } from '@mantine/core'
import { XIcon } from '@phosphor-icons/react/X'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { getDistroCatalog, type Distro } from '../services/distros'
import type { PkgFilters as PkgFiltersValue } from '../services/pkgs'
import { distroIndependentPackageTypes, packageTypes } from '../utils/pkgTypes'
import ArchSelect from './ArchSelect'
import DistroSelect from './DistroSelect'
import ListFilter, { filterWidth } from './ListFilter'

const storageKey = 'pkg-filters'

/** Filters that narrow nothing, which a listing that shows no toolbar reads with. */
export const emptyPkgFilters: PkgFiltersValue = { arch: null, distroId: null, type: null }

/**
 * The package format and the architecture most of the catalog is published in, which a reader whose
 * release the catalog does not know reads it in.
 */
const fallbackFilters = { arch: 'x86_64', type: 'rpm' }

/**
 * What the two required filters start at: the package format and the architecture of the release
 * the reader runs, and the two above for a reader who runs one the catalog does not know.
 */
export function filterDefaults(catalog: Distro[], distroId?: number | null) {
  const release = catalog.find((distro) => distro.id === distroId)
  return {
    arch: release?.arch ?? fallbackFilters.arch,
    type: release?.pkgType ?? fallbackFilters.type,
  }
}

/** Whether a listing is narrowed away from what its two required filters start at. */
export function filtersAreNarrowed(
  filters: PkgFiltersValue,
  defaults: Pick<PkgFiltersValue, 'arch' | 'type'>,
) {
  return (
    filters.distroId !== null || filters.type !== defaults.type || filters.arch !== defaults.arch
  )
}

/**
 * Releases a package listing offers, which the distribution field and the two required filters of
 * the reader are read from. It is read once for the listing and handed to the toolbar; a listing
 * whose toolbar is not shown reads nothing.
 */
export function useDistroCatalog(enabled: boolean) {
  const [catalog, setCatalog] = useState<Distro[] | null>(null)

  useEffect(() => {
    if (!enabled) return

    let active = true
    getDistroCatalog()
      .then((result) => {
        if (!active) return
        // A release that ships no native package is served by no repository of packages
        setCatalog(result.filter((distro) => distro.pkgType))
      })
      .catch(() => {
        // Without the catalog the toolbar offers nothing, which is the same as naming nothing
        if (active) setCatalog([])
      })
    return () => {
      active = false
    }
  }, [enabled])

  return catalog
}

/**
 * The filters a reader left behind, which the next visit opens with. A filter that was never chosen
 * is stored as nothing, so it keeps following the release the reader runs.
 */
export function useStoredPkgFilters() {
  return useLocalStorage<PkgFiltersValue>(storageKey, emptyPkgFilters, { parser: parseFilters })
}

/** Filters as they were stored: a field an older shape held, or one never chosen, reads as nothing. */
function parseFilters(raw: string): PkgFiltersValue {
  try {
    const value = JSON.parse(raw) as Partial<PkgFiltersValue>
    return {
      arch: typeof value.arch === 'string' ? value.arch : null,
      distroId: typeof value.distroId === 'string' ? value.distroId : null,
      type: typeof value.type === 'string' ? value.type : null,
    }
  } catch {
    return emptyPkgFilters
  }
}

/**
 * Releases the toolbar offers: those that carry the package format and architecture the reader
 * picked, and none at all for a format no release carries.
 */
function offeredDistros(catalog: Distro[], value: Pick<PkgFiltersValue, 'arch' | 'type'>) {
  if (distroIndependentPackageTypes.includes(value.type ?? '')) return []
  return catalog.filter(
    (distro) =>
      (value.type === null || distro.pkgType === value.type) &&
      (value.arch === null || distro.arch === value.arch),
  )
}

type PkgFiltersProps = {
  /** Releases the distribution field offers. */
  catalog: Distro[]
  /**
   * Architectures the architecture field offers, which every release of the catalog is published
   * for.
   */
  arches: string[]
  /** What the two required filters start at, which clearing the filters returns to. */
  defaults: Pick<PkgFiltersValue, 'arch' | 'type'>
  value: PkgFiltersValue
  onChange: (value: PkgFiltersValue) => void
}

/**
 * Package format, architecture and distribution filters, in that order. The package format and the
 * architecture always name a value, since a package is one format for one architecture, and the
 * releases the distribution field offers are the ones the two before it name; a format no release
 * carries drops that field altogether.
 */
export default function PkgFilters({
  arches,
  catalog,
  defaults,
  value,
  onChange,
}: PkgFiltersProps) {
  const { t } = useTranslation()
  const hideDistro = distroIndependentPackageTypes.includes(value.type ?? '')

  // The release the reader picked is dropped as soon as the format or the architecture stops
  // offering it, so that what the toolbar shows is what narrows the listing
  function changeFilters(next: PkgFiltersValue) {
    const offered = offeredDistros(catalog, next)
    const keepsPick = offered.some((distro) => String(distro.id) === next.distroId)
    const known = catalog.length > 0 || distroIndependentPackageTypes.includes(next.type ?? '')
    onChange(known && !keepsPick ? { ...next, distroId: null } : next)
  }

  return (
    <Group align='flex-end' gap='sm' mb='lg'>
      <ListFilter
        clearable={false}
        data={packageTypes.map((type) => ({ label: type, value: type }))}
        label={t('common.packageFormat')}
        onChange={(type) => changeFilters({ ...value, type: type ?? value.type })}
        value={value.type}
      />
      <ArchSelect
        arches={arches}
        clearable={false}
        label={t('common.architecture')}
        onChange={(arch) => changeFilters({ ...value, arch: arch ?? value.arch })}
        searchable
        value={value.arch}
      />
      {!hideDistro && (
        <DistroSelect
          distros={offeredDistros(catalog, value)}
          label={t('common.distribution')}
          onChange={(distroId) => changeFilters({ ...value, distroId })}
          placeholder={t('packages.filterAny')}
          searchable
          value={value.distroId}
          w={filterWidth}
        />
      )}
      {filtersAreNarrowed(value, defaults) && (
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
