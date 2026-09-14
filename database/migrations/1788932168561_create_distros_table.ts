import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'distros'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('name').notNullable()
      table.string('version').nullable()
      // A distribution is stored once per architecture, so the architecture is part of its
      // identity instead of a list of the architectures it is published for.
      table.string('arch').notNullable()
      table.string('pkg_type').nullable()
      table.unique(['name', 'version', 'arch'])

      table.date('release_date').nullable()
      table.date('eol_date').nullable()

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
