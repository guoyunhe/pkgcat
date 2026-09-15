import { Button, Group, Select } from '@mantine/core'
import { XIcon } from '@phosphor-icons/react/X'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { getCategories, type Category } from '../services/apps'
import { localized } from '../utils/appstream'
import { filterWidth } from './ListFilter'

type CategoryOption = {
  value: string
  label: string
}

type CategoryGroup = {
  group: string
  items: CategoryOption[]
}

/**
 * Groups the registry by its top level categories, so the select shows one section per main
 * category with its related categories nested inside, instead of a flat list of every code.
 */
function categoryGroups(categories: Category[], language: string): CategoryGroup[] {
  const byId = new Map(categories.map((category) => [category.id, category]))

  function rootOf(category: Category) {
    let root = category
    while (root.parentId !== null) {
      const parent = byId.get(root.parentId)
      if (!parent) break
      root = parent
    }
    return root
  }

  const groups = new Map<number, CategoryGroup>()
  for (const category of categories) {
    const root = rootOf(category)
    const group = groups.get(root.id) ?? {
      group: localized(root.name, language) ?? root.code,
      items: [],
    }
    groups.set(root.id, group)
    group.items.push({
      value: category.code,
      label: localized(category.name, language) ?? category.code,
    })
  }

  return [...groups.values()]
}

type CategoryFilterProps = {
  /** Selected category code, or `null` for "any category". */
  value: string | null
  onChange: (value: string | null) => void
}

/**
 * Category filter of the application listings. Selecting a category also matches the applications
 * filed under its nested categories, which is resolved by the API. The row spacing is left to the
 * listing that renders the filter, which may put further controls next to it.
 */
export default function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  const { t, i18n } = useTranslation()
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    let active = true
    getCategories()
      .then((result) => {
        if (active) setCategories(result)
      })
      .catch(() => {
        // Without the registry the select stays empty, which is the same as having no filter
      })
    return () => {
      active = false
    }
  }, [])

  const groups = useMemo(
    () => categoryGroups(categories, i18n.language),
    [categories, i18n.language],
  )

  return (
    <Group align='flex-end' gap='sm'>
      <Select
        clearable
        data={groups}
        label={t('categories.filterLabel')}
        onChange={onChange}
        placeholder={t('categories.filterAny')}
        searchable
        value={value}
        w={filterWidth}
      />
      {value !== null && (
        <Button leftSection={<XIcon size={16} />} onClick={() => onChange(null)} variant='subtle'>
          {t('common.clearFilters')}
        </Button>
      )}
    </Group>
  )
}
