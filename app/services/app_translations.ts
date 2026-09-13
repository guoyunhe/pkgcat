import type App from '#models/app'
import AppTranslation from '#models/app_translation'
import { canonicalLocale, fallbackLocale, localeKey } from '#services/app_locales'

/**
 * Localized text of an application. Applications carry a name and a summary per locale, which used
 * to be JSON columns on `apps`: every response then carried every translation, and the name could
 * not be indexed. A client asks for one locale (`?locale=zh-CN`) and receives that locale, its base
 * language, and the language the catalog falls back to, so a listing stays small and the page still
 * has something to display for applications that do not translate the requested locale.
 */

/** Localized texts, keyed by the locale that translates them. */
export type LocalizedTexts = Record<string, string>

/** Field of a translation a localized text is read from. */
export type TranslatedField = 'name' | 'summary'

/**
 * Locales a request for one locale reads: the tag in both spellings, its base language, and the
 * fallback language. The client still picks the best of them, so nothing is lost by reading a
 * handful of locales instead of every translation of every application.
 */
export function translationCandidates(locale: string) {
  const tag = (canonicalLocale(locale) ?? locale.trim()).toLowerCase()
  if (!tag) return [fallbackLocale()]

  const base = tag.split(/[-_]/)[0]
  return [
    ...new Set([tag, tag.replace(/_/g, '-'), tag.replace(/-/g, '_'), base, fallbackLocale()]),
  ].filter((candidate) => candidate !== '')
}

/** Localized texts of a field, keyed by the locale that translates it. */
export function localizedTexts(
  translations: AppTranslation[] | undefined,
  field: TranslatedField,
): LocalizedTexts {
  const texts: LocalizedTexts = {}
  for (const translation of translations ?? []) {
    const text = translation[field]
    if (text) texts[translation.locale] = text
  }
  return texts
}

/**
 * Read the translations a response has to carry, and hand them to the applications. Without a
 * locale every translation is read, which is what the editor needs; with one, only the requested
 * locale, its base language and the fallback language are read.
 */
export async function attachTranslations(apps: App[], locale?: string | null) {
  const ids = [...new Set(apps.map((app) => app.id).filter((id) => Boolean(id)))]
  const rows = ids.length > 0 ? await readTranslations(ids, locale) : []

  const byApp = new Map<number, AppTranslation[]>()
  for (const row of rows) {
    const translations = byApp.get(row.appId) ?? []
    translations.push(row)
    byApp.set(row.appId, translations)
  }
  for (const app of apps) app.$setRelated('translations', byApp.get(app.id) ?? [])
}

async function readTranslations(ids: number[], locale?: string | null) {
  if (!locale) return AppTranslation.query().whereIn('appId', ids).orderBy('locale')

  const rows = await AppTranslation.query()
    .whereIn('appId', ids)
    .whereIn('locale', translationCandidates(locale))
    .orderBy('locale')

  // An application that translates neither the requested locale nor the fallback language still has
  // to send something to display, so its first translation is read along
  const answered = new Set(rows.map((row) => row.appId))
  const missing = ids.filter((id) => !answered.has(id))
  if (missing.length === 0) return rows

  const fallback = await AppTranslation.query().whereIn('appId', missing).orderBy('locale')
  const first = new Map<number, AppTranslation>()
  for (const row of fallback) if (!first.has(row.appId)) first.set(row.appId, row)
  return [...rows, ...first.values()]
}

/**
 * Replace the translations of an application with the ones a request carries. The editor sends
 * every locale it knows, so a locale that is no longer translated is removed, while a locale that
 * translates only one of the two fields keeps the other one. Languages the catalog does not keep
 * are dropped instead of stored: metadata asks for languages of its own (`sr@ijekavianlatin`),
 * which are not translated by anyone and which the locale column has no room for.
 */
export async function replaceTranslations(
  app: App,
  name: LocalizedTexts = {},
  summary: LocalizedTexts = {},
) {
  const wanted = new Map<string, { locale: string; name: string | null; summary: string | null }>()
  const collect = (texts: LocalizedTexts, field: TranslatedField) => {
    for (const [tag, text] of Object.entries(texts)) {
      const trimmed = typeof text === 'string' ? text.trim() : ''
      if (!trimmed) continue

      const locale = canonicalLocale(tag)
      if (!locale) continue

      const key = localeKey(locale)
      const entry = wanted.get(key) ?? { locale, name: null, summary: null }
      entry[field] = trimmed
      wanted.set(key, entry)
    }
  }
  collect(name, 'name')
  collect(summary, 'summary')

  const stored = await AppTranslation.query().where('appId', app.id)
  const known = new Map<string, AppTranslation>()
  for (const row of stored) {
    const key = localeKey(row.locale)
    if (wanted.has(key)) {
      known.set(key, row)
      continue
    }
    await row.delete()
  }

  for (const [key, texts] of wanted) {
    const row = known.get(key)
    if (row) {
      row.merge({ name: texts.name, summary: texts.summary })
      await row.save()
      continue
    }
    await AppTranslation.create({
      appId: app.id,
      locale: texts.locale,
      name: texts.name,
      summary: texts.summary,
    })
  }
}
