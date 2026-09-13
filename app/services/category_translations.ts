import type Category from '#models/category'
import CategoryTranslation from '#models/category_translation'
import { canonicalLocale, localeKey } from '#services/app_locales'

/** Localized names of a category, keyed by the locale that translates them. */
export type CategoryNames = Record<string, string>

/**
 * Display names of a category. The name used to be a JSON column on `categories`, so the shape is
 * kept: a map of locale to text, which is what the transformers and the frontend read.
 */
export function categoryNames(translations: CategoryTranslation[] | undefined): CategoryNames {
  const names: CategoryNames = {}
  for (const translation of translations ?? []) {
    if (translation.name) names[translation.locale] = translation.name
  }
  return names
}

/**
 * Replace the translations of a category with the names a caller passes. A locale that is no longer
 * translated is removed, and languages the catalog does not keep are dropped instead of stored.
 */
export async function replaceCategoryTranslations(category: Category, names: CategoryNames = {}) {
  const wanted = new Map<string, { locale: string; name: string }>()
  for (const [tag, text] of Object.entries(names)) {
    const trimmed = typeof text === 'string' ? text.trim() : ''
    if (!trimmed) continue

    const locale = canonicalLocale(tag)
    if (!locale) continue

    wanted.set(localeKey(locale), { locale, name: trimmed })
  }

  const stored = await CategoryTranslation.query().where('categoryId', category.id)
  const known = new Map<string, CategoryTranslation>()
  for (const translation of stored) {
    const key = localeKey(translation.locale)
    const entry = wanted.get(key)
    if (!entry) {
      await translation.delete()
      continue
    }

    known.set(key, translation)
    if (translation.name !== entry.name) {
      translation.name = entry.name
      await translation.save()
    }
  }

  for (const [key, entry] of wanted) {
    if (known.has(key)) continue
    await CategoryTranslation.create({
      categoryId: category.id,
      locale: entry.locale,
      name: entry.name,
    })
  }
}
