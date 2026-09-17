import { Cascader, type CascaderOption } from '@mantine/core'
import type { TFunction } from 'i18next'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { getCategories, type Category } from '../services/apps'
import { categoryName } from '../utils/categoryNames'
import { filterWidth } from './ListFilter'

/**
 * The registry as the tree the filter offers it in: the main categories, with the sub-categories
 * nested inside the main category they belong to, both named the way the interface translates
 * them.
 */
function cascaderOptions(categories: Category[], t: TFunction): CascaderOption[] {
  const children = new Map<number, Category[]>()
  for (const category of categories) {
    if (category.parentId === null) continue
    const siblings = children.get(category.parentId) ?? []
    siblings.push(category)
    children.set(category.parentId, siblings)
  }

  const optionOf = (category: Category): CascaderOption => {
    const nested = (children.get(category.id) ?? []).map(optionOf)
    return {
      value: category.code,
      label: categoryName(t, category.code),
      // A category without sub-categories is a leaf, and offers no column beside it
      ...(nested.length > 0 ? { children: nested } : {}),
    }
  }

  return categories.filter((category) => category.parentId === null).map(optionOf)
}

/**
 * Path from the main category down to the selected one, which is what the filter is set to: a main
 * category is a path of its own, a sub-category is named below the main category it belongs to.
 */
function cascaderPath(categories: Category[], code: string | null) {
  if (code === null) return null

  const byId = new Map(categories.map((category) => [category.id, category]))
  const selected = categories.find((category) => category.code === code)
  if (!selected) return null

  const path = [selected.code]
  let parent = selected.parentId === null ? null : byId.get(selected.parentId)
  while (parent) {
    path.unshift(parent.code)
    parent = parent.parentId === null ? null : byId.get(parent.parentId)
  }
  return path
}

type CategoryFilterProps = {
  /** Selected category code, which names a main category or one of its sub-categories. */
  value: string | null
  onChange: (value: string | null) => void
}

/**
 * Filter of the application listings by category, which offers the registry as one tree: picking a
 * main category narrows the listing to it and the applications filed under its sub-categories,
 * which the API resolves, while picking a sub-category narrows it to that one alone. The row
 * spacing is left to the listing that renders the filter.
 */
export default function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  const { t } = useTranslation()
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    let active = true
    getCategories()
      .then((result) => {
        if (active) setCategories(result)
      })
      .catch(() => {
        // Without the registry the field stays empty, which is the same as having no filter
      })
    return () => {
      active = false
    }
  }, [])

  const data = useMemo(() => cascaderOptions(categories, t), [categories, t])
  const path = useMemo(() => cascaderPath(categories, value), [categories, value])

  return (
    <Cascader
      changeOnSelect
      clearable
      data={data}
      label={t('categories.filterLabel')}
      onChange={(next) => onChange(next?.length ? next[next.length - 1] : null)}
      placeholder={t('categories.filterAny')}
      searchable
      value={path}
      w={filterWidth}
    />
  )
}
