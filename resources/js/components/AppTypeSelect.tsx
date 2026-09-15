import { Select } from '@mantine/core'
import { useTranslation } from 'react-i18next'

import { appTypes } from '../utils/appTypes'
import ListFilter from './ListFilter'

type AppTypeSelectProps = {
  onChange: (value: string | null) => void
  value: string | null
  /**
   * Clears the field, which is what a listing filter offers — nothing selected offers every type. A
   * form leaves it out, because an application always carries one.
   */
  clearable?: boolean
  /** Text of the field while nothing is selected, which a filter reads as "any type" */
  placeholder?: string
  /** Width of the field, which a listing's filter states and a form leaves to its layout */
  width?: number
}

/**
 * Field that names the AppStream type of an application. Every listing and every form picks from
 * the same vocabulary — the types AppStream defines — and names a type by the identifier itself,
 * the way a package format is named. A form always carries one, so its field cannot be cleared; a
 * listing filters by it, so its field reads as "any type" while nothing is selected.
 */
export default function AppTypeSelect({
  clearable,
  onChange,
  placeholder,
  value,
  width,
}: AppTypeSelectProps) {
  const { t } = useTranslation()
  const label = t('common.type')

  if (clearable) {
    return (
      <ListFilter
        data={typeOptions}
        label={label}
        onChange={onChange}
        placeholder={placeholder}
        value={value}
        width={width}
      />
    )
  }

  return (
    <Select
      allowDeselect={false}
      data={typeOptions}
      label={label}
      onChange={onChange}
      value={value}
    />
  )
}

/** One option per type, named by the AppStream identifier itself, which needs no translation. */
const typeOptions = appTypes.map((type) => ({ label: type, value: type }))
