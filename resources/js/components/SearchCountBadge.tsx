import { useEffect, useState } from 'react'

import { getSearchCount, type SearchCountType } from '../services/search'
import CountBadge from './CountBadge'

type SearchCountBadgeProps = {
  /** Terms the search was made with, which the count is read for. */
  terms: string
  /** Listing the count is read for. */
  type: SearchCountType
}

/**
 * Number of results of a tab, which every tab reads for itself. The counts are read one at a time
 * so that a listing that is slow to count holds back no other tab of the search results.
 */
export default function SearchCountBadge({ terms, type }: SearchCountBadgeProps) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let active = true

    setCount(null)
    getSearchCount(type, terms)
      .then((next) => {
        if (active) setCount(next)
      })
      .catch(() => {
        // A count that could not be read keeps the tab waiting, which the listing it opens says
      })

    return () => {
      active = false
    }
  }, [terms, type])

  return <CountBadge count={count ?? undefined} loading={count === null} />
}
