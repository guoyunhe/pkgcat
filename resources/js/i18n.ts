import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import HttpBackend from 'i18next-http-backend'
import { initReactI18next } from 'react-i18next'

import { fallbackLanguage, supportedLocales } from './utils/languages'

/**
 * Collapses any detected Chinese tag (`zh`, `zh-Hans-CN`, `zh-Hant-HK`, …) onto one of the two
 * Chinese translations. Traditional scripts and the TW/HK/MO regions map to `zh-TW`.
 */
export function normalizeLanguage(language: string) {
  const tag = language.toLowerCase()
  if (!tag.startsWith('zh')) {
    return tag
  }
  return /(hant|[-_]tw|[-_]hk|[-_]mo)/.test(tag) ? 'zh-TW' : 'zh-CN'
}

/**
 * Languages of the interface, which are the languages of the whole application, declared once in
 * `config/i18n.ts` and assigned to the page by the application shell. The translations of a
 * language are read over HTTP as the language is first used (`public/locales`), so translating the
 * interface or adding a language needs no rebuild of the bundle.
 */
export const i18nReady = i18n
  .use(LanguageDetector)
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    supportedLngs: supportedLocales(),
    load: 'currentOnly',
    fallbackLng: fallbackLanguage() || 'en',
    interpolation: { escapeValue: false },
    backend: {
      loadPath: '/locales/{{lng}}.json',
      /**
       * A language the interface is not translated into yet has no file, and the application shell
       * answers that request with itself. Reading no translations lets i18next serve the fallback
       * language, where a broken response would be reported as a failure instead.
       */
      parse: (data: string) => {
        try {
          return JSON.parse(data)
        } catch {
          return {}
        }
      },
    },
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      caches: ['localStorage'],
      convertDetectedLanguage: normalizeLanguage,
    },
  })
  .then(() => {
    document.documentElement.lang = i18n.resolvedLanguage ?? 'en'
  })

i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language
})

export default i18n
