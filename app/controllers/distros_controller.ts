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
    const distros = await Distro.query().orderBy('name').orderBy('version').orderBy('arch')
    return serialize(DistroTransformer.transform(distros))
  }

  async show({ params, serialize }: HttpContext) {
    const distro = await Distro.findOrFail(params.id)
    return serialize(DistroTransformer.transform(distro))
  }

  async store({ request, response, serialize }: HttpContext) {
    const payload = await request.validateUsing(distroValidator)

    const distro = await Distro.create({
      ...payload,
      releaseDate: toDateTime(payload.releaseDate),
      eolDate: toDateTime(payload.eolDate),
    })
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
    return serialize(DistroTransformer.transform(distro))
  }

  async destroy({ params, response }: HttpContext) {
    const distro = await Distro.findOrFail(params.id)
    await distro.delete()
    return response.noContent()
  }
}
