import type { HttpContext } from '@adonisjs/core/http'

import Repo from '#models/repo'
import { attachCounts, repoCounts } from '#services/catalog_counts'
import RepoTransformer from '#transformers/repo_transformer'
import { pageOf } from '#utils/pagination'
import { repoListValidator, repoValidator } from '#validators/repo'

export default class ReposController {
  async index({ request, serialize }: HttpContext) {
    const { page, perPage, q, sort, source, distroId } =
      await request.validateUsing(repoListValidator)
    const query = Repo.query().preload('distros').orderBy('name')
    // The repositories of one release, which its detail page lists
    if (distroId) query.whereHas('distros', (distros) => distros.where('distros.id', distroId))
    if (source) query.where('source', source)
    if (q) {
      // A repository is found by what names it — its own name and address, the format it publishes
      // and the origin it is read with — and by the releases it serves
      const pattern = `%${q.replace(/[\\%_]/g, '\\$&')}%`
      query.where((subquery) => {
        subquery
          .whereILike('name', pattern)
          .orWhereILike('base_url', pattern)
          .orWhereILike('type', pattern)
          .orWhereILike('source', pattern)
          .orWhereHas('distros', (distros) => {
            distros.where((release) => {
              release
                .whereILike('name', pattern)
                .orWhereILike('version', pattern)
                .orWhereILike('arch', pattern)
            })
          })
      })
    }

    // The order by a count is the order of the whole listing — the counts say how the entries
    // follow each other — so the page is cut out of the ordered repositories instead of being
    // asked of the database. The catalog is small enough to be read whole for it, and the counts
    // are read for every repository anyway
    const repos = await query
    attachCounts(repos, await repoCounts(), sort)
    const { entries, meta } = pageOf(repos, page, perPage)
    return serialize(RepoTransformer.paginate(entries, meta))
  }

  async show({ params, serialize }: HttpContext) {
    const repo = await Repo.query().where('id', params.id).preload('distros').firstOrFail()
    attachCounts([repo], await repoCounts(), 'name')
    return serialize(RepoTransformer.transform(repo))
  }

  async store({ request, response, serialize }: HttpContext) {
    const { distroIds, ...attributes } = await request.validateUsing(repoValidator)

    const repo = await Repo.create(attributes)
    if (distroIds) await repo.related('distros').sync(distroIds)
    await repo.load('distros')
    // NOTE: `response.created()` sends the response immediately (with an empty body), so the
    // status is set directly to keep the serialized repository in the payload.
    response.status(201)
    return serialize(RepoTransformer.transform(repo))
  }

  async update({ params, request, serialize }: HttpContext) {
    const repo = await Repo.findOrFail(params.id)
    const { distroIds, ...attributes } = await request.validateUsing(repoValidator, {
      meta: { repoId: repo.id },
    })

    await repo.merge(attributes).save()
    // The form lists every distribution of the repository, so the stored links follow the selection
    if (distroIds) await repo.related('distros').sync(distroIds)
    await repo.load('distros')
    return serialize(RepoTransformer.transform(repo))
  }

  async destroy({ params, response }: HttpContext) {
    const repo = await Repo.findOrFail(params.id)
    await repo.delete()
    return response.noContent()
  }
}
