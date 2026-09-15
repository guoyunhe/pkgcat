import vine from '@vinejs/vine'

/** HTML forms send empty strings for unset values, and JSON clients may omit the key entirely. */
const emptyToNull = (value: unknown) => (value === '' || value === undefined ? null : value)

/**
 * Page of a listing: a positive integer, whatever the request spelled it as. A link or a bookmark
 * outlives the pages it names, so a value that is not a page number reads the page the listing
 * starts at, and a value above the maximum the listing accepts is clamped to it.
 */
export function pageNumber(
  value: unknown,
  fallback: number,
  maximum: number = Number.MAX_SAFE_INTEGER,
) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) return fallback
  return Math.min(parsed, maximum)
}

/** Locale a response is localized to; a request without one receives every translation. */
export const localeField = () => vine.string().parse(emptyToNull).trim().nullable()
