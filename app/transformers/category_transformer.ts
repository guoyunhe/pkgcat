import { BaseTransformer } from '@adonisjs/core/transformers'

import type Category from '#models/category'
import { categoryNames } from '#services/category_translations'

export default class CategoryTransformer extends BaseTransformer<Category> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'code', 'parentId']),
      /**
       * Display names keyed by locale, assembled from the `category_translations` rows so the
       * response keeps the shape the JSON column had.
       */
      name: categoryNames(this.resource.translations),
    }
  }
}
