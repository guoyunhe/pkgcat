import type { HttpContext } from '@adonisjs/core/http'

import Distro from '#models/distro'
import Repo from '#models/repo'
import RepoTransformer from '#transformers/repo_transformer'
import { pageOf } from '#utils/pagination'
import { repoListValidator, repoValidator } from '#validators/repo'

export default class ReposController {
  async index({ request, serialize }: HttpContext) {
    const { page, perPage, q, sort, source, distroId } =
      await request.validateUsing(repoListValidator)
    // The counts a listing shows are stored with the entry it lists (`Repo.pkgCount` and
    // `Repo.appCount`, written by the synchronization that changes the packages), so the entries a
    // page holds and the counts they show are read together, and the order by a count is the order
    // of a column
    const query = Repo.query().preload('distros')
    const countColumns = { packages: 'pkgCount', apps: 'appCount' } as const
    if (sort !== 'name') query.orderBy(countColumns[sort], 'desc')
    query.orderBy('name')
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

    // A listing that asked for no page size receives every repository, which the pagination of the
    // database cannot express; the others are paged by it
    if (perPage === 0) {
      const { entries, meta } = pageOf(await query, page, perPage)
      return serialize(RepoTransformer.paginate(entries, meta))
    }

    const paginator = await query.paginate(page, perPage)
    return serialize(RepoTransformer.paginate(paginator.all(), paginator.getMeta()))
  }

  async show({ params, serialize }: HttpContext) {
    const repo = await Repo.query().where('id', params.id).preload('distros').firstOrFail()
    return serialize(RepoTransformer.transform(repo))
  }

  async store({ request, response, serialize }: HttpContext) {
    const { distroIds, ...attributes } = await request.validateUsing(repoValidator)

    const repo = await Repo.create(attributes)
    if (distroIds) await repo.related('distros').sync(distroIds)
    await repo.load('distros')
    // A repository the catalog just created holds no packages, so the counts of the distributions
    // it was linked to are unchanged
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
    // A distribution holds the packages of every repository serving it, so the links the form
    // changed are what its counts are made of
    await Distro.refreshCounts()
    return serialize(RepoTransformer.transform(repo))
  }

  async destroy({ params, response }: HttpContext) {
    const repo = await Repo.findOrFail(params.id)
    await repo.delete()
    // The packages of the repository are removed with it, so the distributions it served hold
    // fewer of them
    await Distro.refreshCounts()
    return response.noContent()
  }
}
