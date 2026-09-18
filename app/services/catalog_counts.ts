import db from '@adonisjs/lucid/services/db'

/** How many packages something holds, and how many applications those packages provide. */
export type PackageCounts = { pkgCount: number; appCount: number }

/** Order a listing can be read in; `name` keeps the order the listing query returned. */
export type CountSort = 'name' | 'packages' | 'apps'

/** One row of a repository count: the repository it belongs to, and the count itself. */
type CountRow = { repo_id: number; pkgCount?: string | number; appCount?: string | number }

/**
 * Packages each repository holds, which is also what a distribution is served through it. A package
 * belongs to exactly one repository, so the packages of the repositories of an entry add up to the
 * packages it holds.
 */
function packagesByRepo() {
  return db
    .from('pkgs')
    .select('repo_id')
    .whereNotNull('repo_id')
    .count('* as pkgCount')
    .groupBy('repo_id')
}

/**
 * Counts of the packages each repository holds, and of the applications those packages provide. The
 * two are read separately: a package belongs to exactly one repository, while an application may be
 * provided by the packages of several of them, so the application count has to be told apart by the
 * database instead of being summed up afterwards.
 */
export async function repoCounts(): Promise<Map<number, PackageCounts>> {
  const rows = await Promise.all([
    packagesByRepo(),
    db
      .from('app_pkgs')
      .join('pkgs', 'pkgs.id', 'app_pkgs.pkg_id')
      .select('pkgs.repo_id')
      .whereNotNull('pkgs.repo_id')
      .countDistinct('app_pkgs.app_id as appCount')
      .groupBy('pkgs.repo_id'),
  ])
  return countsOf(rows)
}

/**
 * The counts of the repositories the rows name. The packages and the applications are read apart,
 * so a repository that only appears in one of the two keeps zero for the other.
 */
function countsOf([packageRows, appRows]: [CountRow[], CountRow[]]): Map<number, PackageCounts> {
  const counts = new Map<number, PackageCounts>()
  for (const row of packageRows) {
    counts.set(Number(row.repo_id), { pkgCount: Number(row.pkgCount), appCount: 0 })
  }
  for (const row of appRows) {
    const count = counts.get(Number(row.repo_id)) ?? { pkgCount: 0, appCount: 0 }
    count.appCount = Number(row.appCount)
    counts.set(Number(row.repo_id), count)
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
