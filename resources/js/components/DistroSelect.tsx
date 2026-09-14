import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

import { distroLabel, getDistros, type Distro } from '../services/distros'
import ListFilter from './ListFilter'

/** One release of the catalog, of the fields that name it. */
type DistroEntry = Pick<Distro, 'arch' | 'id' | 'name' | 'version'>

type DistroSelectProps = {
  /**
   * Entries the field offers. It reads the whole catalog when it is given none, while a listing
   * that begins from a narrower set of releases — the ones it shows — hands its own over.
   */
  distros?: DistroEntry[]
  /** Entries the field leaves out, which is how a form omits the release it is editing */
  excludeIds?: number[]
  label: string
  onChange: (value: string | null) => void
  value: string | null
  /** Hint the field shows under it, which a form passes and a listing filter does not. */
  description?: ReactNode
  placeholder?: string
  searchable?: boolean
  width?: number
}

/**
 * Field that names a release of the catalog. Its options are the entries it is given, or every
 * entry of the catalog when it is given none, each of them named the way a release is named
 * everywhere — by its distribution, its version and the architecture that tells two entries of one
 * release apart — and carrying the icon of its distribution.
 */
export default function DistroSelect({ distros, excludeIds, ...field }: DistroSelectProps) {
  const [catalog, setCatalog] = useState<DistroEntry[]>([])

  useEffect(() => {
    if (distros) return

    let active = true
    getDistros()
      .then((result) => {
        if (active) setCatalog(result)
      })
      .catch(() => {
        // Without the catalog the field stays empty, which is the same as naming nothing
      })
    return () => {
      active = false
    }
  }, [distros])

  return <ListFilter data={distroOptions(distros ?? catalog, excludeIds)} {...field} />
}

/**
 * Options of the entries, which follow each other by distribution, by version read as a number
 * (which their text cannot express: "10" comes before "8") and by architecture, and an entry handed
 * over twice, or left out, is offered once at most.
 */
function distroOptions(distros: DistroEntry[], excludeIds?: number[]) {
  const excluded = new Set(excludeIds)
  const entries = new Map<number, DistroEntry>()
  for (const distro of distros) {
    if (!excluded.has(distro.id)) entries.set(distro.id, distro)
  }

  return [...entries.values()]
    .sort(
      (a, b) =>
        a.name.localeCompare(b.name) ||
        (a.version ?? '').localeCompare(b.version ?? '', undefined, { numeric: true }) ||
        a.arch.localeCompare(b.arch),
    )
    .map((distro) => ({
      icon: `/distros/${encodeURIComponent(distro.name)}.svg`,
      label: distroLabel(distro),
      value: String(distro.id),
    }))
}
