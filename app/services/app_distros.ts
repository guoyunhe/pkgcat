import db from '@adonisjs/lucid/services/db'

import type App from '#models/app'

/**
 * Names of the distributions whose packages provide the applications, read for every application at
 * once and unique: a distribution provides an application once, however many of its packages or
 * architectures carry it. A listing of applications draws an icon from each name, which it reads
 * from the extras of the entry rather than from a relation.
 */
export async function attachDistroNames(apps: App[]) {
  if (apps.length === 0) return

  const rows = (await db
    .from('pkg_distros')
    .join('app_pkgs', 'app_pkgs.pkg_id', 'pkg_distros.pkg_id')
    .join('distros', 'distros.id', 'pkg_distros.distro_id')
    .whereIn(
      'app_pkgs.app_id',
      apps.map((app) => app.id),
    )
    .distinct('app_pkgs.app_id', 'distros.name')
    .orderBy('distros.name')) as Array<{ app_id: number; name: string }>

  const names = new Map<number, string[]>()
  for (const row of rows) {
    const appId = Number(row.app_id)
    const distroNames = names.get(appId) ?? []
    distroNames.push(row.name)
    names.set(appId, distroNames)
  }

  for (const app of apps) app.$extras.distroNames = names.get(app.id) ?? []
}
