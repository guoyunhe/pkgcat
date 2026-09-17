import { BaseSeeder } from '@adonisjs/lucid/seeders'

import { categories } from '#database/data/categories'
import Category from '#models/category'

/**
 * Writes the categories of the freedesktop.org menu specification into the catalog, which
 * `database/data/categories` holds. The display names of the categories are translations of the
 * interface and live in `public/locales/<language>/categories.json`, which `node ace
 * category:names` writes out of the menu definitions the desktop ships.
 */
export default class CategorySeeder extends BaseSeeder {
  async run() {
    // Entries are ordered parents first, so a parent is always created before its children
    const byCode = new Map<string, Category>()

    for (const { code, parent } of categories) {
      const parentCategory = parent ? byCode.get(parent) : null
      if (parent && !parentCategory) {
        throw new Error(`Category seeder: unknown parent "${parent}" of "${code}"`)
      }

      const category = await Category.updateOrCreate(
        { code },
        { parentId: parentCategory?.id ?? null },
      )
      byCode.set(code, category)
    }
  }
}
