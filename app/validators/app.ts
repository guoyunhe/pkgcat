import type { ComponentType } from '@guoyunhe/appstream'
import vine from '@vinejs/vine'

import { canonicalLocale, localeRank } from '#services/app_locales'
import { pkgNameIsClaimed, pkgNameKey, type PkgNameMapping } from '#services/app_pkg_names'
import { appstreamIdIsClaimed } from '#services/app_registry'
import { appstreamIdKey, canonicalAppstreamId } from '#services/repo_appstream_extractor'
import { knownValue, localeField, pageNumber } from '#utils/query_params'

type LocalizedText = Record<string, string>

/**
 * Component types of the AppStream specification, the values an application is stored as. The
 * specification distinguishes them, and repositories announce the type of everything they ship, so
 * an editor only ever corrects one. `desktop` is not one of them: it is the name AppStream used
 * before the type was split into `desktop-application` and its siblings (see `canonicalAppType`).
 */
export const appTypes = [
  'generic',
  'desktop-application',
  'console-application',
  'web-application',
  'addon',
  'font',
  'codec',
  'inputmethod',
  'firmware',
  'driver',
  'localization',
  'service',
  'repository',
  'operating-system',
  'icon-theme',
  'runtime',
] as const satisfies readonly ComponentType[]

/**
 * HTML forms send empty strings for unset values and JSON clients may omit the key entirely. Both
 * are normalized to null.
 */
const emptyToNull = (value: unknown) => (value === '' || value === undefined ? null : value)

/**
 * Localized text is a JSON object of locale => text. At least one translation is required; blank
 * and non-string translations are dropped, while a locale is kept under the spelling the catalog
 * uses (`zh-CN` for `zh_cn`) and only when the catalog keeps that language at all. Several tags of
 * one language (`en`, `en-GB`) fold into one entry, and the language's own text wins over a
 * spelling of it in another alphabet, the same way the importer resolves them.
 */
const localizedTextRule = vine.createRule((value, _options, field) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return

  const localized: LocalizedText = {}
  const entries = Object.entries(value as Record<string, unknown>).sort(
    ([left], [right]) => localeRank(left) - localeRank(right),
  )
  for (const [tag, text] of entries) {
    if (typeof text !== 'string') continue

    const trimmed = text.trim()
    if (!trimmed) continue

    const locale = canonicalLocale(tag)
    if (!locale) {
      field.report(
        'The {{ field }} field translates "{{ locale }}", which is not a language of the catalog',
        'supportedLocale',
        field,
        { locale: tag },
      )
      return
    }
    localized[locale] = trimmed
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
  type: vine.enum(appTypes),
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

/**
 * Sort orders the application listing accepts; `newest` is the default. `random` is the order the
 * home page reads its handful of applications in, rather than one a reader picks from a listing.
 */
export const appSorts = ['newest', 'name', 'favorites', 'rating', 'random'] as const

/**
 * Category codes of a listing filter; the query string may repeat them or separate them with
 * commas.
 */
function categoryCodes(value: unknown) {
  const values = Array.isArray(value) ? value : [value]
  const codes = values
    .flatMap((item) => (typeof item === 'string' ? item.split(',') : []))
    .map((code) => code.trim())
    .filter((code) => code !== '')
  return [...new Set(codes)]
}

/**
 * Query parameters of the application listing. Every value the listing narrows, sorts or pages by
 * is read here, so that the controller only handles values that are already of the type the listing
 * uses: a value a link got wrong narrows nothing instead of failing the request, and the page
 * parameters always carry a usable number.
 */
export const appListValidator = vine.create({
  page: vine.number().parse((value) => pageNumber(value, 1)),
  perPage: vine.number().parse((value) => pageNumber(value, 12, 50)),
  sort: vine.enum(appSorts).parse(knownValue(appSorts, 'newest')),
  /** Component type the listing is narrowed to; an unknown type does not narrow it at all. */
  type: vine.enum(appTypes).parse(knownValue(appTypes)).optional(),
  /**
   * Whether the listing holds the applications that carry an icon alone, which the home page reads:
   * it shows each application next to its icon, and fills its list with another application instead
   * of with an empty frame. A value that is not `true` narrows nothing.
   */
  withIcon: vine
    .boolean()
    .parse((value) => value === true || value === 'true')
    .optional(),
  category: vine.array(vine.string()).parse(categoryCodes),
  q: vine.string().trim().toLowerCase().optional(),
  locale: localeField(),
})

/** Query parameters of a single application of the catalog. */
export const appLocaleValidator = vine.create({ locale: localeField() })

/**
 * URL of the AppStream metadata an editor imports into an application. The server reads the
 * document on behalf of the page, which cannot reach the hosts metadata lives on; the URL itself is
 * checked by the importer, which only accepts the schemes a page could read as well.
 */
export const appstreamUrlValidator = vine.create({
  url: vine.string().trim().minLength(1).maxLength(2048),
})

/** AppStream document an editor fills the form of an application out of. */
export const appstreamContentValidator = vine.create({
  content: vine.string().trim().minLength(1),
})
