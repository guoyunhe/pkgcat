import { randomUUID } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { unlink } from 'node:fs/promises'
import { basename } from 'node:path'
import { Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'

import type { MultipartFile } from '@adonisjs/core/bodyparser'
import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import drive from '@adonisjs/drive/services/main'

import App from '#models/app'
import Distro from '#models/distro'
import Pkg from '#models/pkg'
import PackageFileExtractor from '#services/package_file_extractor'
import PkgTransformer from '#transformers/pkg_transformer'
import { archIndependentPackageArch } from '#utils/arch'
import { pkgListValidator, pkgValidator } from '#validators/pkg'

// Package files are uploaded outside of the global multipart limit (see config/bodyparser.ts)
// and streamed to the disk instead of being buffered in memory.
const maxPackageSize = 2 * 1024 * 1024 * 1024

export default class PkgsController {
  async index({ params, request, serialize }: HttpContext) {
    const { page, perPage, q, distroId, repoId, type } =
      await request.validateUsing(pkgListValidator)
    // Packages are listed by name, which is how a package is looked up; the id keeps the order of a
    // name stable, so that paging never repeats or skips a row the way a partly ordered list does.
    // It is asked for in ascending order on purpose: a descending one cannot be read from the index
    // of the names and makes the database sort half a million rows for every page.
    const pkgsQuery = Pkg.query().orderBy('name')

    if (params.app_id) {
      pkgsQuery.whereHas('apps', (builder) => builder.where('apps.id', params.app_id))
    }

    // The filters apply both to the package list and to the packages of a single application
    if (distroId) {
      // A distribution is served by its repositories, which hold the packages of its own
      // architecture, along with the packages that carry no machine code and belong to every
      // architecture of it. The release it is binary compatible with is read with it: the packages
      // built for either of them install on both, and the two are of one architecture, so a release
      // that continues another one is listed with the packages of the release it continues (a Linux
      // Mint reads what Ubuntu and its vendors publish, without either of them naming it). The
      // repositories are read as a subquery, which the database resolves once: written as a nested
      // `whereHas` it re-reads the link of every package instead, and written as a list of ids it
      // stops using the subquery and scans the packages one by one.
      const distro = await Distro.find(distroId)
      if (distro) {
        const releases = [
          distro.id,
          ...(distro.compatibleDistroId ? [distro.compatibleDistroId] : []),
        ]

        pkgsQuery.whereHas('repo', (query) =>
          query.whereHas('distros', (builder) => builder.whereIn('distros.id', releases)),
        )
        pkgsQuery.where((query) => {
          query
            .where('arch', distro.arch)
            .orWhere('arch', archIndependentPackageArch)
            .orWhereNull('arch')
        })
      } else {
        // A release that does not exist, or that no repository serves, holds no package, which its
        // counts say as well
        pkgsQuery.whereRaw('0 = 1')
      }
    }

    if (type) pkgsQuery.where('type', type)
    if (repoId) pkgsQuery.where('repo_id', repoId)

    if (q) {
      pkgsQuery.apply((scopes) => scopes.search(q))
    }

    const paginator = await pkgsQuery.paginate(page, perPage)
    return serialize(PkgTransformer.paginate(paginator.all(), paginator.getMeta()))
  }

  async show({ params, serialize }: HttpContext) {
    const pkg = await Pkg.query()
      .where('id', params.id)
      .preload('apps')
      .preload('repo')
      .firstOrFail()
    return serialize(PkgTransformer.transform(pkg))
  }

  /**
   * Create a package. The nested route (`POST /api/apps/:app_id/pkgs`) creates a package from an
   * uploaded deb, rpm or AppImage file, while the flat route (`POST /api/pkgs`) takes the
   * attributes from the request body.
   */
  async store(context: HttpContext) {
    if (context.params.app_id) return this.storeFromUpload(context)

    const { request, response, serialize } = context
    const { appIds, ...attributes } = await request.validateUsing(pkgValidator)

    const pkg = await Pkg.create(attributes)
    if (appIds && appIds.length > 0) await pkg.related('apps').attach(appIds)
    await pkg.load('apps')
    response.status(201)
    return serialize(PkgTransformer.transform(pkg))
  }

  /**
   * Create a package by uploading a deb, rpm or AppImage file. The name, version, release,
   * architecture, license, summary and description are read from the file itself when available.
   */
  private async storeFromUpload({ auth, params, request, response, serialize }: HttpContext) {
    const application = await App.findOrFail(params.app_id)
    const file = await this.receivePackageFile(request)

    if (!file.isValid) {
      await this.discardFile(file)
      throw new Exception(file.errors[0]?.message ?? 'A valid package file is required', {
        status: 422,
      })
    }

    const metadata = await this.extractPackage(file)
    const fileName = this.packageFileName(file.clientName, metadata.checksum)
    const path = `packages/${fileName}`

    await file.move(app.makePath('storage', 'packages'), { name: fileName, overwrite: true })

    const pkg = await Pkg.create({
      userId: auth.getUserOrFail().id,
      type: metadata.type,
      name: metadata.name,
      version: metadata.version,
      release: metadata.release,
      arch: metadata.arch,
      license: metadata.license,
      summary: metadata.summary,
      description: metadata.description,
      size: metadata.size,
      checksum: metadata.checksum,
      checksumType: metadata.checksumType,
      path,
    })

    await pkg.related('apps').attach([application.id])
    await pkg.load('apps')
    response.status(201)
    return serialize(PkgTransformer.transform(pkg))
  }

  async update({ params, request, serialize }: HttpContext) {
    const pkg = await Pkg.findOrFail(params.id)
    const { appIds, ...attributes } = await request.validateUsing(pkgValidator)

    await pkg.merge(attributes).save()
    // The form lists every application of the package, so the stored links follow the selection
    if (appIds) await pkg.related('apps').sync(appIds, true)
    await pkg.load('apps')
    return serialize(PkgTransformer.transform(pkg))
  }

  async destroy({ params, response }: HttpContext) {
    const pkg = await Pkg.findOrFail(params.id)
    const path = pkg.path

    await pkg.delete()
    if (path) await this.deleteStoredFile(path)

    return response.noContent()
  }

  /**
   * Stream the uploaded file to the tmp directory. The route is listed under "processManually" in
   * the bodyparser config, so the multipart stream is consumed here with its own limit.
   */
  private async receivePackageFile(request: HttpContext['request']) {
    request.multipart.onFile('file', { deferValidations: true }, async (part, reportChunk) => {
      const tmpPath = app.tmpPath(`pkgcat-${randomUUID()}`)

      await pipeline(
        part,
        new Transform({
          transform(chunk: Buffer, _encoding, callback) {
            reportChunk(chunk)
            callback(null, chunk)
          },
        }),
        createWriteStream(tmpPath),
      )

      return { tmpPath }
    })

    await request.multipart.process({ limit: maxPackageSize })

    const file = request.file('file', { size: maxPackageSize })
    if (!file) {
      throw new Exception('A valid package file is required', { status: 422 })
    }
    return file
  }

  private packageFileName(clientName: string, checksum: string) {
    const safeName = basename(clientName)
      .replace(/[^\w.@+-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(-100)

    return `${checksum.slice(0, 12)}-${safeName || 'package'}`
  }

  /**
   * Read the package metadata. Rejected uploads are removed from the tmp directory instead of being
   * left behind on the disk.
   */
  private async extractPackage(file: MultipartFile) {
    const tmpPath = file.tmpPath
    if (!tmpPath) {
      throw new Exception('A valid package file is required', { status: 422 })
    }

    try {
      return await new PackageFileExtractor().extract(tmpPath, file.clientName)
    } catch (error) {
      await this.discardFile(file)
      throw error
    }
  }

  private async discardFile(file: { tmpPath?: string }) {
    if (!file.tmpPath) return
    await unlink(file.tmpPath).catch(() => undefined)
  }

  /**
   * File names are content addressed, so the same file may back several package entries. The file
   * is only removed once nothing else points at it.
   */
  private async deleteStoredFile(path: string) {
    const referenced = await Pkg.query().where('path', path).first()
    if (!referenced) await drive.use().delete(path)
  }
}
