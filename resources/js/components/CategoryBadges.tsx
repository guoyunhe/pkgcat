import type { Data } from '@generated/data'
import { Badge, Group } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { Link } from 'wouter'

import { categoryName } from '../utils/categoryNames'

type CategoryBadgesProps = {
  categories: Data.App['categories']
  /** Where the badges link to; the category code is appended as a `category` query parameter. */
  linkTo?: string
}

/**
 * Localized category chips of an application. They link to the application list filtered by the
 * category, so a category shown on a card or on the detail page can be explored further.
 */
export default function CategoryBadges({ categories, linkTo = '/apps' }: CategoryBadgesProps) {
  const { t } = useTranslation()
  if (categories.length === 0) return null

  return (
    <Group gap={4} wrap='wrap'>
      {categories.map((category) => (
        <Badge
          component={Link}
          href={`${linkTo}?category=${encodeURIComponent(category.code)}`}
          key={category.id}
          variant='light'
        >
          {categoryName(t, category.code)}
        </Badge>
      ))}
    </Group>
  )
}
