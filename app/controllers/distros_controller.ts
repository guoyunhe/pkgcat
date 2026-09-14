import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

import Distro from '#models/distro'
import DistroTransformer from '#transformers/distro_transformer'
import { distroValidator } from '#validators/distro'

/** Lucid date columns expect a `DateTime` instance, while the validator hands over ISO strings. */
function toDateTime(value: string | null) {
  return value ? DateTime.fromISO(value) : null
}

export default class DistrosController {
  async index({ serialize }: HttpContext) {
    // The releases of one distribution stay together under its name, and follow each other from the
    // newest to the oldest one, which their versions cannot express: as text, "10" comes before "8".
    // A rolling release keeps no date, so it comes first within its name. The remaining keys only
    // keep the order stable for releases published on the same day and for the architectures of one
    // entry
    const distros = await Distro.query()
      .preload('compatibleDistro')
      .preload('compatibleDistros')
      .orderBy('name')
      .orderByRaw('release_date is null desc')
      .orderBy('releaseDate', 'desc')
      .orderBy('version')
      .orderBy('arch')
    return serialize(DistroTransformer.transform(distros))
  }

  async show({ params, serialize }: HttpContext) {
    const distro = await Distro.query()
      .where('id', params.id)
      .preload('compatibleDistro')
      .preload('compatibleDistros')
      .firstOrFail()
    return serialize(DistroTransformer.transform(distro))
  }

  /**
   * Compatibility holds both ways, so a distribution is written together with the two relations
   * that answer with it: the release it names and the releases that name it. An entry that names
   * nothing still has to answer with the entries that name it, and the other way around.
   */
  private async loadCompatibilities(distro: Distro) {
    await distro.load('compatibleDistro')
    await distro.load('compatibleDistros')
  }

  async store({ request, response, serialize }: HttpContext) {
    const payload = await request.validateUsing(distroValidator)

    const distro = await Distro.create({
      ...payload,
      releaseDate: toDateTime(payload.releaseDate),
      eolDate: toDateTime(payload.eolDate),
    })
    await this.loadCompatibilities(distro)
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
    await this.loadCompatibilities(distro)
    return serialize(DistroTransformer.transform(distro))
  }

  async destroy({ params, response }: HttpContext) {
    const distro = await Distro.findOrFail(params.id)
    await distro.delete()
    return response.noContent()
  }
}
