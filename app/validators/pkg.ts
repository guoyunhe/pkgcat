import vine from '@vinejs/vine'

/**
 * Package formats that can be created or edited by hand. Uploaded files are recognized by their
 * archive magic instead.
 */
export const pkgTypes = ['deb', 'rpm', 'appimage', 'flatpak', 'snap', 'tar.gz'] as const

/**
 * HTML forms send empty strings for unset values and JSON clients may omit the key entirely. Both
 * are normalized to null, which is also what Lucid expects for nullable columns.
 */
const emptyToNull = (value: unknown) => (value === '' || value === undefined ? null : value)

/**
 * Application selection of a package: no selection arrives as `null` or an empty string, while an
 * omitted field leaves the stored links alone.
 */
const emptyToArray = (value: unknown) => (value === null || value === '' ? [] : value)

/**
 * Validator to use when creating or updating a package.
 */
export const pkgValidator = vine.create({
  // A package belongs to every application it provides: one package may ship several AppStream
  // metadata files, and one file may declare several components
  appIds: vine
    .array(vine.number().exists({ table: 'apps', column: 'id' }))
    .parse(emptyToArray)
    .optional(),
  type: vine.enum(pkgTypes),
  name: vine.string().trim().minLength(1).maxLength(255),
  version: vine.string().parse(emptyToNull).trim().maxLength(255).nullable(),
  release: vine.string().parse(emptyToNull).trim().maxLength(255).nullable(),
  arch: vine.string().parse(emptyToNull).trim().maxLength(255).nullable(),
  license: vine.string().parse(emptyToNull).trim().nullable(),
  summary: vine.string().parse(emptyToNull).trim().nullable(),
  description: vine.string().parse(emptyToNull).trim().nullable(),
  downloadUrl: vine.string().parse(emptyToNull).trim().maxLength(255).nullable(),
  checksum: vine.string().parse(emptyToNull).trim().maxLength(255).nullable(),
  checksumType: vine.string().parse(emptyToNull).trim().maxLength(255).nullable(),
  installCommand: vine.string().parse(emptyToNull).trim().nullable(),
  size: vine.number().parse(emptyToNull).min(0).nullable(),
})
