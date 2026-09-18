import { scope } from '@adonisjs/lucid/orm'
import type { LucidModel, ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

/**
 * Pattern the terms of a search are matched with: what a reader typed is a part of a value rather
 * than the whole of it, and the characters a `like` reads as wildcards (`\`, `%` and `_`) mean
 * themselves.
 */
function likePattern(terms: string) {
  return `%${terms.replace(/[\\%_]/g, '\\$&')}%`
}

/**
 * What a model writes for the scope that narrows a listing of the catalog to the entries the terms
 * of a search name. The handler writes the columns its own listing is found by, and is handed the
 * pattern to match them with.
 *
 * Every query narrowed by search terms narrows with the scope of its model — the listings
 * themselves, and the counts the search results show — so that what a listing finds and what its
 * count counts cannot drift apart.
 */
export function searchScope<Model extends LucidModel>(
  handler: (query: ModelQueryBuilderContract<Model>, pattern: string) => void,
) {
  return scope<Model, (query: ModelQueryBuilderContract<Model>, terms: string) => void>(
    (query, terms) => handler(query, likePattern(terms)),
  )
}
