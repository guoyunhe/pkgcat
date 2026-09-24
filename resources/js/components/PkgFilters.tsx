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
 * The release the filters of a listing start at for a reader the catalog knows none of, along with
 * the package format and the architecture that release is published in.
 */
const defaultReleaseName = 'openSUSE Tumbleweed'
const fallbackFilters = { arch: 'x86_64', type: 'rpm' }

/** What the filters of a listing start at: the two a package always names, and a release or none. */
export type PkgFilterDefaults = { arch: string; distroId: string | null; type: string }

/**
 * What the filters of a listing start at: the release the reader runs, and openSUSE Tumbleweed for
 * a reader the catalog knows none of.
 */
export function filterDefaults(
  catalog: Distro[],
  distroIdOfReader?: number | null,
): PkgFilterDefaults {
  const release =
    catalog.find((distro) => distro.id === distroIdOfReader) ?? defaultRelease(catalog)
  return {
    arch: release?.arch ?? fallbackFilters.arch,
    distroId: release ? String(release.id) : null,
    type: release?.pkgType ?? fallbackFilters.type,
  }
}

/** OpenSUSE Tumbleweed of the architecture most of the catalog is published for. */
function defaultRelease(catalog: Distro[]) {
  const rolling = catalog.filter((distro) => distro.name === defaultReleaseName)
  return rolling.find((distro) => distro.arch === fallbackFilters.arch) ?? rolling[0]
}

/** Whether a listing is narrowed away from what its filters start at. */
export function filtersAreNarrowed(filters: PkgFiltersValue, defaults: PkgFilterDefaults) {
  return (
    filters.distroId !== defaults.distroId ||
    filters.type !== defaults.type ||
    filters.arch !== defaults.arch
  )
}

/**
 * The distribution a listing is narrowed by, which is always one of the releases the catalog offers
 * for the package format and architecture of the listing: the one the reader picked, the same
 * release of another architecture when it offers one, and the first it offers otherwise. A catalog
 * that has not been read yet offers nothing to check a pick with, so it stands until it has.
 */
export function offeredDistroId(
  catalog: Distro[] | null,
  value: Pick<PkgFiltersValue, 'arch' | 'distroId' | 'type'>,
) {
  if (catalog === null) return value.distroId
  const offered = offeredDistros(catalog, value)
  if (offered.some((distro) => String(distro.id) === value.distroId)) return value.distroId
  // A pick the catalog does not offer is replaced by the same release of the architecture it offers,
  // and by the first one it offers when it holds no such release
  const picked = catalog.find((distro) => String(distro.id) === value.distroId)
  const same = offered.find(
    (distro) => distro.name === picked?.name && distro.version === picked?.version,
  )
  const replacement = same ?? offered[0]
  return replacement ? String(replacement.id) : null
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
export function offeredDistros(catalog: Distro[], value: Pick<PkgFiltersValue, 'arch' | 'type'>) {
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
  /** What the filters start at, which clearing them returns to. */
  defaults: PkgFilterDefaults
  value: PkgFiltersValue
  onChange: (value: PkgFiltersValue) => void
}

/**
 * Package format, architecture and distribution filters, in that order. Each of them always names a
 * value — a package is one format for one architecture, published by one release — and the releases
 * the distribution field offers are the ones the two before it name; a format no release carries
 * drops that field altogether.
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

  // A release the format and the architecture do not offer is replaced by the one they do, so that
  // what the toolbar shows is what narrows the listing
  function changeFilters(next: PkgFiltersValue) {
    onChange({ ...next, distroId: offeredDistroId(catalog, next) })
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
          clearable={false}
          distros={offeredDistros(catalog, value)}
          label={t('common.distribution')}
          onChange={(distroId) => changeFilters({ ...value, distroId })}
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
