import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type { RawQueryBindings } from '@adonisjs/lucid/types/querybuilder'

import { archIndependentPackageArch } from '#utils/arch'

/**
 * The packages a release carries, read from the catalog: its repositories (with the packages that
 * carry no machine code, which belong to every architecture) and the release it is binary
 * compatible with. Both are resolved here, when the rows are written, so that a listing of a
 * release does not resolve them for every request. `narrow` decides which packages are read, and a
 * package both links name is written once (`insert ignore`).
 */
function catalogPackages(narrow: string) {
  return `
    select distros.id, pkgs.id
    from distros
    join distro_repos
      on distro_repos.distro_id = distros.id
      or distro_repos.distro_id = distros.compatible_distro_id
    join pkgs on pkgs.repo_id = distro_repos.repo_id
    where ${narrow}
      and (pkgs.arch = distros.arch or pkgs.arch = ? or pkgs.arch is null)
  `
}

/** Write the rows of the packages one release carries, or the row of one package. */
async function writePackages(
  client: TransactionClientContract,
  narrow: string,
  bindings: RawQueryBindings,
) {
  await client.rawQuery(
    `insert ignore into pkg_distros (distro_id, pkg_id) ${catalogPackages(narrow)}`,
    bindings,
  )
}

/**
 * Add the rows of the packages a release carries — one release, or every release of the catalog
 * when no id is named. Existing links are preserved because a package may support releases its
 * repository does not serve.
 */
export async function refreshPackageDistros(distroId?: number) {
  const releasesQuery = db.from('distros').select('id')
  if (distroId !== undefined) releasesQuery.where('id', distroId)
  const releases = await releasesQuery

  for (const release of releases as { id: number }[]) {
    await db.transaction(async (trx) => {
      await writePackages(trx, 'distros.id = ?', [release.id, archIndependentPackageArch])
    })
  }
}
