import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Applications an addon extends. An AppStream addon names the components it extends, and a
 * component has several addons, so the link is a many-to-many one between two applications.
 */
export default class extends BaseSchema {
  protected tableName = 'app_addons'

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
        .integer('addon_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('apps')
        .onDelete('CASCADE')

      table.unique(['app_id', 'addon_id'])

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
