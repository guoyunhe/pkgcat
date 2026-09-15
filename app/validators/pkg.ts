import vine from '@vinejs/vine'

import { firstValue, localeField, pageNumber, positiveInteger } from '#utils/query_params'

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

/** Query parameter narrowing the listing by a single value, which may be omitted or empty. */
const singleValue = () => vine.string().parse(firstValue).optional()

/**
 * Query parameters of the package listing, which the catalog search and the packages of a single
 * application share. Every package listing pages the same way — ten packages per page — whatever it
 * is narrowed to, and a value a link got wrong (an empty filter, a distribution that does not
 * exist, a page beyond the last one) narrows nothing instead of failing the request.
 */
export const pkgListValidator = vine.create({
  page: vine.number().parse((value) => pageNumber(value, 1)),
  perPage: vine.number().parse((value) => pageNumber(value, 10, 50)),
  /** Search terms of the catalog search; the packages of an application are not searched. */
  q: vine.string().parse(firstValue).toLowerCase().optional(),
  /** Release the listing is narrowed to, which serves the packages of its repositories. */
  distroId: vine
    .number()
    .parse((value) => positiveInteger(firstValue(value)))
    .optional(),
  /**
   * Repository the listing is narrowed to, which the detail page of one reads: it holds the
   * packages extracted from that repository.
   */
  repoId: vine
    .number()
    .parse((value) => positiveInteger(firstValue(value)))
    .optional(),
  arch: singleValue(),
  type: singleValue(),
  locale: localeField(),
})

/** Query parameters of a single package of the catalog. */
export const pkgLocaleValidator = vine.create({ locale: localeField() })
