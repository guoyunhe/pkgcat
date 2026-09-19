import { Group, Select, type SelectProps } from '@mantine/core'
import { useEffect, useState } from 'react'

import { distroLabel, getDistroCatalog, type Distro } from '../services/distros'

import styles from './DistroSelect.module.css'

/** One release of the catalog, of the fields that name it. */
type DistroEntry = Pick<Distro, 'arch' | 'id' | 'name' | 'version'>

/** One option of the field: a release, named the way releases are named, with its icon. */
type DistroOption = {
  icon: string
  label: string
  value: string
}

type DistroSelectProps = Omit<SelectProps, 'data' | 'renderOption'> & {
  /**
   * Entries the field offers. It reads the whole catalog when it is given none, while a listing
   * that begins from a narrower set of releases — the ones it shows — hands its own over.
   */
  distros?: DistroEntry[]
  /** Entries the field leaves out, which is how a form omits the release it is editing */
  excludeIds?: number[]
}

/**
 * Field that names a release of the catalog, which is a `Select` over everything the catalog holds:
 * what it adds to one is the options it offers — every release named the way releases are named
 * everywhere, with the icon of its distribution — while every other prop is the one `Select` takes.
 * A form therefore binds it with `form.getInputProps`, and a listing narrows another one by it the
 * way it does with any other field.
 */
export default function DistroSelect({ distros, excludeIds, ...field }: DistroSelectProps) {
  const [catalog, setCatalog] = useState<DistroEntry[]>([])
  const options = distroOptions(distros ?? catalog, excludeIds)
  const selected = options.find((option) => option.value === field.value)

  useEffect(() => {
    if (distros) return

    let active = true
    getDistroCatalog()
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

  return (
    <Select
      clearable
      data={options}
      leftSection={selected ? <img alt='' className={styles.icon} src={selected.icon} /> : null}
      renderOption={({ option }) => {
        const { icon } = option as DistroOption
        return (
          <Group gap='xs' wrap='nowrap'>
            <img alt='' className={styles.icon} src={icon} />
            <span>{option.label}</span>
          </Group>
        )
      }}
      {...field}
    />
  )
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
