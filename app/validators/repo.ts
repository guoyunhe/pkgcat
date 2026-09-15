import type { VineDbSearchOptions } from '@adonisjs/lucid/types/vine'
import vine from '@vinejs/vine'

import { firstValue, knownValue, pageNumber, pageSize, positiveInteger } from '#utils/query_params'

/**
 * Supported repository types.
 */
const repoTypes = ['deb', 'rpm', 'flatpak', 'snap'] as const

/**
 * Supported repository origins.
 */
const repoSources = ['distro', 'community'] as const

/**
 * HTML forms send empty strings for unset values and JSON clients may omit the key entirely. Both
 * are normalized to null, which is also what Lucid expects for nullable columns like "configUrl".
 */
const emptyToNull = (value: unknown) => (value === '' || value === undefined ? null : value)

/**
 * Excludes the repository being updated from the uniqueness checks; the controllers pass its id as
 * the `repoId` meta value.
 */
const excludeRepoBeingUpdated: VineDbSearchOptions<string>['filter'] = (db, _value, field) => {
  const repoId = (field.meta as { repoId?: number }).repoId
  if (repoId) db.whereNot('id', repoId)
}

/**
 * Validator to use when creating or updating a repository. The `repoId` meta value excludes the
 * repository being updated from the unique name and base URL checks. The base URL is checked
 * against the raw column name, since the rule puts the column straight into the query.
 */
export const repoValidator = vine.create({
  name: vine
    .string()
    .trim()
    .maxLength(255)
    .unique({ table: 'repos', column: 'name', filter: excludeRepoBeingUpdated }),
  baseUrl: vine
    .string()
    .trim()
    .maxLength(255)
    .unique({ table: 'repos', column: 'base_url', filter: excludeRepoBeingUpdated }),
  type: vine.enum(repoTypes),
  source: vine.enum(repoSources),
  distroIds: vine.array(vine.number().exists({ table: 'distros', column: 'id' })).optional(),
  configUrl: vine.string().parse(emptyToNull).trim().maxLength(255).nullable(),
  configContent: vine.string().parse(emptyToNull).trim().nullable(),
  installScript: vine.string().parse(emptyToNull).trim().nullable(),
  syncIntervalDays: vine.number().parse(emptyToNull).min(0).nullable(),
})

/** Sorts a repository listing can be read in; the name order is the default one. */
export const repoSorts = ['name', 'packages', 'apps'] as const

/**
 * Query parameters of the repository listing, which the table of them pages ten entries at a time.
 * The search terms and the origin narrow the listing the same way the distribution does, and a
 * value the request got wrong — an origin that is not one, a page that is not a number — narrows
 * nothing instead of failing.
 */
export const repoListValidator = vine.create({
  page: vine.number().parse((value) => pageNumber(value, 1)),
  perPage: vine.number().parse((value) => pageSize(value, 10, 50)),
  sort: vine.enum(repoSorts).parse(knownValue(repoSorts, 'name')),
  /** Search terms, which a repository is found by along with the releases it serves. */
  q: vine.string().parse(firstValue).toLowerCase().optional(),
  /** Where the repository comes from; another value widens the listing to every origin. */
  source: vine.enum(repoSources).parse(knownValue(repoSources)).optional(),
  /**
   * Release whose repositories are read; a value that is not one widens the listing to every
   * repository.
   */
  distroId: vine
    .number()
    .parse((value) => positiveInteger(firstValue(value)))
    .optional(),
})
