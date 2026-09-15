import { BaseSeeder } from '@adonisjs/lucid/seeders'

import { distroRepos } from '#database/data/distro_repos'
import { distros } from '#database/data/distros'
import type { DistroSelector } from '#database/data/types'
import Distro from '#models/distro'
import Repo from '#models/repo'

/** Key of one entry of the catalog: the triple a repository links the releases it serves by. */
function entryKey({ name, version, arch }: DistroSelector) {
  return [name, version, arch].map((value) => value ?? '').join('\u0000')
}

/** Release as the entries of the catalog name it, which is how an unknown one is reported. */
function releaseLabel({ name, version, arch }: DistroSelector) {
  return `${name} ${version ?? '(rolling)'} (${arch})`
}

/**
 * Writes the catalog of the distributions and the repositories the distributions publish
 * themselves, which are read from `database/data`. Every architecture of a release becomes an entry
 * of its own, and a repository is stored once per base URL and linked to each release its `distros`
 * selectors name.
 *
 * A compatibility is written once every entry exists, so that a release may name one the data
 * declares after it, and whatever names a release the data does not carry is reported instead of
 * being written half way.
 */
export default class DistroSeeder extends BaseSeeder {
  async run() {
    // Entries written, which the compatibilities and the repositories are resolved against
    const entries = new Map<string, Distro>()
    const compatibilities: { distro: Distro; compatible: DistroSelector }[] = []

    for (const { arches, compatibleWith, ...attributes } of distros) {
      for (const arch of arches) {
        // The seed data carries ISO dates, while the Lucid types expect `DateTime` instances
        const distro = await Distro.updateOrCreate(
          { name: attributes.name, version: attributes.version, arch },
          { ...attributes, arch } as any,
        )
        entries.set(entryKey({ name: distro.name, version: distro.version, arch }), distro)
        if (compatibleWith)
          compatibilities.push({ distro, compatible: { ...compatibleWith, arch } })
      }
    }

    for (const { distro, compatible } of compatibilities) {
      const target = entries.get(entryKey(compatible))
      if (!target) throw new Error(`Unknown release: ${releaseLabel(compatible)}`)
      if (distro.compatibleDistroId === target.id) continue

      distro.compatibleDistroId = target.id
      await distro.save()
    }

    for (const { distros: selectors, ...attributes } of distroRepos) {
      const repo = await Repo.updateOrCreate({ name: attributes.name }, attributes)
      const served = selectors.map((selector) => {
        const distro = entries.get(entryKey(selector))
        if (!distro) throw new Error(`Unknown release: ${releaseLabel(selector)}`)
        return distro.id
      })
      // A repository is linked to every release it serves, and `sync` keeps that list exact
      await repo.related('distros').sync(served)
    }
  }
}
