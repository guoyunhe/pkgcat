import type { TFunction } from 'i18next'

/**
 * Namespace the display names of the categories are read from. They live in
 * `public/locales/<language>/categories.json`, which `node ace category:names` writes out of the
 * menu definitions the desktop ships, so the names are translated into every language those
 * definitions carry instead of being maintained in the database.
 */
export const categoriesNamespace = 'categories'

/**
 * Display name of a category in the language of the interface. A category no menu of the desktop
 * names stays its code, which is the case-sensitive name an AppStream component carries.
 */
export function categoryName(t: TFunction, code: string) {
  return t(code, { ns: categoriesNamespace })
}
