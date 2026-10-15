import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'images'

  async up() {
    await this.db.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['path'])

      table
        .integer('parent_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable(this.tableName)
        .onDelete('CASCADE')
      table.string('name').nullable()
      table.string('preset').notNullable().defaultTo('image')
      table.string('disk').notNullable().defaultTo('fs')
      table.string('hash', 64).notNullable().defaultTo('').index()

      table.unique(['parent_id', 'name'])
    })
  }

  async down() {
    await this.db.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['parent_id', 'name'])
      table.dropIndex(['hash'])
      table.dropForeign(['parent_id'])

      table.dropColumns('parent_id', 'name', 'preset', 'disk', 'hash')

      table.unique(['path'])
    })
  }
}
