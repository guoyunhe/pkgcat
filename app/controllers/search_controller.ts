import type { HttpContext } from '@adonisjs/core/http'
import type { LucidModel, ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

import App from '#models/app'
import Distro from '#models/distro'
import Pkg from '#models/pkg'
import Repo from '#models/repo'
import { searchCountValidator, type SearchCountType } from '#validators/search'

/**
 * One counted row: the database answers a total as a number, which the driver may spell as a
 * string.
 */
type CountRow = { total: string | number }

/**
 * How many rows one listing of the catalog holds, once its query has been narrowed the way the
 * listing itself narrows.
 */
function total<Model extends LucidModel>(
  query: ModelQueryBuilderContract<Model>,
  terms: string,
  narrow: (query: ModelQueryBuilderContract<Model>) => void,
) {
  if (terms) narrow(query)
  return query.pojo<CountRow>().count('* as total')
}

/**
 * How many rows each listing of the catalog holds for the terms of a search. The listing of a tab
 * is counted on its own, so that one that is slow to count holds back no other tab, and the query
 * is narrowed by the scope the listing itself narrows with, so that a count is the total the
 * listing it counts would report.
 */
const countTotals: Record<SearchCountType, (terms: string) => Promise<CountRow[]>> = {
  apps: (terms) =>
    total(App.query(), terms, (query) => query.apply((scopes) => scopes.search(terms))),
  pkgs: (terms) =>
    total(Pkg.query(), terms, (query) => query.apply((scopes) => scopes.search(terms))),
  repos: (terms) =>
    total(Repo.query(), terms, (query) => query.apply((scopes) => scopes.search(terms))),
  distros: (terms) =>
    total(Distro.query(), terms, (query) => query.apply((scopes) => scopes.search(terms))),
}

export default class SearchController {
  /**
   * How many entries one listing of the catalog holds for the terms a search was made with, which
   * the tab of that listing shows. Each tab reads its own count, so that a listing that is slow to
   * count holds back no other tab: a tab is counted whether or not its listing has been opened, and
   * what a listing was narrowed by on its own page is not part of the search.
   */
  async count({ request, serialize }: HttpContext) {
    const {
      params: { type },
      q,
    } = await request.validateUsing(searchCountValidator)

    const rows = await countTotals[type](q ?? '')

    return serialize({ count: Number(rows[0].total) })
  }
}
