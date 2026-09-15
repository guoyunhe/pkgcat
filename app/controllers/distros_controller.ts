import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

import Distro from '#models/distro'
import { attachCounts, distroCounts } from '#services/catalog_counts'
import DistroTransformer from '#transformers/distro_transformer'
import { distroListValidator, distroValidator } from '#validators/distro'

/** Lucid date columns expect a `DateTime` instance, while the validator hands over ISO strings. */
function toDateTime(value: string | null) {
  return value ? DateTime.fromISO(value) : null
}

export default class DistrosController {
  async index({ request, serialize }: HttpContext) {
    const { sort } = await request.validateUsing(distroListValidator)
    // The releases of one distribution stay together under its name, and follow each other from the
    // newest to the oldest one, which their versions cannot express: as text, "10" comes before "8".
    // A rolling release keeps no date, so it comes first within its name. The remaining keys only
    // keep the order stable for releases published on the same day and for the architectures of one
    // entry
    const distros = await Distro.query()
      .preload('compatibleDistro')
      .orderBy('name')
      .orderByRaw('release_date is null desc')
      .orderBy('releaseDate', 'desc')
      .orderBy('version')
      .orderBy('arch')
    attachCounts(distros, await distroCounts(), sort)
    return serialize(DistroTransformer.transform(distros))
  }

  async show({ params, serialize }: HttpContext) {
    const distro = await Distro.query()
      .where('id', params.id)
      .preload('compatibleDistro')
      .firstOrFail()
    attachCounts([distro], await distroCounts(), 'name')
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
