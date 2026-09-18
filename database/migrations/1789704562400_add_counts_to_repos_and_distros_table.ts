import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Counts a listing shows next to every entry, stored with the entry itself instead of being counted
 * for every request: the packages a repository holds and the applications those packages provide,
 * and the same two for a distribution, which holds the packages of every repository serving it. A
 * listing of thousands of entries cannot count them per request while it is ordered by them, so the
 * counts are written where the packages change (`Repo.refreshCounts` and `Distro.refreshCounts`,
 * which count them the same way as a listing used to) and read as columns.
 *
 * The columns start at zero for the entries the catalog already holds; a count is written for them
 * by the next refresh, which any write through the API, a synchronization or `app:prune` runs.
 */
export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('repos', (table) => {
      table.integer('pkg_count').unsigned().notNullable().defaultTo(0)
      table.integer('app_count').unsigned().notNullable().defaultTo(0)
    })

    this.schema.alterTable('distros', (table) => {
      table.integer('pkg_count').unsigned().notNullable().defaultTo(0)
      table.integer('app_count').unsigned().notNullable().defaultTo(0)
    })
  }

  async down() {
    this.schema.alterTable('repos', (table) => {
      table.dropColumn('pkg_count')
      table.dropColumn('app_count')
    })

    this.schema.alterTable('distros', (table) => {
      table.dropColumn('pkg_count')
      table.dropColumn('app_count')
    })
  }
}
