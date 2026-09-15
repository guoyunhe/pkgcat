import { Group, Select } from '@mantine/core'
import type { ReactNode } from 'react'

import styles from './ListFilter.module.css'

/** One value a filter offers, with the icon a listing names its values by, when it has one. */
export type FilterOption = {
  value: string
  label: string
  icon?: string
}

type ListFilterProps = {
  /**
   * Values the filter offers. A listing that carries every value loads them with the entries it
   * shows, so an option is always a value the listing itself carries and never narrows it down to
   * nothing; a listing that is paged by the server offers the vocabulary its values come from
   * instead.
   */
  data: FilterOption[]
  label: string
  onChange: (value: string | null) => void
  /** Text of the field while nothing is selected, which a field that reads as "any" shows */
  placeholder?: string
  searchable?: boolean
  value: string | null
  /** Width of the field, which is the one the values it offers read best at. */
  width?: number
  /** Hint the field shows under it, for the fields whose values have to be explained */
  description?: ReactNode
}

/**
 * Filter of a listing by one of the values it holds, which the listings of the application show the
 * same way: one clearable field that names what it narrows, offering the values it can narrow to. A
 * listing that loads its entries whole only narrows what is already there and brings the whole list
 * back when the field is cleared; a listing the server pages asks it for the narrowed page.
 */
export default function ListFilter({
  data,
  description,
  label,
  onChange,
  placeholder,
  searchable,
  value,
  width = 240,
}: ListFilterProps) {
  const selected = data.find((option) => option.value === value)

  return (
    <Select
      clearable
      data={data}
      description={description}
      label={label}
      leftSection={
        selected?.icon ? <img alt='' className={styles.icon} src={selected.icon} /> : null
      }
      onChange={onChange}
      placeholder={placeholder}
      renderOption={({ option }) => {
        const { icon } = option as FilterOption
        return icon ? (
          <Group gap='xs' wrap='nowrap'>
            <img alt='' className={styles.icon} src={icon} />
            <span>{option.label}</span>
          </Group>
        ) : (
          option.label
        )
      }}
      searchable={searchable}
      value={value}
      w={width}
    />
  )
}
