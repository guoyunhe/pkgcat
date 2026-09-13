import { args, BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import chalk from 'chalk'
import { DateTime } from 'luxon'

import App from '#models/app'
import Category from '#models/category'
import Image from '#models/image'
import Pkg from '#models/pkg'
import Repo from '#models/repo'
import RepoAppstreamExtractor, {
  appstreamHomepage,
  appstreamIdKey,
  appstreamIdVariants,
  appstreamVersion,
  desktopAppTypes,
  iconKey,
  type AppstreamIcon,
  type ExtractedApp,
  type InferredComponent,
} from '#services/repo_appstream_extractor'
import RepoPackageExtractor from '#services/repo_package_extractor'
import type { ExtractedPackage } from '#services/repo_package_extractor'

import { compareVersions } from '../app/utils/version.js'

type PackageIdentity = Pick<ExtractedPackage, 'name' | 'version' | 'release' | 'arch'>

export default class RepoSync extends BaseCommand {
  static commandName = 'repo:sync'
  static description = 'Extract packages from configured deb/rpm repositories into the catalog'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({
    description: 'Repository name (defaults to all deb/rpm repositories)',
    required: false,
  })
  declare repoName?: string

  @flags.string({ description: 'Target architecture, e.g. x86_64 (deb repositories only)' })
  declare arch: string

  @flags.number({ description: 'Number of sample packages to print per repository', default: 5 })
  declare limit: number

  @flags.boolean({
    description: 'Synchronize repositories even when their sync interval has not elapsed',
  })
  declare force: boolean

  async run() {
    const repos = this.repoName
      ? [await Repo.findByOrFail('name', this.repoName)]
      : await Repo.query().whereIn('type', ['deb', 'rpm'])

    if (repos.length === 0) {
      this.logger.warning('No deb/rpm repositories found')
      return
    }

    const extractor = new RepoPackageExtractor()
    const appstream = new RepoAppstreamExtractor()
    let synced = 0

    for (const repo of repos) {
      const skipReason = this.syncSkipReason(repo)
      if (skipReason) {
        this.logger.info(`${repo.name}: ${chalk.dim(`skipped, ${skipReason}`)}`)
        continue
      }

      synced += 1
      this.logger.info(`Extracting packages from ${chalk.cyan(repo.name)} (${repo.type})`)
      try {
        const packages = await extractor.extract(repo, { arch: this.arch || undefined })
        const { created, updated, deleted } = await this.savePackages(repo, packages)
        const entries = await appstream.extract(repo, { arch: this.arch || undefined })
        const apps = await this.saveApps(repo, appstream, entries, packages)
        repo.lastSyncedAt = DateTime.now()
        await repo.save()
        this.logger.info(
          `${repo.name}: ${chalk.green(String(packages.length))} packages` +
            ` (${chalk.green(String(created))} created, ${chalk.yellow(String(updated))} updated,` +
            ` ${chalk.red(String(deleted))} removed)`,
        )
        if (entries.length > 0) {
          this.logger.info(
            `${repo.name}: ${chalk.green(String(entries.length))} appstream components` +
              ` (${chalk.green(String(apps.created))} apps created,` +
              ` ${chalk.yellow(String(apps.updated))} apps updated,` +
              ` ${chalk.dim(String(apps.skipped))} skipped,` +
              ` ${chalk.green(String(apps.icons))} icons,` +
              ` ${chalk.green(String(apps.linked))} packages linked,` +
              ` ${chalk.green(String(apps.categories))} categories linked)`,
          )
        }
        if (
          apps.inferred > 0 ||
          apps.inferredLinked > 0 ||
          apps.inferredExtracted > 0 ||
          apps.inferredIcons > 0
        ) {
          this.logger.info(
            `${repo.name}: ${chalk.green(String(apps.inferred))} app(s) inferred from package` +
              ` file lists (${chalk.green(String(apps.inferredLinked))} packages linked,` +
              ` ${chalk.green(String(apps.inferredExtracted))} metadata files,` +
              ` ${chalk.green(String(apps.inferredIcons))} icons extracted)`,
          )
        }
        for (const pkg of packages.slice(0, this.limit)) {
          const details = [pkg.version, pkg.release, pkg.arch].filter(Boolean).join(' ')
          this.logger.info(`  ${pkg.name}${details ? ` ${chalk.dim(details)}` : ''}`)
        }
        if (packages.length > this.limit) {
          this.logger.info(chalk.dim(`  ... and ${packages.length - this.limit} more`))
        }
      } catch (error) {
        this.logger.error(`${repo.name}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    if (synced === 0) {
      this.logger.warning('No repositories were synchronized, use --force to sync anyway')
    }
  }

  /**
   * Returns why a repository is not synchronized, or `null` when it is. A repository that was never
   * synchronized always runs, while one without an interval is only synchronized manually once it
   * has been synchronized before, which is what `--force` does.
   */
  private syncSkipReason(repo: Repo): string | null {
    if (this.force) return null
    if (!repo.lastSyncedAt) return null
    if (repo.syncIntervalDays === null) return 'no sync interval, use --force to sync'

    const nextSync = repo.lastSyncedAt.plus({ days: repo.syncIntervalDays })
    if (nextSync <= DateTime.now()) return null
    return `next sync at ${nextSync.toFormat('yyyy-MM-dd HH:mm')}, use --force to sync now`
  }

  /**
   * Write the extracted packages to the database. Packages are keyed by repository, name, version,
   * release and architecture, so synchronizing the same repository again updates the existing rows
   * instead of inserting duplicates. Packages that are no longer in the repository are removed,
   * unless the repository returned nothing at all, which is more likely a metadata problem than an
   * emptied repository. Repository packages are not tied to a catalog application.
   */
  private async savePackages(repo: Repo, packages: ExtractedPackage[]) {
    const existing = await Pkg.query().where('repoId', repo.id)
    const known = new Map(existing.map((pkg) => [this.packageKey(pkg), pkg]))
    const stale = new Map(known)
    let created = 0
    let updated = 0
    let deleted = 0

    for (const item of packages) {
      const key = this.packageKey(item)
      stale.delete(key)

      let pkg = known.get(key)
      if (pkg) {
        updated += 1
      } else {
        pkg = new Pkg()
        known.set(key, pkg)
        created += 1
      }

      pkg.merge({
        repoId: repo.id,
        type: item.type,
        name: item.name,
        version: item.version,
        release: item.release,
        arch: item.arch,
        license: item.license,
        summary: item.summary,
        description: item.description,
        downloadUrl: item.downloadUrl,
        checksum: item.checksum,
        checksumType: item.checksumType,
        size: item.size,
      })
      await pkg.save()
    }

    if (packages.length === 0) {
      if (stale.size > 0) {
        this.logger.warning(
          `${repo.name}: no packages were extracted, keeping the ${stale.size} stored package(s)`,
        )
      }
    } else {
      for (const pkg of stale.values()) {
        await pkg.delete()
        deleted += 1
      }
    }

    return { created, updated, deleted }
  }

  private packageKey(pkg: PackageIdentity) {
    return [pkg.name, pkg.version, pkg.release, pkg.arch].map((value) => value ?? '').join('\u0000')
  }

  /**
   * Create or update the applications a repository publishes, store the largest of their icons and
   * link the packages they belong to. An application that declares its own `appstreamUrl` keeps
   * that metadata, only components that name a package of the repository are imported, and a known
   * application is only rewritten when the component announces a newer version.
   */
  private async saveApps(
    repo: Repo,
    appstream: RepoAppstreamExtractor,
    entries: ExtractedApp[],
    packages: ExtractedPackage[],
  ) {
    const result = {
      created: 0,
      updated: 0,
      skipped: 0,
      icons: 0,
      linked: 0,
      categories: 0,
      inferred: 0,
      inferredLinked: 0,
      inferredExtracted: 0,
      inferredIcons: 0,
    }
    const pkgNames = new Set(packages.map((pkg) => pkg.name))
    const candidates = entries.filter(
      (entry) =>
        desktopAppTypes.includes(entry.component.type) &&
        Object.keys(entry.component.name).length > 0 &&
        Object.keys(entry.component.summary).length > 0 &&
        entry.component.pkgNames.some((name) => pkgNames.has(name)),
    )
    if (candidates.length === 0) {
      // Repositories that publish no AppStream metadata at all still name their applications in
      // the files their packages ship, which the file list of the repository reveals.
      if (entries.length === 0) {
        const inferred = await this.saveInferredApps(repo, appstream, packages, pkgNames)
        result.inferred = inferred.created
        result.inferredLinked = inferred.linked
        result.inferredExtracted = inferred.extracted
        result.inferredIcons = inferred.icons
      }
      return result
    }

    const storedApps = await App.query().preload('icon')
    // Older catalogs identify a component by its desktop file name, so a stored application may
    // carry the `.desktop` form of the ID the metadata now uses, and catalogs differ in the casing
    // of the ID they declare, so both are looked up through the same key.
    const known = new Map(storedApps.map((app) => [appstreamIdKey(app.appstreamId ?? ''), app]))
    const pendingIcons: Array<{ app: App; icon: AppstreamIcon }> = []

    for (const entry of candidates) {
      const key = appstreamIdKey(entry.appstreamId)
      const current = known.get(key)
      // Applications with their own AppStream URL are not overwritten by repository metadata
      if (current?.appstreamUrl) {
        result.skipped += 1
        continue
      }

      const app = current ?? new App()
      if (current && !appstreamVersionIsNewer(current, appstreamVersion(entry.component))) {
        result.skipped += 1
      } else {
        app.merge({
          appstreamId: entry.appstreamId,
          name: entry.component.name,
          summary: entry.component.summary,
          version: appstreamVersion(entry.component),
          license: entry.component.projectLicense ?? null,
          homepage: appstreamHomepage(entry.component),
          appstreamContent: entry.content,
        })
        await app.save()
        if (current) {
          result.updated += 1
        } else {
          // Catalogs of one repository can name the same application twice under different casing,
          // so the new row has to be known before the next component is read
          known.set(key, app)
          result.created += 1
        }

        const icon = entry.icons[0]
        if (icon && appstreamIconIsLarger(app, icon)) pendingIcons.push({ app, icon })
      }

      // Packages are linked even when the metadata is not imported, so that new packages of an
      // already known application still show up on its page
      const names = entry.component.pkgNames.filter((name) => pkgNames.has(name))
      if (names.length > 0) {
        await Pkg.query().where('repoId', repo.id).whereIn('name', names).update({ appId: app.id })
        result.linked += names.length
      }

      // Categories are linked as well, so that a synchronization backfills applications that were
      // imported before categories were extracted
      if (app.id) result.categories += await this.syncCategories(app, entry.component.categories)
    }

    if (pendingIcons.length > 0) {
      const buffers = await appstream.readIcons(
        repo,
        pendingIcons.map((item) => item.icon),
      )
      for (const { app, icon } of pendingIcons) {
        const data = buffers.get(iconKey(icon))
        if (!data) continue

        const image = await Image.createFromBuffer(data)
        app.iconId = image.id
        await app.save()
        result.icons += 1
      }
    }

    return result
  }

  /**
   * Link the applications of a repository that publishes no AppStream metadata. The file list of
   * the repository names the AppStream ID of every package that ships a metadata file, which is
   * used to link those packages to a known application. An application the catalog does not know
   * yet is created from the package metadata as a placeholder, so that the packages have a page and
   * a later synchronization or an editor can complete its metadata.
   *
   * An application without AppStream content or without an icon is then completed from the package
   * itself, because repositories without an AppStream catalog only carry that inside the packages.
   */
  private async saveInferredApps(
    repo: Repo,
    appstream: RepoAppstreamExtractor,
    packages: ExtractedPackage[],
    pkgNames: Set<string>,
  ) {
    const result = { created: 0, linked: 0, extracted: 0, icons: 0 }
    const components = await appstream.inferredComponents(repo)
    const candidates = components.filter((component) =>
      component.files.some((file) => pkgNames.has(file.pkgName)),
    )
    if (candidates.length === 0) return result

    const storedApps = await App.query()
      .preload('icon')
      .whereIn('appstreamId', [
        ...new Set(candidates.flatMap((component) => appstreamIdVariants(component.appstreamId))),
      ])
    const known = new Map(storedApps.map((app) => [appstreamIdKey(app.appstreamId ?? ''), app]))
    const byName = new Map<string, ExtractedPackage[]>()
    for (const pkg of packages) {
      const siblings = byName.get(pkg.name) ?? []
      siblings.push(pkg)
      byName.set(pkg.name, siblings)
    }

    const pending: Array<{ app: App; component: InferredComponent }> = []

    for (const component of candidates) {
      const key = appstreamIdKey(component.appstreamId)
      let app = known.get(key)
      if (!app) {
        app = await App.create({
          appstreamId: component.appstreamId,
          ...placeholderAppMetadata(this.inferredFile(component, byName)?.pkg),
        })
        known.set(key, app)
        result.created += 1
      }

      const files = component.files.filter((file) => pkgNames.has(file.pkgName))
      if (files.length > 0) {
        await Pkg.query()
          .where('repoId', repo.id)
          .whereIn(
            'name',
            files.map((file) => file.pkgName),
          )
          .update({ appId: app.id })
        result.linked += files.length
      }

      if (!app.appstreamContent || !app.icon) pending.push({ app, component })
    }

    for (const { app, component } of pending) {
      const file = this.inferredFile(component, byName)
      if (!file) continue

      try {
        const packaged = await appstream.readPackagedApp(file.pkg, file.path, component.appstreamId)
        if (!packaged) continue

        const extracted = packaged.app
        if (!app.appstreamContent) {
          app.merge({
            name:
              Object.keys(extracted.component.name).length > 0
                ? extracted.component.name
                : app.name,
            summary:
              Object.keys(extracted.component.summary).length > 0
                ? extracted.component.summary
                : app.summary,
            version: appstreamVersion(extracted.component) ?? app.version,
            license: extracted.component.projectLicense ?? app.license,
            homepage: appstreamHomepage(extracted.component) ?? app.homepage,
            appstreamContent: extracted.content,
          })
          await app.save()
          result.extracted += 1
        }

        if (!app.icon && packaged.icon) {
          const image = await Image.createFromBuffer(packaged.icon)
          app.iconId = image.id
          await app.save()
          result.icons += 1
        }
      } catch (error) {
        this.logger.warning(
          `${repo.name}: ${component.appstreamId}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        )
      }
    }

    return result
  }

  /**
   * Package that best represents an inferred component, together with the path of its metadata
   * file. Only binary packages carry that file, and a package named after the application is
   * preferred over its subpackages.
   */
  private inferredFile(
    component: InferredComponent,
    packages: Map<string, ExtractedPackage[]>,
  ): { pkg: ExtractedPackage; path: string } | null {
    const candidates = component.files.flatMap((file) =>
      (packages.get(file.pkgName) ?? []).map((pkg) => ({ pkg, path: file.path })),
    )
    const preferred = candidates.find((candidate) => candidate.pkg.arch !== 'src')
    return preferred ?? candidates.at(0) ?? null
  }

  /**
   * Attach the categories a component declares to its application. Codes that are not part of the
   * registry are created with the code as their English name, so that repository metadata is never
   * dropped, while known rows keep the translations and tree position the category seeder set up.
   * Categories are only added, never removed, so curating an application by hand survives the next
   * synchronization.
   */
  private async syncCategories(app: App, codes: string[]) {
    if (codes.length === 0) return 0

    const known = await Category.query().whereIn('code', codes)
    const byCode = new Map(known.map((category) => [category.code.toLowerCase(), category]))

    for (const code of codes) {
      if (byCode.has(code.toLowerCase())) continue
      byCode.set(
        code.toLowerCase(),
        await Category.create({ code, name: { en: code }, parentId: null }),
      )
    }

    await app.related('categories').sync(
      [...byCode.values()].map((category) => category.id),
      false,
    )
    return byCode.size
  }
}

/**
 * A repository icon is only stored when it is larger than the icon an application already has, so
 * that synchronizing a repository does not downgrade curated artwork.
 */
function appstreamIconIsLarger(app: App, icon: AppstreamIcon) {
  const size = Math.min(icon.width ?? 0, icon.height ?? 0)
  if (size <= 0) return false
  if (!app.icon) return true
  return size > Math.min(app.icon.width, app.icon.height)
}

/**
 * Metadata of a placeholder application, taken from the package that ships its AppStream metadata
 * file. The package summary is the closest thing to a display name and its first description
 * paragraph becomes the summary, so that the application is usable until better metadata arrives.
 */
function placeholderAppMetadata(pkg: ExtractedPackage | undefined) {
  const summary = pkg?.summary?.trim() || null
  const name = summary ?? pkg?.name ?? 'Unknown application'
  return {
    name: { en: name },
    summary: { en: firstParagraph(pkg?.description) ?? summary ?? name },
    license: pkg?.license?.trim().slice(0, 255) || null,
  }
}

/** First paragraph of a long description, collapsed into a single line. */
function firstParagraph(text: string | null | undefined) {
  const paragraph = text
    ?.split(/\n\s*\n/)[0]
    ?.replace(/\s+/g, ' ')
    .trim()
  return paragraph || null
}

/**
 * Repository metadata only replaces the metadata of a known application when it announces a newer
 * version, so that synchronizing a repository never downgrades an application that was updated
 * elsewhere. An application without a version is always considered older, while a component without
 * a release version has nothing to compare and is not imported at all.
 */
function appstreamVersionIsNewer(app: App, version: string | null) {
  if (!version) return false
  if (!app.version) return true
  return compareVersions(version, app.version) > 0
}
