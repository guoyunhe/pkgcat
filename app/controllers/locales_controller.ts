import type { HttpContext } from '@adonisjs/core/http'

import { fallbackLocale, supportedLocales } from '#services/app_locales'

/**
 * Languages the catalog keeps, which the editor reads so that the languages it offers are exactly
 * the ones the API accepts and the repositories are read with. They are configured once in
 * `config/i18n.ts`, where the interface translations read them from as well.
 */
export default class LocalesController {
  async index({ serialize }: HttpContext) {
    return serialize({
      locales: supportedLocales(),
      defaultLocale: fallbackLocale(),
    })
  }
}
