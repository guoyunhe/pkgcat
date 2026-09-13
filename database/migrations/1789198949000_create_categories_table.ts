import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Application categories, taken from the freedesktop.org menu specification
 * (https://specifications.freedesktop.org/menu/latest/category-registry.html). `code` is the
 * case-sensitive identifier used by AppStream (`<category>Game</category>`), while `name` holds the
 * localized display names. Categories form a tree through `parent_id`.
 */
export default class extends BaseSchema {
  protected tableName = 'categories'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('code').notNullable().unique()
      table.json('name').notNullable().defaultTo('{}')

      table
        .integer('parent_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('categories')
        .onDelete('SET NULL')

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
