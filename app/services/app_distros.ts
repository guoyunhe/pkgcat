import db from '@adonisjs/lucid/services/db'

import type App from '#models/app'

/**
 * Names of the distributions whose packages provide the applications, read for every application at
 * once and unique: a distribution provides an application once, however many of its packages or
 * architectures carry it. A listing of applications draws an icon from each name, which it reads
 * from the extras of the entry rather than from a relation.
 *
 * The same read tells which distributions are supported only through a community or user repository
 * — an OBS project or a PPA — rather than by the distribution or a vendor. A distribution counts as
 * official as soon as one of its releases ships the application in an official repository, and a
 * listing flags the remaining ones.
 */
export async function attachDistroNames(apps: App[]) {
  if (apps.length === 0) return

  const rows = (await db
    .from('pkg_distros')
    .join('app_pkgs', 'app_pkgs.pkg_id', 'pkg_distros.pkg_id')
    .join('distros', 'distros.id', 'pkg_distros.distro_id')
    .join('pkgs', 'pkgs.id', 'pkg_distros.pkg_id')
    .leftJoin('repos', 'repos.id', 'pkgs.repo_id')
    .whereIn(
      'app_pkgs.app_id',
      apps.map((app) => app.id),
    )
    .select('app_pkgs.app_id', 'distros.name')
    .select(
      db.raw("max(case when repos.source in ('distro', 'vendor') then 1 else 0 end) as `official`"),
    )
    .groupBy('app_pkgs.app_id', 'distros.name')
    .orderBy('distros.name')) as Array<{
    app_id: number
    name: string
    official: number | string
  }>

  const distros = new Map<number, { names: string[]; unofficial: string[] }>()
  for (const row of rows) {
    const appId = Number(row.app_id)
    const entry = distros.get(appId) ?? { names: [], unofficial: [] }
    entry.names.push(row.name)
    if (!Number(row.official)) entry.unofficial.push(row.name)
    distros.set(appId, entry)
  }

  for (const app of apps) {
    const entry = distros.get(app.id) ?? { names: [], unofficial: [] }
    app.$extras.distroNames = entry.names
    app.$extras.unofficialDistroNames = entry.unofficial
  }
}
