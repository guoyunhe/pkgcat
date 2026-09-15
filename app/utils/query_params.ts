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

/**
 * Rule value of a query parameter the request spelled with a value the listing does not know. A
 * listing is reached through links and bookmarks that outlive the values it offers — a sort order
 * that was renamed, a component type that is not a type of the AppStream specification any more —
 * so such a parameter falls back to the value it behaves as instead of failing the request.
 */
export function knownValue<T extends string>(values: readonly T[], fallback?: T) {
  return (value: unknown) =>
    typeof value === 'string' && (values as readonly string[]).includes(value)
      ? (value as T)
      : fallback
}
