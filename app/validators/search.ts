import vine from '@vinejs/vine'

import { firstValue } from '#utils/query_params'

/** Search terms a listing of the catalog is narrowed by, which the counts of a search are read with. */
export const searchCountsValidator = vine.create({
  q: vine.string().parse(firstValue).toLowerCase().optional(),
})
