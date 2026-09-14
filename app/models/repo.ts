import { hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'

import { RepoSchema } from '#database/schema'
import Distro from '#models/distro'
import Pkg from '#models/pkg'

export default class Repo extends RepoSchema {
  /**
   * Distributions the repository serves. A repository holds the packages of every distribution it
   * is linked to, and a distribution may be served by several repositories.
   */
  @manyToMany(() => Distro, {
    pivotTable: 'distro_repos',
    pivotForeignKey: 'repo_id',
    pivotRelatedForeignKey: 'distro_id',
  })
  declare distros: ManyToMany<typeof Distro>

  @hasMany(() => Pkg)
  declare packages: HasMany<typeof Pkg>
}
