import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

import Distro from '#models/distro'
import DistroTransformer from '#transformers/distro_transformer'
import { pageOf } from '#utils/pagination'
import { distroListValidator, distroValidator } from '#validators/distro'

/** Lucid date columns expect a `DateTime` instance, while the validator hands over ISO strings. */
function toDateTime(value: string | null) {
  return value ? DateTime.fromISO(value) : null
}

export default class DistrosController {
  async index({ request, serialize }: HttpContext) {
    const { page, perPage, sort, q, arch } = await request.validateUsing(distroListValidator)
    // The counts are read with the listing itself (see `Distro.withCounts`), so the entries a page
    // holds and the counts they show are read together, and the order by a count is asked of the
    // database the way the order by a name is
    const query = Distro.query()
      .apply((scopes) => scopes.withCounts())
      .preload('compatibleDistro')
    // The releases of one distribution stay together under its name, and follow each other from the
    // newest to the oldest one, which their versions cannot express: as text, "10" comes before "8".
    // A rolling release keeps no date, so it comes first within its name. The remaining keys only
    // keep the order stable for releases published on the same day and for the architectures of one
    // entry — and, read after a count, they are the order the entries that share it follow each
    // other in, so a page of such a listing holds the same entries every time it is read
    const countColumns = { packages: 'pkgCount', apps: 'appCount' } as const
    if (sort !== 'name') query.orderBy(countColumns[sort], 'desc')
    query
      .orderBy('name')
      .orderByRaw('release_date is null desc')
      .orderBy('releaseDate', 'desc')
      .orderBy('version')
      .orderBy('arch')
    if (q) {
      // A release is found by what names it — the distribution, the version and the architecture it
      // is published for, and the format it packages — rather than by the repositories serving it,
      // which a reader reaches through the repositories themselves
      const pattern = `%${q.replace(/[\\%_]/g, '\\$&')}%`
      query.where((subquery) => {
        subquery
          .whereILike('name', pattern)
          .orWhereILike('version', pattern)
          .orWhereILike('arch', pattern)
          .orWhereILike('pkgType', pattern)
      })
    }
    if (arch) query.where('arch', arch)

    // A listing that asked for no page size receives every release, which the pagination of the
    // database cannot express; the others are paged by it
    if (perPage === 0) {
      const { entries, meta } = pageOf(await query, page, perPage)
      return serialize(DistroTransformer.paginate(entries, meta))
    }

    const paginator = await query.paginate(page, perPage)
    return serialize(DistroTransformer.paginate(paginator.all(), paginator.getMeta()))
  }

  async show({ params, serialize }: HttpContext) {
    // The detail page shows the same counts as the listing, of the one release it opens
    const distro = await Distro.query()
      .apply((scopes) => scopes.withCounts())
      .where('id', params.id)
      .preload('compatibleDistro')
      .firstOrFail()
    return serialize(DistroTransformer.transform(distro))
  }

  async store({ request, response, serialize }: HttpContext) {
    const payload = await request.validateUsing(distroValidator)

    const distro = await Distro.create({
      ...payload,
      releaseDate: toDateTime(payload.releaseDate),
      eolDate: toDateTime(payload.eolDate),
    })
    // The response carries the compatibility, which the payload may have left empty
    await distro.load('compatibleDistro')
    // NOTE: `response.created()` sends the response immediately (with an empty body), so the
    // status is set directly to keep the serialized distribution in the payload.
    response.status(201)
    return serialize(DistroTransformer.transform(distro))
  }

  async update({ params, request, serialize }: HttpContext) {
    const distro = await Distro.findOrFail(params.id)
    const payload = await request.validateUsing(distroValidator, {
      meta: { distroId: distro.id },
    })

    await distro
      .merge({
        ...payload,
        releaseDate: toDateTime(payload.releaseDate),
        eolDate: toDateTime(payload.eolDate),
      })
      .save()
    await distro.load('compatibleDistro')
    return serialize(DistroTransformer.transform(distro))
  }

  async destroy({ params, response }: HttpContext) {
    const distro = await Distro.findOrFail(params.id)
    await distro.delete()
    return response.noContent()
  }
}
