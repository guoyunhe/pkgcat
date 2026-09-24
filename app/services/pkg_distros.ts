import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type { RawQueryBindings } from '@adonisjs/lucid/types/querybuilder'

import { archIndependentPackageArch } from '#utils/arch'

/**
 * The packages a release carries, read from the catalog: the release and the package.
 *
 * A release is served by its repositories, which hold the packages of its own architecture along
 * with the packages that carry no machine code and belong to every architecture of it, and it is
 * served the packages of the release it is binary compatible with as well (a release that continues
 * another one installs what the other publishes, without the other naming it). Both are settled
 * here, when the rows are written, so that a listing of a release reads the packages of that
 * release instead of resolving the repositories of the release and comparing the architecture of
 * every package it looks at.
 *
 * `narrow` is the one condition that decides which packages are read: the release they belong to,
 * or the package itself. The packages of a repository that serves a release and the release it
 * continues are read twice — once per link — which is why the rows are written with `insert
 * ignore`: a release holds a package once, and a row that is already written is left alone.
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
 * Rewrite the rows of the packages a release carries — one release, or every release of the catalog
 * when no id is named. A release whose packages were all removed ends up with no rows.
 *
 * The rows of one release are written in one transaction, so a listing of that release reads the
 * packages it carried before the rewrite or the packages it carries after it, and never an empty
 * listing in between. The releases are walked one at a time rather than written in one statement
 * for the same reason: a statement over the whole table would either hold every write of the
 * catalog behind it or leave the table empty while it runs, where a transaction per release is
 * bounded by the packages of that release.
 */
export async function refreshPackageDistros(distroId?: number) {
  const releasesQuery = db.from('distros').select('id')
  if (distroId !== undefined) releasesQuery.where('id', distroId)
  const releases = await releasesQuery

  for (const release of releases as { id: number }[]) {
    await db.transaction(async (trx) => {
      await trx.from('pkg_distros').where('distro_id', release.id).delete()
      await writePackages(trx, 'distros.id = ?', [release.id, archIndependentPackageArch])
    })
  }
}

/**
 * Rewrite the rows of one package. The architecture of a package is edited by hand, where the
 * repository it was taken from is not: a package that stops carrying machine code is carried by
 * every architecture of the release it is published in.
 */
export async function refreshPackageRows(pkgId: number) {
  await db.transaction(async (trx) => {
    await trx.from('pkg_distros').where('pkg_id', pkgId).delete()
    await writePackages(trx, 'pkgs.id = ?', [pkgId, archIndependentPackageArch])
  })
}
