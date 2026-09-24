import vine from '@vinejs/vine'

import { firstValue } from '#utils/query_params'

/** Listings of the catalog a search is made in, each of which counts its own results. */
export const searchCountTypes = ['apps', 'pkgs', 'repos', 'distros'] as const

export type SearchCountType = (typeof searchCountTypes)[number]

/**
 * The listing a count is read for, along with the search terms it is read with. Route parameters
 * are part of the data a request validates, so the listing is read from the path of the count.
 */
export const searchCountValidator = vine.create({
  params: vine.object({
    type: vine.enum(searchCountTypes),
  }),
  q: vine.string().parse(firstValue).toLowerCase().optional(),
})
