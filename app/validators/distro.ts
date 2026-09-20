import vine from '@vinejs/vine'

import { firstValue, knownValue, pageNumber, pageSize } from '#utils/query_params'
import { pkgTypes } from '#validators/pkg'

/**
 * HTML forms send empty strings for unset values and JSON clients may omit the key entirely. Both
 * are normalized to null, which is also what Lucid expects for nullable columns.
 */
const emptyToNull = (value: unknown) => (value === '' || value === undefined ? null : value)

/**
 * Validator to use when creating or updating a distribution. A distribution is one release of one
 * distribution for one architecture, and that triple is unique in the database, so the uniqueness
 * check of the name also compares the version and the architecture. The `distroId` meta value
 * excludes the distribution being updated from that check.
 */
export const distroValidator = vine.create({
  name: vine
    .string()
    .trim()
    .minLength(1)
    .maxLength(255)
    .unique({
      table: 'distros',
      column: 'name',
      filter: (db, _value, field) => {
        const distroId = (field.meta as { distroId?: number }).distroId
        if (distroId) db.whereNot('id', distroId)

        const version = (field.data as { version?: string | null })?.version ?? null
        if (!version) db.whereNull('version')
        else db.where('version', version)

        // An invalid payload without an architecture is rejected by its own rule, so the
        // comparison only has to avoid an undefined binding here.
        db.where('arch', (field.data as { arch?: string })?.arch ?? '')
      },
    }),
  version: vine.string().parse(emptyToNull).trim().maxLength(255).nullable(),
  arch: vine.string().trim().minLength(1).maxLength(255),
  pkgType: vine.enum(pkgTypes).parse(emptyToNull).nullable(),
  // The entry the distribution is binary compatible with; an entry may be named by several others,
  // and the form leaves out the distribution being edited, so it can only point at another one
  compatibleDistroId: vine
    .number()
    .parse(emptyToNull)
    .exists({ table: 'distros', column: 'id' })
    .nullable(),
  releaseDate: vine.string().parse(emptyToNull).trim().maxLength(10).nullable(),
  eolDate: vine.string().parse(emptyToNull).trim().maxLength(10).nullable(),
})

/**
 * Sorts a distribution listing can be read in, named after the field the listing answers with. The
 * name order is what a request without one reads, which keeps the releases of one distribution
 * together; the counts order the releases by what they hold, or by how many users run them, the
 * most first.
 */
export const distroSorts = ['name', 'pkgCount', 'appCount', 'userCount'] as const

/**
 * Query parameters of the distribution listing, which its page pages ten entries at a time. The
 * search terms narrow the listing the way the architecture does, and a value the request got wrong
 * — a page that is not a number, an order that is not one — narrows nothing instead of failing.
 */
export const distroListValidator = vine.create({
  page: vine.number().parse((value) => pageNumber(value, 1)),
  perPage: vine.number().parse((value) => pageSize(value, 10, 50)),
  sort: vine.enum(distroSorts).parse(knownValue(distroSorts, 'name')),
  /** Search terms, which a release is found by its name, version, architecture and format. */
  q: vine.string().parse(firstValue).toLowerCase().optional(),
  /** Architecture the listing is narrowed to; a request without one reads every entry. */
  arch: vine.string().parse(firstValue).optional(),
})
