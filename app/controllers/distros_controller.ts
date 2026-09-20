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
    // The counts a listing shows are stored with the entry it lists (`Distro.pkgCount` and
    // `Distro.appCount`, written by the synchronization that changes the packages), so the entries a
    // page holds and the counts they show are read together, and the order by a count is the order
    // of a column — which is why a sort is named after the field it orders by. The users of a
    // release are counted by the database with the entries it counts them for instead
    // (`Distro.users`), which every listing asks for — a card of the home page shows the count of a
    // release, and the sorting reads the same number
    const query = Distro.query()
      .preload('compatibleDistro')
      .withAggregate('users', (subQuery) => subQuery.count('*').as('userCount'))
    // The releases of one distribution stay together under its name, and follow each other from the
    // newest to the oldest one, which their versions cannot express: as text, "10" comes before "8".
    // A rolling release keeps no date, so it comes first within its name. The remaining keys only
    // keep the order stable for releases published on the same day and for the architectures of one
    // entry — and, read after a count, they are the order the entries that share it follow each
    // other in, so a page of such a listing holds the same entries every time it is read
    if (sort !== 'name') query.orderBy(sort, 'desc')
    query.orderBy('name').orderBy('releaseDate', 'desc').orderBy('arch')
    if (q) query.apply((scopes) => scopes.search(q))
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
    const distro = await Distro.query()
      .where('id', params.id)
      .preload('compatibleDistro')
      .withAggregate('users', (subQuery) => subQuery.count('*').as('userCount'))
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
