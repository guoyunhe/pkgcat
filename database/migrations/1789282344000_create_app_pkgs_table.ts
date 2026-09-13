import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Packages an application is made of. A package provides several applications when it ships several
 * AppStream metadata files, or when one of them holds several components, so the link is a
 * many-to-many one.
 */
export default class extends BaseSchema {
  protected tableName = 'app_pkgs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('app_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('apps')
        .onDelete('CASCADE')

      table
        .integer('pkg_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('pkgs')
        .onDelete('CASCADE')

      table.unique(['app_id', 'pkg_id'])

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
