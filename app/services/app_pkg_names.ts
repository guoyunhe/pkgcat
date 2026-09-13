/**
 * Package names an application owns. Repositories ship many packages that no AppStream metadata
 * mentions, and a name mapped here is what the import uses to link them to the application.
 *
 * The name is only unique together with the package format, where an empty format is the mapping
 * for every format. A mapping for an explicit format wins over it, so that a name that means one
 * application as a deb and another one as an rpm can be mapped twice.
 */

import AppPkgName from '#models/app_pkg_name'

/** Key two package name mappings are compared under. The empty format is the wildcard one. */
export function pkgNameKey(name: string, type: string) {
  // Package names are case-sensitive to the package managers, but the database compares them
  // case-insensitively (`utf8mb4_*_ci`), so the comparisons made here have to as well
  return `${name.toLowerCase()}\u0000${type}`
}

/** Package name mapping of a name and format, read from a request or from the database. */
export type PkgNameMapping = {
  name: string
  /** Package format the mapping is limited to; an empty string means every format. */
  type: string
}

/** Whether a name is already mapped to an application, ignoring the one that is being edited. */
export async function pkgNameIsClaimed(name: string, type: string, exceptAppId?: number | null) {
  const query = AppPkgName.query().where('name', name).where('type', type)
  if (exceptAppId) query.whereNot('appId', exceptAppId)
  return Boolean(await query.first())
}

/**
 * Application a package belongs to by its name, or `null` when no mapping applies. A mapping for
 * the package format is more precise than one for every format, so it wins when both name the
 * package.
 */
export function mappedAppId(mappings: AppPkgName[], name: string, type: string) {
  const matching = mappings.filter((mapping) => mapping.name.toLowerCase() === name.toLowerCase())
  const exact = matching.find((mapping) => mapping.type === type)
  if (exact) return exact.appId
  return matching.find((mapping) => mapping.type === '')?.appId ?? null
}
