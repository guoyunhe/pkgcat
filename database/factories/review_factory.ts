import factory from '@adonisjs/lucid/factories'

import Review from '#models/review'

/**
 * Comments the demo reviews carry, each with the language it is written in. English carries most of
 * them, being the language the catalog falls back to; the rest are the languages of the catalog a
 * reader filters the reviews by to read the ones written in a language they know.
 */
const comments: Array<{ locale: string; text: string }> = [
  { locale: 'en', text: 'Works out of the box, no extra configuration needed.' },
  { locale: 'en', text: 'Fast and lightweight, a pleasure to use.' },
  { locale: 'en', text: 'Great app, though the UI could use some polish.' },
  { locale: 'en', text: 'Exactly what I was looking for.' },
  { locale: 'en', text: 'Reliable and well maintained, highly recommended.' },
  { locale: 'en', text: 'A bit confusing at first, but very powerful once you learn it.' },
  { locale: 'en', text: 'Crashed once or twice, otherwise solid.' },
  { locale: 'en', text: 'The best option available for this task.' },
  { locale: 'en', text: 'Documentation could be better, but the app itself is great.' },
  { locale: 'en', text: 'Nice interface and great performance.' },
  { locale: 'en', text: 'Does the job well, no complaints.' },
  { locale: 'en', text: 'I use it every day, it has become essential for me.' },
  { locale: 'en', text: 'Slightly buggy on my setup, but still useful.' },
  { locale: 'en', text: 'Simple, focused, and effective.' },
  { locale: 'en', text: 'Impressive feature set for a free tool.' },
  { locale: 'en', text: 'Not perfect, but it gets better with every release.' },
  { locale: 'zh-CN', text: '开箱即用，无需额外配置。' },
  { locale: 'zh-CN', text: '轻快好用，已经成了日常必备。' },
  { locale: 'zh-CN', text: '功能强大，但上手需要一点时间。' },
  { locale: 'zh-TW', text: '介面簡潔，用起來很順手。' },
  { locale: 'zh-TW', text: '功能完整，上手需要一點時間。' },
  { locale: 'ja', text: '設定なしですぐに使えます。' },
  { locale: 'ja', text: '動作が軽くて快適です。' },
  { locale: 'ko', text: '설정이 간단하고 실행이 빠릅니다.' },
  { locale: 'de', text: 'Läuft sofort, ohne Konfiguration.' },
  { locale: 'de', text: 'Schnell und schlank, macht Freude.' },
  { locale: 'fr', text: 'Fonctionne immédiatement, sans configuration.' },
  { locale: 'fr', text: 'Rapide et léger, agréable à utiliser.' },
  { locale: 'es', text: 'Funciona sin configurar nada.' },
  { locale: 'es', text: 'Ligero y rápido, da gusto usarlo.' },
  { locale: 'it', text: 'Funziona subito, senza configurazione.' },
  { locale: 'pt-BR', text: 'Funciona sem precisar configurar nada.' },
  { locale: 'ru', text: 'Работает сразу, без настройки.' },
]

const ratings = [5, 5, 5, 4, 4, 4, 3, 3, 5, 4, 2]

/** Languages the comments are written in, for a review that carries no comment at all. */
const locales = [...new Set(comments.map((comment) => comment.locale))]

export const ReviewFactory = factory
  .define(Review, async ({ faker }) => {
    const written = faker.helpers.arrayElement([...comments, null])
    return {
      rating: faker.helpers.arrayElement(ratings),
      comment: written?.text ?? null,
      // A review without a comment still names the language its author writes in
      locale: written?.locale ?? faker.helpers.arrayElement(locales),
    }
  })
  .build()
