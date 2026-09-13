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
import { attachTranslations } from '#services/app_translations'
import PackageFileExtractor from '#services/package_file_extractor'
import PkgTransformer from '#transformers/pkg_transformer'
import { pkgValidator } from '#validators/pkg'

// Package files are uploaded outside of the global multipart limit (see config/bodyparser.ts)
// and streamed to the disk instead of being buffered in memory.
const maxPackageSize = 2 * 1024 * 1024 * 1024

export default class PkgsController {
  async index({ params, request, serialize }: HttpContext) {
    const page = this.positiveInteger(request.input('page'), 1)
    const perPage = Math.min(this.positiveInteger(request.input('perPage'), 12), 50)
    const pkgsQuery = Pkg.query().preload('apps').orderBy('id', 'desc')

    if (params.app_id) {
      await App.findOrFail(params.app_id)
      pkgsQuery.whereHas('apps', (builder) => builder.where('apps.id', params.app_id))
    } else {
      const rawQuery = request.input('q')
      const keyword = typeof rawQuery === 'string' ? rawQuery.trim().toLocaleLowerCase() : ''
      if (keyword) {
        const pattern = `%${keyword.replace(/[\\%_]/g, '\\$&')}%`
        pkgsQuery.where((subquery) => {
          subquery
            .whereILike('name', pattern)
            .orWhereILike('type', pattern)
            .orWhereILike('arch', pattern)
            .orWhereILike('version', pattern)
        })
      }
    }

    // The filters apply both to the package list and to the packages of a single application
    const distroId = Number(this.queryValue(request.input('distro')))
    if (Number.isInteger(distroId) && distroId > 0) {
      // A distribution matches packages through the package format it uses, while a
      // distribution without a native package format cannot match any package
      const distro = await Distro.find(distroId)
      if (distro?.pkgType) pkgsQuery.where('type', distro.pkgType)
      else pkgsQuery.whereRaw('0 = 1')
    }

    const arch = this.queryValue(request.input('arch'))
    if (arch) pkgsQuery.where('arch', arch)

    const type = this.queryValue(request.input('type'))
    if (type) pkgsQuery.where('type', type)

    const paginator = await pkgsQuery.paginate(page, perPage)
    await this.loadAppNames(paginator.all(), request.input('locale'))
    return serialize(PkgTransformer.paginate(paginator.all(), paginator.getMeta()))
  }

  async show({ params, request, serialize }: HttpContext) {
    const pkg = await Pkg.query().where('id', params.id).preload('apps').firstOrFail()
    await this.loadAppNames([pkg], request.input('locale'))
    return serialize(PkgTransformer.transform(pkg))
  }

  /** Locale localized names of the linked applications are read for. */
  private locale(value: unknown) {
    const locale = typeof value === 'string' ? value.trim() : ''
    return locale === '' ? null : locale
  }

  /** Read the localized names the packages carry for their applications. */
  private async loadAppNames(pkgs: Pkg[], value: unknown) {
    await attachTranslations(
      pkgs.flatMap((pkg) => pkg.apps ?? []),
      this.locale(value),
    )
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
    await this.loadAppNames([pkg], request.input('locale'))
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
    await this.loadAppNames([pkg], request.input('locale'))
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
    await this.loadAppNames([pkg], request.input('locale'))
    return serialize(PkgTransformer.transform(pkg))
  }

  async destroy({ params, response }: HttpContext) {
    const pkg = await Pkg.findOrFail(params.id)
    const path = pkg.path

    await pkg.delete()
    if (path) await this.deleteStoredFile(path)

    return response.noContent()
  }

  private positiveInteger(value: unknown, fallback: number) {
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
  }

  /**
   * Single value query parameters are accepted either as a string or as an array (repeated
   * parameters), and empty values are treated as "no filter".
   */
  private queryValue(value: unknown) {
    if (typeof value === 'string') return value.trim() || null
    if (Array.isArray(value)) {
      const first = value.find((item) => typeof item === 'string' && item.trim() !== '')
      return typeof first === 'string' ? first.trim() : null
    }
    return null
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
