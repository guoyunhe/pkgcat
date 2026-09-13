import app from '@adonisjs/core/services/app'
import { defineConfig, formatters, loaders } from '@adonisjs/i18n'

const i18nConfig = defineConfig({
  defaultLocale: 'en',

  /**
   * Languages of the application. One list serves all three of them: the interface is translated
   * into a few of these languages (`resources/lang`) and falls back to `defaultLocale` for the
   * rest, the API hands the list to the editor (`GET /api/locales`), and the catalog stores the
   * name and the summary of an application in any of them.
   *
   * AppStream metadata spells its languages the glibc way and asks for variants the catalog has no
   * use for, so every tag is normalized to this list on its way in: the modifier is dropped
   * (`sr@ijekavianlatin` is `sr`), the separator and the casing are normalized (`zh_CN` is
   * `zh-CN`), a script is dropped to keep the region (`zh-Hans-CN` is `zh-CN`), and a region that
   * is not listed falls back to its base language (`en-GB` is `en`). A language that is not listed
   * at all is refused by the API and dropped by the repository sync.
   */
  supportedLocales: [
    'en',
    'zh-CN',
    'zh-TW',
    'zh',
    'ja',
    'ko',
    'de',
    'fr',
    'es',
    'pt',
    'pt-BR',
    'it',
    'ru',
    'uk',
    'pl',
    'nl',
    'sv',
    'da',
    'nb',
    'nn',
    'fi',
    'is',
    'cs',
    'sk',
    'sl',
    'hr',
    'bs',
    'sr',
    'mk',
    'bg',
    'ro',
    'hu',
    'el',
    'tr',
    'az',
    'hy',
    'ka',
    'he',
    'ar',
    'fa',
    'ur',
    'hi',
    'bn',
    'pa',
    'gu',
    'mr',
    'ta',
    'te',
    'kn',
    'ml',
    'si',
    'ne',
    'th',
    'lo',
    'km',
    'my',
    'vi',
    'id',
    'ms',
    'tl',
    'sw',
    'am',
    'af',
    'sq',
    'be',
    'ca',
    'cy',
    'et',
    'eu',
    'ga',
    'gl',
    'kk',
    'ky',
    'lt',
    'lv',
    'mn',
    'uz',
    'tg',
    'eo',
  ],

  formatter: formatters.icu(),

  loaders: [
    /**
     * The fs loader will read translations from the "resources/lang" directory.
     *
     * Each subdirectory represents a locale. For example:
     *
     * - "resources/lang/en"
     * - "resources/lang/fr"
     * - "resources/lang/it"
     */
    loaders.fs({
      location: app.languageFilesPath(),
    }),
  ],
})

export default i18nConfig
