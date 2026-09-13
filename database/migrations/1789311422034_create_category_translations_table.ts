import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Localized display name of a category. The name used to be a JSON column on `categories`, which
 * made every response carry every translation and made the name impossible to index. One row per
 * category and locale keeps a listing down to the locales a client asks for, and the `(locale,
 * name)` index makes the localized name sortable.
 */
export default class extends BaseSchema {
  protected tableName = 'category_translations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('category_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('categories')
        .onDelete('CASCADE')

      table.string('locale', 16).notNullable()
      table.string('name').notNullable()

      table.unique(['category_id', 'locale'])
      // Lookup of a category in one locale, and the name sort
      table.index(['locale', 'name'])

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
