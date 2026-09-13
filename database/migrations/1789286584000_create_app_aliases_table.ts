import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Additional AppStream IDs an application answers to. Applications change their AppStream ID over
 * time (`net.example.app` became `org.example.app`) and both IDs stay in use in the repositories
 * that were published before and after the change, so the catalog would import the same application
 * twice. Merging the two parts registers the IDs of the merged application as aliases of the one
 * that remains, and a merged ID can no longer create an application of its own.
 */
export default class extends BaseSchema {
  protected tableName = 'app_aliases'

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

      table.string('appstream_id').notNullable().unique()

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
