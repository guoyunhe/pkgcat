import vine from '@vinejs/vine'

import { pkgNameIsClaimed, pkgNameKey, type PkgNameMapping } from '#services/app_pkg_names'
import { appstreamIdIsClaimed } from '#services/app_registry'
import { appstreamIdKey, canonicalAppstreamId } from '#services/repo_appstream_extractor'

type LocalizedText = Record<string, string>

/**
 * HTML forms send empty strings for unset values and JSON clients may omit the key entirely. Both
 * are normalized to null.
 */
const emptyToNull = (value: unknown) => (value === '' || value === undefined ? null : value)

/**
 * Localized text is a JSON object of locale => text. At least one translation is required, while
 * blank and non-string translations are dropped.
 */
const localizedTextRule = vine.createRule((value, _options, field) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return

  const localized: LocalizedText = {}
  for (const [locale, text] of Object.entries(value as Record<string, unknown>)) {
    if (typeof text !== 'string') continue

    const trimmed = text.trim()
    if (locale && trimmed) localized[locale] = trimmed
  }

  if (Object.keys(localized).length === 0) {
    field.report('The {{ field }} field must have at least one translation', 'localizedText', field)
    return
  }

  field.mutate(localized, field)
})

const localizedText = () => vine.record(vine.string()).use(localizedTextRule())

/** Application being edited, which is allowed to keep the AppStream IDs it already has. */
function editedAppId(field: { meta?: unknown }) {
  return (field.meta as { appId?: number } | undefined)?.appId
}

/**
 * An AppStream ID identifies an application across the catalog, and applications answer to the IDs
 * they are stored under as well as to their aliases, so an ID can only belong to one of them. This
 * is what keeps the ID of a merged application from creating a second entry.
 */
const appstreamIdIsFree = vine.createRule(async (value, _options, field) => {
  if (typeof value !== 'string' || value === '') return
  if (await appstreamIdIsClaimed(value, editedAppId(field))) {
    field.report(
      'The {{ field }} field is already used by another application',
      'appstreamIdIsClaimed',
      field,
    )
  }
})

/**
 * Aliases are the AppStream IDs an application used to be known by. They are normalized to their
 * canonical spelling, deduplicated, and the ID the application is stored under is not an alias of
 * itself. Every other alias has to be free, so that two applications can never answer to the same
 * ID.
 */
const appstreamIdsAreFree = vine.createRule(async (value, _options, field) => {
  if (!Array.isArray(value)) return

  const appId = editedAppId(field)
  const storedId = (field.parent as { appstreamId?: string | null } | undefined)?.appstreamId
  const aliases: string[] = []
  const seen = new Set<string>()

  for (const item of value) {
    if (typeof item !== 'string') continue
    const trimmed = item.trim()
    if (!trimmed) continue

    const id = canonicalAppstreamId(trimmed)
    const key = appstreamIdKey(id)
    if (seen.has(key)) continue
    seen.add(key)
    if (storedId && appstreamIdKey(storedId) === key) continue

    if (await appstreamIdIsClaimed(id, appId)) {
      field.report(
        'The {{ field }} field contains an ID already used by another application',
        'appstreamIdIsClaimed',
        field,
      )
      return
    }
    aliases.push(id)
  }

  field.mutate(aliases, field)
})

/**
 * Package names are mapped to an application so that packages no AppStream metadata mentions can be
 * linked by their name. The format is normalized to lower case, an empty format means that the name
 * belongs to the application in every format, and a name may only be mapped once in the catalog.
 */
const pkgNamesAreFree = vine.createRule(async (value, _options, field) => {
  if (!Array.isArray(value)) return

  const appId = editedAppId(field)
  const mappings: PkgNameMapping[] = []
  const seen = new Set<string>()

  for (const item of value as Array<{ name?: unknown; type?: unknown }>) {
    const name = typeof item?.name === 'string' ? item.name.trim() : ''
    if (!name) continue
    const type = typeof item?.type === 'string' ? item.type.trim().toLowerCase() : ''

    const key = pkgNameKey(name, type)
    if (seen.has(key)) continue
    seen.add(key)

    if (await pkgNameIsClaimed(name, type, appId)) {
      field.report(
        'The {{ field }} field contains a package name already mapped to another application',
        'pkgNameIsClaimed',
        field,
      )
      return
    }
    mappings.push({ name, type })
  }

  field.mutate(mappings, field)
})

/**
 * Validator to use when creating or updating an app. The `appId` meta value excludes the app being
 * updated from the unique AppStream identifier check.
 */
export const appValidator = vine.create({
  name: localizedText(),
  summary: localizedText(),
  version: vine.string().parse(emptyToNull).trim().maxLength(255).nullable(),
  license: vine.string().parse(emptyToNull).trim().maxLength(255).nullable(),
  homepage: vine.string().parse(emptyToNull).trim().maxLength(255).nullable(),
  appstreamId: vine
    .string()
    .parse(emptyToNull)
    .trim()
    .maxLength(255)
    .use(appstreamIdIsFree())
    .nullable(),
  /**
   * Historical AppStream IDs of the application. They are read after the stored ID, so that an
   * alias repeating it can be told apart.
   */
  appstreamIdAliases: vine
    .array(vine.string().trim().maxLength(255))
    .use(appstreamIdsAreFree())
    .optional(),
  /**
   * Package names the application owns, used to link the packages of repositories that ship no
   * AppStream metadata for them. An empty `type` maps the name in every package format.
   */
  pkgNames: vine
    .array(
      vine.object({
        name: vine.string().trim().maxLength(255),
        type: vine.string().trim().maxLength(20).nullable().optional(),
      }),
    )
    .use(pkgNamesAreFree())
    .optional(),
  appstreamUrl: vine.string().parse(emptyToNull).trim().maxLength(255).nullable(),
  appstreamContent: vine.string().parse(emptyToNull).trim().nullable(),
  desktopUrl: vine.string().parse(emptyToNull).trim().maxLength(255).nullable(),
  desktopContent: vine.string().parse(emptyToNull).trim().nullable(),
  iconId: vine.number().parse(emptyToNull).exists({ table: 'images', column: 'id' }).nullable(),
})

/** Validator of the application a merge folds into the one named in the URL. */
export const mergeAppValidator = vine.create({
  sourceId: vine.number().exists({ table: 'apps', column: 'id' }),
})
