import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

import type App from '#models/app'
import AppAlias from '#models/app_alias'
import { appstreamIdIsClaimed } from '#services/app_registry'
import { appstreamIdKey, canonicalAppstreamId } from '#services/repo_appstream_extractor'

/** What a merge moved out of the application that was merged away. */
export type MergeSummary = {
  packages: number
  categories: number
  favorites: number
  reviews: number
  aliases: number
  pkgNames: number
}

/** Link tables that are shared between two catalog entries of the same application. */
type SharedTable = 'app_pkgs' | 'app_categories' | 'favorites' | 'reviews'

/** Column that identifies the other end of a shared link table. */
type SharedOwnerColumn = 'pkg_id' | 'category_id' | 'user_id'

/**
 * Fold one catalog entry into another one. Repositories name the same application with different
 * AppStream IDs over time, which imports it twice, and everything the two entries have collected is
 * moved to the one that remains:
 *
 * - Packages and categories of the merged application are linked to the remaining one
 * - Favorites and reviews are moved, while the ones a user already left on the remaining application
 *   win over the duplicates
 * - The AppStream ID of the merged application, and the aliases it had collected, become aliases of
 *   the remaining one, so that repositories announcing any of them link to it from then on
 * - The package names the merged application owns are moved over, so that the packages mapped by name
 *   end up on the remaining one
 * - Metadata the remaining application is missing, such as its icon, is completed from the merged one
 *
 * The whole merge runs in a transaction, so that a failure leaves both entries untouched.
 */
export async function mergeApps(target: App, source: App): Promise<MergeSummary> {
  if (target.id === source.id) {
    throw new Exception('An application cannot be merged into itself', { status: 400 })
  }

  await source.load('aliases')
  await target.load('aliases')

  return db.transaction(async (trx) => {
    const summary: MergeSummary = {
      packages: 0,
      categories: 0,
      favorites: 0,
      reviews: 0,
      aliases: 0,
      pkgNames: 0,
    }

    summary.packages = await moveSharedRows(trx, 'app_pkgs', 'pkg_id', target.id, source.id)
    summary.categories = await moveSharedRows(
      trx,
      'app_categories',
      'category_id',
      target.id,
      source.id,
    )
    summary.favorites = await moveSharedRows(trx, 'favorites', 'user_id', target.id, source.id)
    summary.reviews = await moveSharedRows(trx, 'reviews', 'user_id', target.id, source.id)

    mergeMetadata(target, source)
    await target.useTransaction(trx).save()

    summary.aliases = await moveAppstreamIds(trx, target, source)
    summary.pkgNames = await movePkgNames(trx, target, source)

    await source.useTransaction(trx).delete()
    return summary
  })
}

/**
 * Hand the package name mappings of the merged application to the remaining one. A name is only
 * mapped once in the catalog, so no mapping can collide with one the remaining application has.
 */
async function movePkgNames(trx: TransactionClientContract, target: App, source: App) {
  const moved: Array<{ id: number }> = await trx
    .from('app_pkg_names')
    .where('app_id', source.id)
    .select('id')
  if (moved.length === 0) return 0

  await trx
    .from('app_pkg_names')
    .whereIn(
      'id',
      moved.map((row) => row.id),
    )
    .update({ app_id: target.id })
  return moved.length
}

/**
 * Make the AppStream IDs of the merged application answer to the remaining one. Its aliases are
 * reassigned, and the ID it is stored under becomes an alias itself. An ID the remaining
 * application already answers to is dropped, and so is one a third entry claimed.
 */
async function moveAppstreamIds(trx: TransactionClientContract, target: App, source: App) {
  const known = new Set(
    [target.appstreamId, ...target.aliases.map((alias) => alias.appstreamId)]
      .filter((id): id is string => Boolean(id))
      .map((id) => appstreamIdKey(id)),
  )
  let moved = 0

  for (const alias of source.aliases) {
    const key = appstreamIdKey(alias.appstreamId)
    const claimed =
      known.has(key) || (await appstreamIdIsClaimed(alias.appstreamId, [target.id, source.id]))
    if (claimed) {
      await alias.useTransaction(trx).delete()
      continue
    }

    alias.appId = target.id
    await alias.useTransaction(trx).save()
    known.add(key)
    moved += 1
  }

  const storedId = source.appstreamId ? canonicalAppstreamId(source.appstreamId) : null
  if (
    storedId &&
    !known.has(appstreamIdKey(storedId)) &&
    !(await appstreamIdIsClaimed(storedId, [target.id, source.id]))
  ) {
    await AppAlias.create({ appId: target.id, appstreamId: storedId }, { client: trx })
    moved += 1
  }

  return moved
}

/**
 * Move the rows of a link table from one application to the other. Rows the remaining application
 * already has are dropped instead of moved, because the link tables are unique per application and
 * linked row, and the ones the user already left on the remaining application survive.
 */
async function moveSharedRows(
  trx: TransactionClientContract,
  table: SharedTable,
  ownerColumn: SharedOwnerColumn,
  targetId: number,
  sourceId: number,
) {
  const sourceRows: Array<{ id: number } & Record<SharedOwnerColumn, number>> = await trx
    .from(table)
    .where('app_id', sourceId)
    .select('id', ownerColumn)
  if (sourceRows.length === 0) return 0

  const targetRows: Array<Record<SharedOwnerColumn, number>> = await trx
    .from(table)
    .where('app_id', targetId)
    .select(ownerColumn)
  const targetOwners = new Set(targetRows.map((row) => row[ownerColumn]))
  const moved = sourceRows.filter((row) => !targetOwners.has(row[ownerColumn])).map((row) => row.id)
  const dropped = sourceRows
    .filter((row) => targetOwners.has(row[ownerColumn]))
    .map((row) => row.id)

  if (moved.length > 0) {
    await trx.from(table).whereIn('id', moved).update({ app_id: targetId })
  }
  if (dropped.length > 0) {
    await trx.from(table).whereIn('id', dropped).delete()
  }
  return moved.length
}

/**
 * Complete the metadata of the application that remains with what the merged one has and it does
 * not, such as an icon or a translation, so that merging never loses information.
 */
function mergeMetadata(target: App, source: App) {
  if (!target.appstreamId && source.appstreamId) target.appstreamId = source.appstreamId
  if (!target.version && source.version) target.version = source.version
  if (!target.license && source.license) target.license = source.license
  if (!target.homepage && source.homepage) target.homepage = source.homepage
  if (!target.appstreamUrl && source.appstreamUrl) target.appstreamUrl = source.appstreamUrl
  if (!target.appstreamContent && source.appstreamContent) {
    target.appstreamContent = source.appstreamContent
  }
  if (!target.desktopUrl && source.desktopUrl) target.desktopUrl = source.desktopUrl
  if (!target.desktopContent && source.desktopContent) target.desktopContent = source.desktopContent
  if (!target.iconId && source.iconId) target.iconId = source.iconId

  target.name = withMissingTranslations(target.name, source.name)
  target.summary = withMissingTranslations(target.summary, source.summary)
}

/** Translations of the merged application that the kept one does not have yet. */
function withMissingTranslations(kept: Record<string, string>, merged: Record<string, string>) {
  const missing = Object.entries(merged ?? {}).filter(([locale, text]) => text && !kept?.[locale])
  return missing.length === 0 ? kept : { ...kept, ...Object.fromEntries(missing) }
}
