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
 * Chinese is resolved by its script instead, see `chineseLocale()`.
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
 * Chinese is the one language of the list that is written in two scripts, and the catalog keeps the
 * two scripts as two translations rather than keeping the language itself: a script or a region
 * subtag decides which one a tag names (`zh-Hant-HK` is `zh-TW`), and a tag that names neither is
 * the simplified one — which is why `zh` alone is not a language of the list. The interface
 * resolves a detected language by the same rule (`normalizeLanguage` in `resources/js/i18n.ts`).
 */
function chineseLocale(tag: string) {
  if (!/^zh($|[-_])/i.test(tag)) return null
  return /(hant|[-_]tw|[-_]hk|[-_]mo)/i.test(tag) ? 'zh-TW' : 'zh-CN'
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

  // `zh`, `zh-Hans` and `zh-Hant` name one of the two Chinese translations rather than a language
  // of their own, so they are resolved before the tag is taken apart
  const chinese = chineseLocale(normalized)
  if (chinese) return chinese

  // A script subtag names a spelling of the language rather than a language of its own, and the
  // region is what tells two translations of a language apart, so the script is dropped first
  const subtags = normalized.split('-').filter((subtag) => subtag && !/^[A-Za-z]{4}$/.test(subtag))

  // The rest of the tag is looked up the way RFC 4647 does, parent language by parent language:
  // `en-GB` is `en`, and a language that is not listed is not a language the catalog keeps
  for (let index = subtags.length; index > 0; index--) {
    const match = supportedLocaleIndex().get(localeKey(subtags.slice(0, index).join('-')))
    if (match) return match
  }
  return null
}
