import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('pkg_distros', (table) => {
      table.increments('id')

      table
        .integer('distro_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('distros')
        .onDelete('CASCADE')

      table
        .integer('pkg_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('pkgs')
        .onDelete('CASCADE')

      table.unique(['distro_id', 'pkg_id'])

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable('pkg_distros')
  }
}
