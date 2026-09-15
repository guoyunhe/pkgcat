/** Numbers a listing reports about the page of it a request read, the way Lucid reports them. */
export type PageMeta = {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
  firstPage: number
  firstPageUrl: string
  lastPageUrl: string
  nextPageUrl: string | null
  previousPageUrl: string | null
}

/** One page of a listing, and the numbers that say which page of how many it is. */
export type Page<Entry> = { entries: Entry[]; meta: PageMeta }

/**
 * Address of a page, which a listing that is read from the database reports next to its numbers.
 * Every listing reports it the same way, without naming a host: the client reads the page it wants
 * from the numbers, not from these.
 */
function pageUrl(page: number) {
  return `/?page=${page}`
}

/**
 * Cut one page out of an ordered listing. This is how the listings that are ordered by a count
 * their database does not hold are paged: the page is cut after the whole listing has been read and
 * ordered, so the entries have to be handed over in the order they are shown in. A page size of
 * zero lists everything at once, which is how a field that picks one entry out of the catalog reads
 * it, and a page beyond the last one reads as empty rather than as an error, like the listings the
 * database pages itself.
 */
export function pageOf<Entry>(entries: Entry[], page: number, perPage: number): Page<Entry> {
  const total = entries.length
  const lastPage = perPage === 0 ? 1 : Math.max(1, Math.ceil(total / perPage))
  const currentPage = perPage === 0 ? 1 : page

  return {
    entries: perPage === 0 ? entries : entries.slice((page - 1) * perPage, page * perPage),
    meta: {
      total,
      perPage: perPage === 0 ? total : perPage,
      currentPage,
      lastPage,
      firstPage: 1,
      firstPageUrl: pageUrl(1),
      lastPageUrl: pageUrl(lastPage),
      nextPageUrl: currentPage < lastPage ? pageUrl(currentPage + 1) : null,
      previousPageUrl: currentPage > 1 ? pageUrl(currentPage - 1) : null,
    },
  }
}
