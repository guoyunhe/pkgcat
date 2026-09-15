import { Select } from '@mantine/core'
import { useTranslation } from 'react-i18next'

import { appSort, appSorts, type AppSort } from '../services/apps'
import { filterWidth } from './ListFilter'

type AppSortSelectProps = {
  onChange: (value: AppSort) => void
  value: AppSort
  /** Width of the field, which defaults to the one every field of a listing toolbar is shown at */
  width?: number
}

/**
 * Field that orders a listing of applications, which every such listing shows the same way: the
 * orders the API accepts, each named by the wording the rest of a listing uses. The listing always
 * carries one, so its field cannot be cleared and only the orders of the vocabulary can be picked.
 */
export default function AppSortSelect({
  onChange,
  value,
  width = filterWidth,
}: AppSortSelectProps) {
  const { t } = useTranslation()

  // `name` is the shared label of every name field, the other three are orders of this listing
  const labels: Record<AppSort, string> = {
    favorites: t('apps.sort.favorites'),
    name: t('common.name'),
    newest: t('apps.sort.newest'),
    rating: t('apps.sort.rating'),
  }

  return (
    <Select
      allowDeselect={false}
      data={appSorts.map((sort) => ({ value: sort, label: labels[sort] }))}
      label={t('common.sortBy')}
      onChange={(nextSort) => onChange(appSort(nextSort))}
      value={value}
      w={width}
    />
  )
}
