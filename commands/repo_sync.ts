import { args, BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import chalk from 'chalk'
import { DateTime } from 'luxon'

import App from '#models/app'
import AppPkgName from '#models/app_pkg_name'
import Category from '#models/category'
import Image from '#models/image'
import Pkg from '#models/pkg'
import Repo from '#models/repo'
import { mappedAppId } from '#services/app_pkg_names'
import AppRegistry from '#services/app_registry'
import { attachTranslations, localizedTexts, replaceTranslations } from '#services/app_translations'
import RepoAppstreamExtractor, {
  appstreamHomepage,
  appstreamIdVariants,
  appstreamVersion,
  canonicalAppType,
  desktopAppTypes,
  iconKey,
  type AppstreamIcon,
  type ExtractedApp,
  type InferredComponent,
} from '#services/repo_appstream_extractor'
import RepoPackageExtractor from '#services/repo_package_extractor'
import type { ExtractedPackage, RepoPackageType } from '#services/repo_package_extractor'
import { belongsToArch } from '#utils/arch'
import { collectGarbage } from '#utils/memory'
import { compareVersions } from '#utils/version'

type PackageIdentity = Pick<ExtractedPackage, 'name' | 'version' | 'release' | 'arch'>

/**
 * Package of a repository as the application phase reads it. The packages themselves are not kept
 * in memory while a repository is synchronized, so they are read back from the catalog.
 */
type StoredPackage = Pick<
  Pkg,
  'id' | 'name' | 'type' | 'arch' | 'summary' | 'description' | 'license' | 'downloadUrl'
>

export default class RepoSync extends BaseCommand {
  static commandName = 'repo:sync'
  static description =
    'Extract packages from configured deb/rpm/pacman repositories into the catalog'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({
    description: 'Repository name (defaults to all deb/rpm/pacman repositories)',
    required: false,
  })
  declare repoName?: string

  @flags.string({
    description:
      'Target architecture, e.g. x86_64. Deb repositories default to every architecture of the ' +
      'distributions they serve',
  })
  declare arch: string

  @flags.number({ description: 'Number of sample packages to print per repository', default: 5 })
  declare limit: number

  @flags.boolean({
    description: 'Synchronize repositories even when their sync interval has not elapsed',
  })
  declare force: boolean

  async run() {
    const repos = this.repoName
      ? [await Repo.query().where('name', this.repoName).preload('distros').firstOrFail()]
      : await Repo.query()
          .whereIn('type', ['deb', 'rpm', 'pacman'])
          // The repositories that change most often are synchronized first, so that a run that is
          // long or stopped early reaches them, and the ones without an interval are last, since
          // they are only read when they are forced
          .orderByRaw('sync_interval_days is null')
          .orderBy('syncIntervalDays')
          .orderBy('name')
          .preload('distros')

    if (repos.length === 0) {
      this.logger.warning('No deb/rpm/pacman repositories found')
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
        // A deb repository holds the packages of several architectures under the same URLs, so a
        // repository that is shared by distributions of different architectures is read once per
        // architecture; the flag limits the run to a single one
        for (const arch of this.syncArches(repo)) {
          const label = arch ? `${repo.name} (${arch})` : repo.name
          // The packages are written to the catalog as they are read, so that a repository of tens
          // of thousands of packages never has to be held in memory as a whole
          const packages = await this.savePackages(repo, extractor.extract(repo, { arch }), arch)
          const entries = await appstream.extract(repo, { arch })
          const apps = await this.saveApps(repo, appstream, entries, packages.names)
          this.logger.info(
            `${label}: ${chalk.green(String(packages.total))} packages` +
              ` (${chalk.green(String(packages.created))} created, ${chalk.yellow(String(packages.updated))} updated,` +
              ` ${chalk.red(String(packages.deleted))} removed)`,
          )
          if (entries.length > 0) {
            this.logger.info(
              `${label}: ${chalk.green(String(entries.length))} appstream components` +
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
              `${label}: ${chalk.green(String(apps.inferred))} app(s) inferred from package` +
                ` file lists (${chalk.green(String(apps.inferredLinked))} packages linked,` +
                ` ${chalk.green(String(apps.inferredExtracted))} metadata files,` +
                ` ${chalk.green(String(apps.inferredIcons))} icons extracted)`,
            )
          }
          if (apps.mapped > 0) {
            this.logger.info(
              `${label}: ${chalk.green(String(apps.mapped))} package(s) linked by package name`,
            )
          }
          for (const pkg of packages.sample) {
            const details = [pkg.version, pkg.release, pkg.arch].filter(Boolean).join(' ')
            this.logger.info(`  ${pkg.name}${details ? ` ${chalk.dim(details)}` : ''}`)
          }
          if (packages.total > packages.sample.length) {
            this.logger.info(chalk.dim(`  ... and ${packages.total - packages.sample.length} more`))
          }
        }

        repo.lastSyncedAt = DateTime.now()
        await repo.save()
      } catch (error) {
        this.logger.error(`${repo.name}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    if (synced === 0) {
      this.logger.warning('No repositories were synchronized, use --force to sync anyway')
    }
  }

  /**
   * Architectures a repository is synchronized for. Deb repositories serve every architecture from
   * the same URLs, so the ones of the distributions the repository belongs to are synchronized in
   * turn; RPM and pacman repositories keep each architecture in its own directory, which the URL
   * names. A repository without a distribution is synchronized without a target architecture.
   */
  private syncArches(repo: Repo) {
    if (this.arch) return [this.arch]
    if (repo.type !== 'deb') return [undefined]

    const arches = [...new Set(repo.distros.map((distro) => distro.arch))].sort()
    return arches.length > 0 ? arches : [undefined]
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
   * instead of inserting duplicates. Only the packages of the synchronized architecture are
   * replaced, so that the other architectures of the same repository keep their packages. Packages
   * that are no longer in the repository are removed, unless the repository returned nothing at
   * all, which is more likely a metadata problem than an emptied repository. Repository packages
   * are not tied to a catalog application.
   *
   * The packages are written as they are read and only their names are kept, so that a repository
   * of tens of thousands of packages is never held in memory as a whole; a few of them are kept to
   * report what was synchronized.
   */
  private async savePackages(repo: Repo, packages: AsyncIterable<ExtractedPackage>, arch?: string) {
    // Only the columns that identify a package are read, because a package carries the long
    // description of its metadata and a repository holds tens of thousands of them, which is what
    // the synchronization would otherwise hold in memory at once. Saving a package that was read
    // this way updates the columns that were merged into it and leaves the others alone.
    const existing = await Pkg.query()
      .where('repoId', repo.id)
      .select('id', 'name', 'version', 'release', 'arch')
    const known = new Map(existing.map((pkg) => [this.packageKey(pkg), pkg]))
    const stale = new Map([...known].filter(([, pkg]) => belongsToArch(pkg.arch, arch)))
    const names = new Set<string>()
    const sample: PackageIdentity[] = []
    let total = 0
    let created = 0
    let updated = 0
    let deleted = 0

    for await (const item of packages) {
      total += 1
      names.add(item.name)
      if (sample.length < this.limit) {
        sample.push({
          name: item.name,
          version: item.version,
          release: item.release,
          arch: item.arch,
        })
      }

      // Reading the metadata of a repository leaves the memory of everything that was read behind
      // until the garbage collector runs, which the heap of a repository of tens of thousands of
      // packages would otherwise grow for
      if (total % packageCollectionInterval === 0) collectGarbage()

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

    if (total === 0) {
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

    return { created, updated, deleted, total, names, sample }
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
    pkgNames: Set<string>,
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
      mapped: 0,
    }
    // Package names the repository's own metadata already assigns to an application. The package
    // name mappings only fill in what is left over, so that curated metadata keeps winning.
    const claimedPkgNames = new Set<string>()
    const candidates = entries.filter(
      (entry) =>
        desktopAppTypes.includes(entry.component.type) &&
        Object.keys(entry.component.name).length > 0 &&
        Object.keys(entry.component.summary).length > 0 &&
        entry.component.pkgNames.some((name) => pkgNames.has(name)),
    )
    // A pacman catalog names its icons as JPEG XL files of the catalog package, which the extractor
    // decodes, so the file list of such a repository is only read when it publishes no catalog at
    // all — its packages are the only place the metadata of its applications lives in then.
    if (candidates.length === 0) {
      // Repositories that publish no AppStream metadata at all still name their applications in
      // the files their packages ship, which the file list of the repository reveals.
      if (entries.length === 0) {
        const inferred = await this.saveInferredApps(repo, appstream, pkgNames, claimedPkgNames)
        result.inferred = inferred.created
        result.inferredLinked = inferred.linked
        result.inferredExtracted = inferred.extracted
        result.inferredIcons = inferred.icons
      }
      result.mapped = await this.linkMappedPackages(repo, claimedPkgNames)
      return result
    }

    const registry = await AppRegistry.load()
    const pendingIcons: Array<{ app: App; icon: AppstreamIcon }> = []

    for (const entry of candidates) {
      const current = registry.find(entry.appstreamId)
      // Applications with their own AppStream URL are not overwritten by repository metadata
      if (current?.appstreamUrl) {
        result.skipped += 1
        continue
      }

      const app = current ?? new App()
      // A component naming an alias of an application is that same application under a former ID,
      // so its metadata updates the stored entry, which keeps the ID it is stored under. Only a
      // component naming the stored ID itself (in any casing) renames the entry.
      const renames = !current || registry.owns(current, entry.appstreamId)
      if (current && !appstreamVersionIsNewer(current, appstreamVersion(entry.component))) {
        result.skipped += 1
      } else {
        app.merge({
          type: canonicalAppType(entry.component.type),
          version: appstreamVersion(entry.component),
          license: entry.component.projectLicense ?? null,
          homepage: appstreamHomepage(entry.component),
          appstreamContent: entry.content,
        })
        if (renames) app.appstreamId = entry.appstreamId
        await app.save()
        await replaceTranslations(app, entry.component.name, entry.component.summary)
        if (current) {
          result.updated += 1
        } else {
          // Catalogs of one repository can name the same application twice under different casing,
          // so the new row has to be known before the next component is read
          registry.register(app)
          result.created += 1
        }

        const icon = entry.icons[0]
        if (icon && appstreamIconIsLarger(app, icon)) pendingIcons.push({ app, icon })
      }

      // Packages are linked even when the metadata is not imported, so that new packages of an
      // already known application still show up on its page. A package may provide several
      // applications, so the links are added rather than replaced.
      const names = entry.component.pkgNames.filter((name) => pkgNames.has(name))
      if (names.length > 0) {
        for (const name of names) claimedPkgNames.add(name)
        const links = await Pkg.query().where('repoId', repo.id).whereIn('name', names).select('id')
        await app.related('packages').sync(
          links.map((pkg) => pkg.id),
          false,
        )
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

    result.mapped = await this.linkMappedPackages(repo, claimedPkgNames)
    return result
  }

  /**
   * Link the packages of a repository that no AppStream metadata of the repository assigns to an
   * application to the applications their package name is mapped to. Repositories ship many
   * packages without any AppStream metadata (libraries, plugins, subpackages) that would otherwise
   * end up without an application at all. Packages the metadata already links, and packages whose
   * name no application is mapped to, are left alone, and the links are added rather than
   * replaced.
   */
  private async linkMappedPackages(repo: Repo, claimedPkgNames: Set<string>) {
    const mappings = await AppPkgName.query()
    if (mappings.length === 0) return 0

    const claimed = new Set([...claimedPkgNames].map((name) => name.toLowerCase()))
    const candidates = mappings.filter((mapping) => !claimed.has(mapping.name.toLowerCase()))
    if (candidates.length === 0) return 0

    const packages: Array<{ id: number; name: string; type: string }> = await Pkg.query()
      .where('repoId', repo.id)
      .whereIn('name', [...new Set(candidates.map((mapping) => mapping.name))])
      .select('id', 'name', 'type')

    // Packages are collected per application, so that one query per application links all of them
    const byApp = new Map<number, number[]>()
    for (const pkg of packages) {
      const appId = mappedAppId(candidates, pkg.name, pkg.type)
      if (!appId) continue
      const links = byApp.get(appId) ?? []
      links.push(pkg.id)
      byApp.set(appId, links)
    }

    let linked = 0
    for (const [appId, ids] of byApp) {
      const app = await App.findOrFail(appId)
      await app.related('packages').sync(ids, false)
      linked += ids.length
    }
    return linked
  }

  /**
   * Link the applications of a repository that publishes no AppStream catalog. The file list of the
   * repository names the AppStream ID of every package that ships a metadata file, which the
   * packages are linked to a known application by. The metadata file itself is read from the
   * package, and an application is created only once that read succeeded: a file list announces an
   * ID and nothing else, and an application without AppStream content is not one the catalog can
   * show. A component whose metadata cannot be read leaves its packages to the package name
   * mappings.
   *
   * The package names the file list assigns to an application are collected in `claimedPkgNames`,
   * which keeps the package name mappings from claiming them again.
   */
  private async saveInferredApps(
    repo: Repo,
    appstream: RepoAppstreamExtractor,
    pkgNames: Set<string>,
    claimedPkgNames: Set<string>,
  ) {
    const result = { created: 0, linked: 0, extracted: 0, icons: 0 }
    const components = await appstream.inferredComponents(repo)
    const candidates = components.filter((component) =>
      component.files.some((file) => pkgNames.has(file.pkgName)),
    )
    if (candidates.length === 0) return result

    const registry = await AppRegistry.load([
      ...new Set(candidates.flatMap((component) => appstreamIdVariants(component.appstreamId))),
    ])
    // The packages that ship a metadata file are read back from the catalog, because the packages
    // of the repository were written to it instead of being kept in memory
    const stored = await Pkg.query()
      .where('repoId', repo.id)
      .whereIn('name', [
        ...new Set(
          candidates.flatMap((component) =>
            component.files
              .filter((file) => pkgNames.has(file.pkgName))
              .map((file) => file.pkgName),
          ),
        ),
      ])
      .select('id', 'name', 'type', 'arch', 'summary', 'description', 'license', 'downloadUrl')
    const byName = new Map<string, StoredPackage[]>()
    for (const pkg of stored) {
      const siblings = byName.get(pkg.name) ?? []
      siblings.push(pkg)
      byName.set(pkg.name, siblings)
    }

    let read = 0

    for (const component of candidates) {
      const files = component.files.filter((file) => pkgNames.has(file.pkgName))
      let app = registry.find(component.appstreamId)

      // A known application is linked to the packages of the component even when nothing has to be
      // read from them, so that a new package of it shows up on its page
      if (app) {
        result.linked += await this.linkInferredPackages(app, repo, files)
        for (const file of files) claimedPkgNames.add(file.pkgName)
        if (app.appstreamContent && app.icon) continue
      }

      const metadata = this.inferredFile(component, byName)
      if (!metadata) continue

      try {
        const packaged = await appstream.readPackagedApp(
          {
            type: storedPackageType(metadata.pkg.type),
            name: metadata.pkg.name,
            downloadUrl: metadata.pkg.downloadUrl,
          },
          metadata.path,
          component.appstreamId,
        )
        if (!packaged) continue

        const extracted = packaged.app
        if (!app) {
          // Only metadata that was read creates an application, so its content, name and summary are
          // stored in one go instead of as a placeholder a later synchronization would complete
          app = await App.create({
            appstreamId: component.appstreamId,
            type: canonicalAppType(extracted.component.type),
            version: appstreamVersion(extracted.component),
            license: extracted.component.projectLicense ?? null,
            homepage: appstreamHomepage(extracted.component),
            appstreamContent: extracted.content,
          })
          await replaceTranslations(app, extracted.component.name, extracted.component.summary)
          registry.register(app)
          result.created += 1
          result.extracted += 1
          result.linked += await this.linkInferredPackages(app, repo, files)
          for (const file of files) claimedPkgNames.add(file.pkgName)
        } else if (!app.appstreamContent) {
          const name = Object.keys(extracted.component.name).length > 0
          const summary = Object.keys(extracted.component.summary).length > 0
          await app.merge({
            type: canonicalAppType(extracted.component.type),
            version: appstreamVersion(extracted.component) ?? app.version,
            license: extracted.component.projectLicense ?? app.license,
            homepage: appstreamHomepage(extracted.component) ?? app.homepage,
            appstreamContent: extracted.content,
          })
          await app.save()
          // The metadata of the package completes the application, but a field the package does not
          // translate keeps the translation it already had
          if (name || summary) {
            await attachTranslations([app], null)
            await replaceTranslations(
              app,
              name ? extracted.component.name : localizedTexts(app.translations, 'name'),
              summary ? extracted.component.summary : localizedTexts(app.translations, 'summary'),
            )
          }
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

      // A package is downloaded and decompressed in pieces that are only released once the garbage
      // collector runs, and the memory of a package of a hundred megabytes has to be gone before
      // the next one is read
      read += 1
      if (read % appCollectionInterval === 0) collectGarbage()
    }

    return result
  }

  /** Link the packages of an inferred component to its application, and report how many they are. */
  private async linkInferredPackages(app: App, repo: Repo, files: InferredComponent['files']) {
    if (files.length === 0) return 0

    const links = await Pkg.query()
      .where('repoId', repo.id)
      .whereIn(
        'name',
        files.map((file) => file.pkgName),
      )
      .select('id')
    await app.related('packages').sync(
      links.map((pkg) => pkg.id),
      false,
    )

    return files.length
  }

  /**
   * Package that best represents an inferred component, together with the path of its metadata
   * file. Only binary packages carry that file, and a package named after the application is
   * preferred over its subpackages.
   */
  private inferredFile(
    component: InferredComponent,
    packages: Map<string, StoredPackage[]>,
  ): { pkg: StoredPackage; path: string } | null {
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
      const category = await Category.create({ code, parentId: null })
      byCode.set(code.toLowerCase(), category)
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

/** Number of packages that are written before the garbage collector is asked to run. */
const packageCollectionInterval = 2000

/** Number of packages that are read before the garbage collector is asked to run. */
const appCollectionInterval = 5

/** Format a stored package is read by, which the extractors read as rpm, deb or pacman packages. */
function storedPackageType(type: string): RepoPackageType {
  if (type === 'deb') return 'deb'
  if (type === 'pacman') return 'pacman'
  return 'rpm'
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
