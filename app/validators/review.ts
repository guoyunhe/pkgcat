import vine from '@vinejs/vine'

import { canonicalLocale } from '#services/app_locales'
import { firstValue, localeField, pageNumber } from '#utils/query_params'

/**
 * Language tag a request names, spelled the way the catalog stores its languages (`zh-CN` for
 * `zh_Hans`), or `null` when the tag names no language of it.
 */
function localeTag(value: unknown) {
  return typeof value === 'string' ? canonicalLocale(value) : null
}

/**
 * Language a review is written in, which every review names. The tag is stored the way the catalog
 * spells the language, and a tag the catalog keeps no language for is refused rather than stored as
 * no language at all — a reader filters the reviews by it, and one that names nothing is under no
 * filter.
 */
const reviewLocaleRule = vine.createRule((value, _options, field) => {
  const locale = localeTag(value)
  if (!locale) {
    field.report(
      'The {{ field }} field names "{{ locale }}", which is not a language of the catalog',
      'supportedLocale',
      field,
      { locale: String(value) },
    )
    return
  }
  field.mutate(locale, field)
})

/**
 * Validator to use when creating or updating an app review.
 */
export const reviewValidator = vine.create({
  rating: vine.number().min(1).max(5),
  comment: vine.string().trim().maxLength(1000).optional(),
  // The distribution the application was experienced on, when the reviewer names one.
  distroId: vine.number().exists({ table: 'distros', column: 'id' }).nullable(),
  // The language the review is written in, which the interface of the reviewer names by default
  locale: vine.string().use(reviewLocaleRule()),
})

/**
 * Query parameters of a review listing, which the reviews an application received and the ones a
 * user wrote are both read with. A listing is narrowed by the language a review was written in,
 * which is what a reader of them filters by: a review is read by people who write that language.
 */
export const reviewListValidator = vine.create({
  page: vine.number().parse((value) => pageNumber(value, 1)),
  perPage: vine.number().parse((value) => pageNumber(value, 12, 50)),
  /**
   * Language the reviews were written in, spelled the way the catalog stores its languages. A tag
   * that names no language of it narrows nothing, the way any other value of a link that outlived
   * the values a listing offers does.
   */
  reviewLocale: vine
    .string()
    .parse((value) => localeTag(firstValue(value)) ?? undefined)
    .optional(),
  /** Language the applications the reviews name are read in. */
  locale: localeField(),
})
