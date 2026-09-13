import App from '#models/app'
import AppAlias from '#models/app_alias'
import { appstreamIdKey, appstreamIdVariants } from '#services/repo_appstream_extractor'

/**
 * Applications answer to several AppStream IDs: the ID they are stored under and the aliases
 * registered for them. Repositories also spell an ID differently (`org.naev.Naev` against
 * `org.naev.naev`) or carry the legacy `.desktop` form of it, so every ID is looked up through the
 * same canonical, lower-cased key.
 */
export default class AppRegistry {
  private apps = new Map<string, App>()

  /**
   * Load the applications of the catalog, with the icon the importer compares against and the
   * aliases they have to answer to. Passing AppStream IDs narrows the load down to the applications
   * that answer to one of them, which the importer uses when it only reads a few components.
   */
  static async load(appstreamIds?: string[]) {
    const registry = new AppRegistry()
    const query = App.query().preload('icon').preload('aliases')

    if (appstreamIds && appstreamIds.length > 0) {
      const ids = appstreamIds
      query.where((scopedQuery) => {
        scopedQuery
          .whereIn('appstreamId', ids)
          .orWhereHas('aliases', (aliasQuery) => aliasQuery.whereIn('appstreamId', ids))
      })
    }

    for (const app of await query) registry.register(app)
    return registry
  }

  /** Remember an application under every AppStream ID it answers to. */
  register(app: App) {
    if (app.appstreamId) this.apps.set(appstreamIdKey(app.appstreamId), app)
    for (const alias of app.aliases ?? []) {
      this.apps.set(appstreamIdKey(alias.appstreamId), app)
    }
  }

  /**
   * Application an AppStream ID belongs to. An ID of an application that was merged away resolves
   * to the application that absorbed it, which is what keeps the merged ID from being imported
   * again.
   */
  find(id: string | null | undefined) {
    if (!id) return undefined
    return this.apps.get(appstreamIdKey(id))
  }

  /** Whether an ID is the one the application is stored under, instead of one of its aliases. */
  owns(app: App, id: string) {
    return appstreamIdKey(app.appstreamId ?? '') === appstreamIdKey(id)
  }
}

/**
 * Whether an AppStream ID is already taken, either as the ID an application is stored under or as
 * one of its aliases. Ids of the applications being edited are not taken, so that saving an
 * application keeps its own IDs and a merge can take over the IDs of the entry it folds in.
 */
export async function appstreamIdIsClaimed(id: string, exceptAppIds?: number | number[] | null) {
  const variants = appstreamIdVariants(id)
  const excluded = Array.isArray(exceptAppIds) ? exceptAppIds : exceptAppIds ? [exceptAppIds] : []
  const appsQuery = App.query().whereIn('appstreamId', variants)
  const aliasesQuery = AppAlias.query().whereIn('appstreamId', variants)
  if (excluded.length > 0) {
    appsQuery.whereNotIn('id', excluded)
    aliasesQuery.whereNotIn('appId', excluded)
  }

  const [app, alias] = await Promise.all([appsQuery.first(), aliasesQuery.first()])
  return Boolean(app ?? alias)
}
