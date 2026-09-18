import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

import type App from '#models/app'
import type Distro from '#models/distro'
import type Pkg from '#models/pkg'
import type Repo from '#models/repo'

/**
 * What every listing of the catalog is found by, written once: the search terms a reader typed
 * narrow the listing of the applications, the packages, the repositories and the releases the same
 * way wherever they are read — the listing itself, and the counts the search results show beside
 * the tabs of a search.
 */

/** Pattern the terms are matched with: they are a part of a value, and what they spell means itself. */
function patternOf(terms: string) {
  return `%${terms.replace(/[\\%_]/g, '\\$&')}%`
}

/** Applications the terms name: the versions, the licenses and the identifiers they are stored with. */
export function searchApps(query: ModelQueryBuilderContract<typeof App>, terms: string) {
  const pattern = patternOf(terms)
  query.where((search) => {
    search
      // The name and the summary are translated per locale in their own table, so the search
      // covers every language an application carries. The text columns are compared through
      // `lower()` as well, because the pattern is lower-cased and their collation is the only
      // thing that would make the comparison case-insensitive otherwise.
      .whereRaw('lower(version) like ?', [pattern])
      .orWhereRaw('lower(license) like ?', [pattern])
      .orWhereRaw('lower(appstream_id) like ?', [pattern])
      .orWhereHas('aliases', (aliasQuery) =>
        aliasQuery.whereRaw('lower(appstream_id) like ?', [pattern]),
      )
      .orWhereHas('translations', (translationQuery) =>
        translationQuery
          .whereRaw('lower(name) like ?', [pattern])
          .orWhereRaw('lower(summary) like ?', [pattern]),
      )
  })
}

/** Packages the terms name: what a package is listed and looked up by. */
export function searchPkgs(query: ModelQueryBuilderContract<typeof Pkg>, terms: string) {
  const pattern = patternOf(terms)
  query.where((search) => {
    search
      .whereILike('name', pattern)
      .orWhereILike('type', pattern)
      .orWhereILike('arch', pattern)
      .orWhereILike('version', pattern)
  })
}

/** Repositories the terms name: what they are read with, and the releases they serve. */
export function searchRepos(query: ModelQueryBuilderContract<typeof Repo>, terms: string) {
  const pattern = patternOf(terms)
  query.where((search) => {
    search
      .whereILike('name', pattern)
      .orWhereILike('base_url', pattern)
      .orWhereILike('type', pattern)
      .orWhereILike('source', pattern)
      .orWhereHas('distros', (distros) => {
        distros.where((release) => {
          release
            .whereILike('name', pattern)
            .orWhereILike('version', pattern)
            .orWhereILike('arch', pattern)
        })
      })
  })
}

/**
 * Releases the terms name: what names one — the distribution, the version and the architecture it
 * is published for, and the format it packages — rather than the repositories serving it, which a
 * reader reaches through the repositories themselves.
 */
export function searchDistros(query: ModelQueryBuilderContract<typeof Distro>, terms: string) {
  const pattern = patternOf(terms)
  query.where((search) => {
    search
      .whereILike('name', pattern)
      .orWhereILike('version', pattern)
      .orWhereILike('arch', pattern)
      .orWhereILike('pkgType', pattern)
  })
}
