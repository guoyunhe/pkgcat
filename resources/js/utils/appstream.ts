import {
  parseAppStreamComponent,
  type Component,
  type Localized,
  type Screenshot,
  type ScreenshotImage,
} from '@guoyunhe/appstream'

import { fallbackLanguage, scriptForRegion } from './languages'

/** A screenshot flattened into the image the carousel displays. */
export type AppStreamScreenshot = {
  caption: Localized<string> | null
  height: number | null
  language: string | null
  url: string
  width: number | null
}

/**
 * AppStream metadata of a stored `appstreamContent`. The content is an AppStream document, so it is
 * read with the same parser the repositories are read with. Descriptions it returns already keep
 * only the markup AppStream allows, which is what makes them safe to render. Malformed content
 * returns `null`, because the page still has to render.
 */
export function parseAppStreamContent(content: string | null | undefined): Component | null {
  if (!content?.trim()) return null

  try {
    return parseAppStreamComponent(content) ?? null
  } catch {
    return null
  }
}

/**
 * Splits a language tag such as `zh-Hans-CN` into its base language and script, resolving scripts
 * that are encoded as a region (`zh-TW`) through the shared language configuration.
 */
function languageParts(tag: string) {
  const subtags = tag.toLowerCase().split(/[-_]/).filter(Boolean)
  const base = subtags[0] ?? ''
  let script = subtags.find((subtag, index) => index > 0 && subtag.length === 4)
  if (!script) {
    const region = subtags.find((subtag, index) => index > 0 && subtag.length <= 3)
    script = scriptForRegion(base, region)
  }
  return { base, script }
}

/** Scores how well a translation tag matches the requested locale: 2 exact-ish, 1 loose, 0 no match. */
function languageScore(tag: string, language: string) {
  const wanted = languageParts(language)
  const candidate = languageParts(tag)
  if (!candidate.base || candidate.base !== wanted.base) {
    return 0
  }
  if (candidate.script && wanted.script) {
    return candidate.script === wanted.script ? 2 : 1
  }
  return 2
}

/** Returns the translation tag that matches the locale best, or `undefined` when nothing matches. */
function bestLanguageKey(keys: string[], language: string) {
  let best: { key: string; score: number } | undefined
  for (const key of keys) {
    const score = languageScore(key, language)
    if (score > 0 && (!best || score > best.score)) {
      best = { key, score }
    }
  }
  return best?.key
}

function fallbackKey(keys: string[]) {
  return keys.find((key) => key.toLowerCase() === fallbackLanguage())
}

/** Picks the value matching the locale, falling back to the default language, then to any value. */
export function localized<T>(
  translations: Localized<T> | null | undefined,
  language: string,
): T | undefined {
  if (!translations) {
    return undefined
  }
  const keys = Object.keys(translations)
  const key = bestLanguageKey(keys, language) ?? fallbackKey(keys)
  return key ? translations[key] : Object.values(translations)[0]
}

/** Returns the description HTML in the requested language, or an empty string. */
export function resolveDescription(component: Component | null, language: string) {
  const description = component?.description
  return (description && localized(description, language)) || ''
}

/**
 * Image of a screenshot that fits the requested locale best: a translation that matches wins over
 * the untranslated image, which in turn wins over an image translated to another language.
 * Thumbnails are only used when the screenshot declares no source image.
 */
function screenshotImage(screenshot: Screenshot, language: string): ScreenshotImage | null {
  const images = screenshot.images.filter((image) => image.url)
  if (images.length === 0) return null

  const sources = images.filter((image) => image.type !== 'thumbnail')
  let best: { image: ScreenshotImage; rank: number } | null = null

  for (const image of sources.length > 0 ? sources : images) {
    const rank = image.locale ? (languageScore(image.locale, language) > 0 ? 2 : 0) : 1
    if (!best || rank > best.rank) best = { image, rank }
  }

  return best?.image ?? null
}

/**
 * Keeps the screenshots translated to the requested language (plus the untranslated ones), falling
 * back to the default language, then to every screenshot when no translation matches.
 */
export function selectScreenshots(
  screenshots: Screenshot[],
  language: string,
): AppStreamScreenshot[] {
  const selected: AppStreamScreenshot[] = []
  const scores = new Map<AppStreamScreenshot, number>()
  let best = 0

  for (const screenshot of screenshots) {
    const image = screenshotImage(screenshot, language)
    if (!image) continue

    const slide: AppStreamScreenshot = {
      caption: screenshot.caption ?? null,
      height: image.height ?? null,
      language: image.locale ?? null,
      url: image.url,
      width: image.width ?? null,
    }
    const score = image.locale ? languageScore(image.locale, language) : 0
    scores.set(slide, score)
    if (score > best) best = score
    selected.push(slide)
  }

  if (best > 0) {
    return selected.filter((slide) => !slide.language || scores.get(slide) === best)
  }

  const fallback = selected.filter(
    (slide) => slide.language && languageScore(slide.language, fallbackLanguage()) > 0,
  )
  return fallback.length > 0 ? fallback : selected
}
