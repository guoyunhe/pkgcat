import vine from '@vinejs/vine'

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
 * Validator to use when creating or updating a repository. The `repoId` meta value excludes the
 * repository being updated from the unique name check.
 */
export const repoValidator = vine.create({
  name: vine
    .string()
    .trim()
    .maxLength(255)
    .unique({
      table: 'repos',
      column: 'name',
      filter: (db, _value, field) => {
        const repoId = (field.meta as { repoId?: number }).repoId
        if (repoId) db.whereNot('id', repoId)
      },
    }),
  baseUrl: vine.string().trim().maxLength(255),
  type: vine.enum(repoTypes),
  source: vine.enum(repoSources),
  distroIds: vine.array(vine.number().exists({ table: 'distros', column: 'id' })).optional(),
  configUrl: vine.string().parse(emptyToNull).trim().maxLength(255).nullable(),
  configContent: vine.string().parse(emptyToNull).trim().nullable(),
  installScript: vine.string().parse(emptyToNull).trim().nullable(),
  syncIntervalDays: vine.number().parse(emptyToNull).min(0).nullable(),
})
