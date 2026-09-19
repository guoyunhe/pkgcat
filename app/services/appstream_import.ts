import type { Readable } from 'node:stream'

import { Exception } from '@adonisjs/core/exceptions'
import { parseAppStreamComponent, type Component, type Localized } from '@guoyunhe/appstream'

import { canonicalLocale, localeRank } from '#services/app_locales'
import {
  appstreamHomepage,
  appstreamVersion,
  canonicalAppstreamId,
  canonicalAppType,
} from '#services/repo_appstream_extractor'
import { downloadStream } from '#utils/download'

/**
 * Editing an application starts from its AppStream metadata: the editor reads the document a URL
 * publishes, or a file of its own, and fills the form out of it. Both happen through this service,
 * so that the editor and the importer of the repositories read the metadata the same way.
 */

/** Largest AppStream document the editor imports. Repositories publish files of a few kilobytes. */
const maxAppstreamSize = 4 * 1024 * 1024

/**
 * URL a metadata document is read from. Only the two schemes a page could fetch as well are
 * accepted, so that the server is never asked to read a file of its own (`file:`) or of a service
 * it sits behind (`gopher:`, `data:`).
 */
export function appstreamUrl(url: string) {
  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    throw new Exception('The AppStream URL is not a valid URL', { status: 422 })
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Exception('The AppStream URL must be an http or https URL', { status: 422 })
  }

  return parsed.toString()
}

/**
 * Read the AppStream metadata a URL publishes. The document is read by the server because it lives
 * on hosts that do not answer a request from a page, and it is read as a stream, so that a URL
 * pointing at something other than metadata fails instead of filling the memory of the server.
 */
export async function fetchAppStream(url: string) {
  // The URL is checked before the download, so that a URL that is refused is reported as such
  // rather than as a download that failed
  const target = appstreamUrl(url)

  let stream: Readable
  try {
    stream = await downloadStream(target)
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'the request failed'
    throw new Exception(`Unable to read the AppStream URL: ${reason}`, {
      status: 422,
      cause: error,
    })
  }

  const parts: Buffer[] = []
  let size = 0
  for await (const piece of stream) {
    size += piece.length
    if (size > maxAppstreamSize) {
      stream.destroy()
      throw new Exception('The AppStream URL publishes more than 4 MB', { status: 422 })
    }
    parts.push(piece)
  }

  return Buffer.concat(parts).toString('utf8')
}

/**
 * Localized texts of a component, keyed by the locale the catalog stores them under. Metadata asks
 * for languages of its own (`sr@ijekavianlatin`), and several tags name one language (`en` next to
 * `en-GB` and `en-Shaw`), so a text is kept only when the catalog keeps its language and the
 * language's own spelling wins over a spelling of it in another alphabet — the rule the importer of
 * the repositories follows as well.
 */
function localizedLocales(texts: Localized<string> | undefined) {
  const localized: Record<string, string> = {}
  const entries = Object.entries(texts ?? {}).sort(
    ([left], [right]) => localeRank(left) - localeRank(right),
  )

  for (const [tag, text] of entries) {
    const trimmed = typeof text === 'string' ? text.trim() : ''
    if (!trimmed) continue

    const locale = canonicalLocale(tag)
    if (locale) localized[locale] = trimmed
  }

  return localized
}

/** Fields of an application the AppStream metadata of a component declares. */
export type AppStreamFields = {
  /** Name of the component per locale, keyed the way the catalog spells the locale. */
  name: Record<string, string>
  /** Summary of the component per locale, keyed the way the catalog spells the locale. */
  summary: Record<string, string>
  type: string
  version: string | null
  license: string | null
  homepage: string | null
  appstreamId: string | null
}

/**
 * Fields an AppStream document declares, keyed the way the editor and the API spell them, or `null`
 * when the document is no AppStream component. Only what the metadata actually declares is
 * returned, so that filling a form out of it never blanks a field the metadata says nothing about.
 */
export function appStreamFields(content: string): AppStreamFields | null {
  let component: Component | undefined
  try {
    component = parseAppStreamComponent(content)
  } catch {
    return null
  }
  if (!component) return null

  return {
    name: localizedLocales(component.name),
    summary: localizedLocales(component.summary),
    type: canonicalAppType(component.type),
    version: appstreamVersion(component),
    license: component.projectLicense?.trim() || null,
    homepage: appstreamHomepage(component),
    appstreamId: canonicalAppstreamId(component.id) || null,
  }
}
