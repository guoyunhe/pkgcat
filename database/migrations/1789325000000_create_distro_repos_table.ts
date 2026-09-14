import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Distributions a repository serves. A distribution is one release of a distribution for one
 * architecture, and the same repository holds the packages of several of them: the archive of a deb
 * distribution serves every architecture it is published for, and a repository of a community
 * project may serve several releases, so the link is a many-to-many one.
 */
export default class extends BaseSchema {
  protected tableName = 'distro_repos'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('distro_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('distros')
        .onDelete('CASCADE')

      table
        .integer('repo_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('repos')
        .onDelete('CASCADE')

      table.unique(['distro_id', 'repo_id'])

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
