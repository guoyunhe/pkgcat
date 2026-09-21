import { BaseSeeder } from '@adonisjs/lucid/seeders'

import { communityRepos } from '#database/data/community_repos'
import type { DistroSelector } from '#database/data/types'
import { vendorRepos } from '#database/data/vendor_repos'
import Distro from '#models/distro'
import Repo from '#models/repo'

/** Release a repository serves, which the seeder of the distributions has to have stored already. */
async function findDistro({ name, version, arch }: DistroSelector) {
  const query = Distro.query().where('name', name).where('arch', arch)
  if (version === null) {
    query.whereNull('version')
  } else {
    query.where('version', version)
  }

  const distro = await query.first()
  if (!distro) throw new Error(`Unknown release: ${name} ${version ?? '(rolling)'} (${arch})`)
  return distro
}

/**
 * Writes the repositories of the catalog that no distribution ships — the ones its community and
 * the vendors of its applications publish — which are read from `database/data`. A repository is
 * stored once per base URL and linked to every release its `distros` selectors name, so a
 * repository a whole family of releases installs from is one entry with several entries behind it.
 */
export default class RepoSeeder extends BaseSeeder {
  async run() {
    for (const { distros, ...attributes } of [...communityRepos, ...vendorRepos]) {
      const repo = await Repo.updateOrCreate({ name: attributes.name }, attributes)
      // `sync` keeps the list of served releases exact: a repository this seeder no longer links to
      // a release is unlinked from it
      const served = await Promise.all(distros.map((selector) => findDistro(selector)))
      await repo.related('distros').sync(served.map((distro) => distro.id))
    }
  }
}
