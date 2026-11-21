import { BaseSeeder } from '@adonisjs/lucid/seeders'

import { communityRepos } from '#database/data/community_repos'
import type { DistroSelector } from '#database/data/types'
import { vendorRepos } from '#database/data/vendor_repos'
import Distro from '#models/distro'
import Repo from '#models/repo'
import { isSupportedArch } from '#utils/arch'

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
 * Only the releases of the architectures `config/arch.ts` supports are linked, and a repository
 * that serves none of them is left out.
 */
export default class RepoSeeder extends BaseSeeder {
  async run() {
    for (const { distros, ...attributes } of [...communityRepos, ...vendorRepos]) {
      const served = distros.filter((selector) => isSupportedArch(selector.arch))
      if (served.length === 0) continue

      const repo = await Repo.updateOrCreate({ baseUrl: attributes.baseUrl }, attributes)
      // `sync` keeps the list of served releases exact: a repository this seeder no longer links to
      // a release is unlinked from it
      const releases = await Promise.all(served.map((selector) => findDistro(selector)))
      await repo.related('distros').sync(releases.map((distro) => distro.id))
    }
  }
}
