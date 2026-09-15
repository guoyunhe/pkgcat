import { useEffect, useState } from 'react'

import { getDistroCatalog } from '../services/distros'
import ListFilter from './ListFilter'

type ArchSelectProps = {
  /**
   * Architectures the field offers, as `uname -m` prints them. It reads the architectures of the
   * catalog when it is given none, while a listing that already holds them hands them over.
   */
  arches?: string[]
  label: string
  onChange: (value: string | null) => void
  value: string | null
  placeholder?: string
  searchable?: boolean
  width?: number
}

/**
 * Field that names an architecture, which is the vocabulary the catalog keeps its packages in. Its
 * options are the architectures of the catalog when it is given none — every architecture the
 * catalog holds is one a release of it is published for — and each name is offered once, which is
 * what a listing that holds an entry per release and architecture needs.
 */
export default function ArchSelect({ arches, ...field }: ArchSelectProps) {
  const [catalogArches, setCatalogArches] = useState<string[]>([])

  useEffect(() => {
    if (arches) return

    let active = true
    getDistroCatalog()
      .then((result) => {
        if (active) setCatalogArches(result.map((distro) => distro.arch))
      })
      .catch(() => {
        // Without the catalog the field stays empty, which is the same as having no filter
      })
    return () => {
      active = false
    }
  }, [arches])

  return <ListFilter data={archOptions(arches ?? catalogArches)} {...field} />
}

/** Options of the architectures, one per name, sorted by that name. */
function archOptions(arches: string[]) {
  return [...new Set(arches)].sort().map((arch) => ({ label: arch, value: arch }))
}
