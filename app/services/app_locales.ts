import i18nManager from '@adonisjs/i18n/services/main'

/**
 * Languages the catalog keeps, in the order the interface offers them. The list is configured once
 * in `config/i18n.ts`, where the interface, the catalog and the editor all read it from.
 */
export function supportedLocales() {
  return i18nManager.supportedLocales()
}

/** Language the catalog falls back to, which is the interface's default language as well. */
export function fallbackLocale() {
  return i18nManager.defaultLocale
}

/**
 * Languages of the catalog. AppStream metadata spells its `xml:lang` attribute the glibc way, which
 * carries regional and script variants the catalog has no use for — `sr@ijekavianlatin`,
 * `ca@valencia`, `zh_Hans_CN` — and which do not even fit the locale column of a translation.
 *
 * Everything that enters the catalog is therefore normalized and matched against this whitelist:
 * the glibc modifier is dropped, the separator and the casing are normalized (`zh_CN` is `zh-CN`),
 * a script is dropped to keep the region (`zh-Hans-CN` is `zh-CN`), and a tag that names no
 * language of the list — `en-GB` or `xx_YY` — falls back to its parent language or is dropped.
 */

let localeIndex: Map<string, string> | null = null

/** Spelling every supported language is stored under, keyed for lookups. */
function supportedLocaleIndex() {
  localeIndex ??= new Map(supportedLocales().map((locale) => [localeKey(locale), locale]))
  return localeIndex
}

/**
 * Key two locales are compared under. Locales are written in either spelling (`zh-CN` in the
 * interface, `zh_cn` in AppStream metadata), and the database compares them case-insensitively, so
 * everything that pairs locales up has to as well.
 */
export function localeKey(locale: string) {
  return locale.trim().toLowerCase().replace(/-/g, '_')
}

/**
 * Language a metadata tag or a request asks for, spelled the way the catalog stores it, or `null`
 * when the catalog does not keep that language.
 */
export function canonicalLocale(tag: string): string | null {
  // `sr@ijekavianlatin` is Serbian: the glibc modifier does not name a language of its own
  const normalized = tag.split('@')[0]?.trim().replace(/_/g, '-') ?? ''
  if (!normalized) return null

  const exact = supportedLocaleIndex().get(localeKey(normalized))
  if (exact) return exact

  // A script subtag names a spelling of the language rather than a language of its own, and the
  // region is what tells two translations of a language apart, so the script is dropped first:
  // `zh-Hans-CN` is `zh-CN` while `zh-Hant` is `zh`
  const subtags = normalized.split('-').filter((subtag) => subtag && !/^[A-Za-z]{4}$/.test(subtag))

  // The rest of the tag is looked up the way RFC 4647 does, parent language by parent language:
  // `en-GB` is `en`, and a language that is not listed is not a language the catalog keeps
  for (let index = subtags.length; index > 0; index--) {
    const match = supportedLocaleIndex().get(localeKey(subtags.slice(0, index).join('-')))
    if (match) return match
  }
  return null
}
