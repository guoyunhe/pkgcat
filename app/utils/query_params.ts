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

/**
 * Page size of a listing: how many entries one page of it holds. A listing that asks for none (`0`)
 * is not paged at all and receives every entry, which is how a field that picks one entry out of
 * the catalog reads it; anything else is a positive integer the listing reads at most.
 */
export function pageSize(value: unknown, fallback: number, maximum: number) {
  const spelled = firstValue(value)
  if (spelled === undefined) return fallback
  return Number(spelled) === 0 ? 0 : pageNumber(spelled, fallback, maximum)
}

/**
 * Single value of a query parameter that narrows a listing. A request may spell such a parameter
 * once, repeat it, or leave it empty, and an empty value narrows nothing.
 */
export function firstValue(value: unknown) {
  if (typeof value === 'string') return value.trim() || undefined
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === 'string' && item.trim() !== '')
    return typeof first === 'string' ? first.trim() : undefined
  }
  return undefined
}

/** Positive integer a query parameter names; a value that is not one narrows nothing. */
export function positiveInteger(value: unknown) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
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
