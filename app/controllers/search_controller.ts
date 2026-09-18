import type { HttpContext } from '@adonisjs/core/http'

import App from '#models/app'
import Distro from '#models/distro'
import Pkg from '#models/pkg'
import Repo from '#models/repo'
import { searchApps, searchDistros, searchPkgs, searchRepos } from '#services/catalog_search'
import { searchCountsValidator } from '#validators/search'

/**
 * One counted row: the database answers a total as a number, which the driver may spell as a
 * string.
 */
type CountRow = { total: string | number }

export default class SearchController {
  /**
   * How many entries the listings of the catalog hold for the terms a search was made with, which
   * the tabs of the search results show. The four are counted together and by the terms alone: a
   * tab is counted whether or not its listing has been opened, and what a listing was narrowed by
   * on its own page is not part of the search.
   */
  async counts({ request, serialize }: HttpContext) {
    const { q } = await request.validateUsing(searchCountsValidator)
    const terms = q ?? ''

    // The queries are narrowed the way the listings themselves are (`#services/catalog_search`), so
    // a count is the total the listing it counts would report
    const appsQuery = App.query()
    const pkgsQuery = Pkg.query()
    const reposQuery = Repo.query()
    const distrosQuery = Distro.query()
    if (terms) {
      searchApps(appsQuery, terms)
      searchPkgs(pkgsQuery, terms)
      searchRepos(reposQuery, terms)
      searchDistros(distrosQuery, terms)
    }

    const [apps, pkgs, repos, distros] = await Promise.all([
      appsQuery.pojo<CountRow>().count('* as total'),
      pkgsQuery.pojo<CountRow>().count('* as total'),
      reposQuery.pojo<CountRow>().count('* as total'),
      distrosQuery.pojo<CountRow>().count('* as total'),
    ])

    return serialize({
      apps: Number(apps[0].total),
      pkgs: Number(pkgs[0].total),
      repos: Number(repos[0].total),
      distros: Number(distros[0].total),
    })
  }
}
