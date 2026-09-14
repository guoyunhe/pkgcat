import vine from '@vinejs/vine'

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
