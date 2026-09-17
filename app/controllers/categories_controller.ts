import type { HttpContext } from '@adonisjs/core/http'

import Category from '#models/category'
import CategoryTransformer from '#transformers/category_transformer'

export default class CategoriesController {
  /** The whole category registry as a flat list; `getCategories` builds the tree from `parentId`. */
  async index({ serialize }: HttpContext) {
    const categories = await Category.query().orderBy('id')
    return serialize(CategoryTransformer.transform(categories))
  }
}
