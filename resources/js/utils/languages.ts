/**
 * Languages the catalog keeps. The application shell assigns them to the page
 * (`resources/views/app.edge`), so a page knows them without asking for them, and the list itself
 * is configured once, in `config/i18n.ts`.
 */
declare global {
  interface Window {
    /** Languages an application can be translated into, in the order the server lists them. */
    supportedLocales?: string[]
    /** Language a translation falls back to, which is the interface's default language as well. */
    defaultLocale?: string
  }
}

/** Languages the catalog keeps, which the application shell assigned to the page. */
export function supportedLocales(): string[] {
  return window.supportedLocales ?? []
}

/** Language used when the requested locale has no translation at all. */
export function fallbackLanguage() {
  return window.defaultLocale ?? ''
}

/**
 * Script implied by a language tag, keyed by base language then region (with `*` as the fallback
 * for tags without a region). Kept as data so language matching stays generic.
 */
const scriptHints: Record<string, Record<string, string>> = {
  zh: { '*': 'hans', cn: 'hans', hk: 'hant', mo: 'hant', my: 'hans', sg: 'hans', tw: 'hant' },
}

/** Script implied by a base language and optional region, if any. */
export function scriptForRegion(base: string, region: string | undefined) {
  const hints = scriptHints[base]
  if (!hints) return undefined
  return region ? (hints[region] ?? hints['*']) : hints['*']
}

/**
 * Name of a language in that language itself (`日本語`, `Deutsch`, `中文（中国）`), which is what a reader
 * of it recognizes, whichever language the interface is shown in.
 */
export function languageLabel(tag: string) {
  try {
    return new Intl.DisplayNames([tag], { type: 'language' }).of(tag) ?? tag
  } catch {
    return tag
  }
}

export type LanguageOption = {
  label: string
  value: string
}

function dedupe(tags: string[]) {
  const seen = new Set<string>()
  const result: string[] = []
  for (const tag of tags) {
    const value = tag.trim()
    if (!value || seen.has(value.toLowerCase())) continue
    seen.add(value.toLowerCase())
    result.push(value)
  }
  return result
}

/**
 * Language tags offered by a form: the ones the data already translates first, so the form lists
 * what the application carries before the rest of the languages of the catalog. The label carries
 * the tag itself so the list can be searched by code.
 */
export function languageOptions(
  used: string[],
  locales: string[] = supportedLocales(),
): LanguageOption[] {
  return dedupe([...used, ...locales]).map((value) => ({
    value,
    label: `${languageLabel(value)} (${value})`,
  }))
}

/** Picks the language a form starts with: the data's own language, else the interface language. */
export function defaultLanguage(
  used: string[],
  uiLanguage?: string,
  locales: string[] = supportedLocales(),
) {
  const pool = dedupe([...used, ...locales])
  const wanted = uiLanguage?.toLowerCase()
  const exact = wanted ? pool.find((tag) => tag.toLowerCase() === wanted) : undefined
  const base = wanted?.split('-')[0]
  const interfaceLanguage = base ? pool.find((tag) => tag.toLowerCase() === base) : undefined
  return used[0] ?? exact ?? interfaceLanguage ?? locales[0] ?? uiLanguage ?? ''
}
