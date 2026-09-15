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
