import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Localized text of an application. The name and the summary used to be JSON columns on `apps`,
 * which made every listing response carry every translation of every application and made sorting
 * or searching by name a full scan (`json_extract` cannot be indexed). One row per application and
 * locale keeps a listing down to the locale the client asks for, and the `(locale, name)` index
 * makes the localized name sortable.
 */
export default class extends BaseSchema {
  protected tableName = 'app_translations'

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

      table.string('locale', 16).notNullable()
      // A locale carries a name, a summary, or both: repositories may translate one without the
      // other, and an editor may complete a translation one field at a time
      table.string('name').nullable()
      table.text('summary').nullable()

      table.unique(['app_id', 'locale'])
      // Lookup of a page of applications in one locale, and the name sort
      table.index(['locale', 'name'])

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
