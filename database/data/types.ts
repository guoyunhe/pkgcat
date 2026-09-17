/**
 * Shape of the seed data of the catalog. The data itself lives next to this file, one file per kind
 * of record, and the seeders of `database/seeders` only write what they read here.
 */

/** One entry of the catalog: a distribution is one release for one architecture. */
export type DistroSelector = {
  name: string
  version: string | null
  arch: string
}

/** Release a distribution continues, named the way the entries of the catalog are. */
export type DistroCompatibility = {
  name: string
  version: string | null
}

/** One release of the catalog, with the architectures it is published for. */
export type DistroSeed = {
  name: string
  version: string | null
  /** Package format of the release, or `null` when no extractor reads its packages. */
  pkgType: string | null
  /** Architectures the release is published for; every one of them is an entry of its own. */
  arches: string[]
  releaseDate: string | null
  eolDate: string | null
  /** Release whose packages install on this one as well, and the other way around. */
  compatibleWith?: DistroCompatibility
}

/** One repository of the catalog, with the releases that install from it. */
export type RepoSeed = {
  name: string
  type: string
  /** Who publishes the repository: the distribution itself, its community, or a vendor. */
  source: string
  baseUrl: string
  /** Days between two synchronizations, or `null` for a repository only read when forced. */
  syncIntervalDays: number | null
  /** Releases that install from the repository, which are entries of the catalog. */
  distros: DistroSelector[]
  configContent?: string
  configUrl?: string
  installScript?: string
}

/** One entry of the category registry: the code AppStream components carry and its parent. */
export type CategorySeed = {
  code: string
  parent: string | null
}
