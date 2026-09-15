import db from '@adonisjs/lucid/services/db'

import { archIndependentPackageArches, belongsToArch } from '#utils/arch'

/** How many packages something holds, and how many applications those packages provide. */
export type PackageCounts = { pkgCount: number; appCount: number }

/** Order a listing can be read in; `name` keeps the order the listing query returned. */
export type CountSort = 'name' | 'packages' | 'apps'

type RepoCountRow = { repoId: number; pkgCount: string | number; appCount?: string | number }

type DistroCountRow = { distroId: number; appCount: string | number }

type LinkedRepoRow = { distroId: number; repoId: number }

type DistroArchRow = { distroId: number; arch: string }

type RepoArchPackageRow = { repoId: number; arch: string | null; pkgCount: string | number }

/**
 * Counts of the packages each repository holds, and of the applications those packages provide. The
 * two are read separately: a package belongs to exactly one repository, while an application may be
 * provided by the packages of several of them, so the application count has to be told apart by the
 * database instead of being summed up afterwards.
 */
export async function repoCounts(): Promise<Map<number, PackageCounts>> {
  const [packageRows, appRows] = await Promise.all([
    db
      .from('pkgs')
      .select('repo_id as repoId')
      .whereNotNull('repo_id')
      .count('* as pkgCount')
      .groupBy('repo_id'),
    db
      .from('app_pkgs')
      .join('pkgs', 'pkgs.id', 'app_pkgs.pkg_id')
      .select('pkgs.repo_id as repoId')
      .whereNotNull('pkgs.repo_id')
      .countDistinct('app_pkgs.app_id as appCount')
      .groupBy('pkgs.repo_id'),
  ])

  const counts = new Map<number, PackageCounts>()
  for (const row of packageRows as RepoCountRow[]) {
    counts.set(Number(row.repoId), { pkgCount: Number(row.pkgCount), appCount: 0 })
  }
  for (const row of appRows as RepoCountRow[]) {
    const count = counts.get(Number(row.repoId)) ?? { pkgCount: 0, appCount: 0 }
    count.appCount = Number(row.appCount)
    counts.set(Number(row.repoId), count)
  }
  return counts
}

/**
 * Counts of the packages each distribution serves, and of the applications those packages provide.
 * A distribution is one release for one architecture and is served by its repositories, so it
 * counts the packages of those repositories that belong to its own architecture — a repository
 * stores the packages of every architecture it publishes, which is all of them for the trees that
 * serve several.
 */
export async function distroCounts(): Promise<Map<number, PackageCounts>> {
  const [packageRows, linkRows, archRows, appRows] = await Promise.all([
    db
      .from('pkgs')
      .select('repo_id as repoId', 'arch')
      .whereNotNull('repo_id')
      .count('* as pkgCount')
      .groupBy('repo_id', 'arch'),
    db.from('distro_repos').select('distro_id as distroId', 'repo_id as repoId'),
    db.from('distros').select('id as distroId', 'arch'),
    db
      .from('app_pkgs')
      .join('pkgs', 'pkgs.id', 'app_pkgs.pkg_id')
      .join('distro_repos', 'distro_repos.repo_id', 'pkgs.repo_id')
      .join('distros', 'distros.id', 'distro_repos.distro_id')
      .select('distro_repos.distro_id as distroId')
      .countDistinct('app_pkgs.app_id as appCount')
      .where((query) => {
        query
          .whereColumn('pkgs.arch', 'distros.arch')
          .orWhereIn('pkgs.arch', archIndependentPackageArches)
          .orWhereNull('pkgs.arch')
      })
      .groupBy('distro_repos.distro_id'),
  ])

  const archOf = new Map<number, string>()
  for (const row of archRows as DistroArchRow[]) archOf.set(Number(row.distroId), row.arch)

  const packagesOf = new Map<number, Array<{ arch: string | null; pkgCount: number }>>()
  for (const row of packageRows as RepoArchPackageRow[]) {
    const packages = packagesOf.get(Number(row.repoId)) ?? []
    packages.push({ arch: row.arch, pkgCount: Number(row.pkgCount) })
    packagesOf.set(Number(row.repoId), packages)
  }

  const counts = new Map<number, PackageCounts>()
  for (const link of linkRows as LinkedRepoRow[]) {
    const distroId = Number(link.distroId)
    const arch = archOf.get(distroId)
    const count = counts.get(distroId) ?? { pkgCount: 0, appCount: 0 }

    for (const packages of packagesOf.get(Number(link.repoId)) ?? []) {
      if (belongsToArch(packages.arch, arch)) count.pkgCount += packages.pkgCount
    }
    counts.set(distroId, count)
  }
  for (const row of appRows as DistroCountRow[]) {
    const count = counts.get(Number(row.distroId)) ?? { pkgCount: 0, appCount: 0 }
    count.appCount = Number(row.appCount)
    counts.set(Number(row.distroId), count)
  }
  return counts
}

/**
 * Attach the counts a listing shows to its resources, and order them the way the request asked for.
 * Ordering by a count puts the entries with the most packages first and keeps the name order as the
 * tie-break, so equally sized entries stay in the order the listing query returned them in.
 */
export function attachCounts<
  Resource extends { id: number; name: string; $extras: Record<string, unknown> },
>(resources: Resource[], counts: Map<number, PackageCounts>, sort: CountSort) {
  for (const resource of resources) {
    const count = counts.get(resource.id) ?? { pkgCount: 0, appCount: 0 }
    resource.$extras.pkgCount = count.pkgCount
    resource.$extras.appCount = count.appCount
  }

  if (sort === 'name') return

  const key = sort === 'packages' ? 'pkgCount' : 'appCount'
  resources.sort(
    (left, right) =>
      Number(right.$extras[key]) - Number(left.$extras[key]) || left.name.localeCompare(right.name),
  )
}
