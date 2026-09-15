/** Lucid serializes `date` columns as a UTC ISO string; format it without timezone drift. */
export function formatDate(value: string, language: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeZone: 'UTC' }).format(date)
}

/** Counts run into the tens of thousands, so they are grouped the way the locale does it. */
export function formatCount(value: number, language: string) {
  return new Intl.NumberFormat(language).format(value)
}

/**
 * A file size, which packages report in bytes: the number is grouped the way the locale does it and
 * read as the largest unit that keeps it below a thousand, so that a package of 12 MB is not shown
 * as 12582912 bytes. The units are the same in every language.
 */
export function formatBytes(value: number, language: string) {
  const units = ['B', 'kB', 'MB', 'GB', 'TB']
  let size = value
  let unit = 0
  while (size >= 1000 && unit < units.length - 1) {
    size /= 1000
    unit += 1
  }

  const digits = unit === 0 || size >= 100 ? 0 : 1
  return `${new Intl.NumberFormat(language, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(size)} ${units[unit]}`
}
