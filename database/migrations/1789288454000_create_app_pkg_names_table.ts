import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Package names an application owns. Repositories ship many packages that carry no AppStream
 * metadata at all (libraries, plugins, subpackages), and the package name is then the only thing
 * that tells which application they belong to, so a name is mapped to an application here. The
 * automatic import links every package whose name is mapped and that no AppStream metadata of the
 * repository already assigns to an application.
 *
 * A name is only unique together with the package format it is used in, because the same name may
 * be a deb of one application and an rpm of another. An empty format is the mapping for every
 * format, which is what a package that is named the same everywhere uses, and a mapping for an
 * explicit format wins over it.
 */
export default class extends BaseSchema {
  protected tableName = 'app_pkg_names'

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

      table.string('name').notNullable()
      table.string('type').notNullable().defaultTo('')

      // A package name may only be mapped once, so that no package can be claimed by two
      // applications at the same time
      table.unique(['name', 'type'])

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
