import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'apps'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('type').notNullable().defaultTo('desktop-application').index()
      table.string('version').nullable()
      table.string('license').nullable()
      table.string('homepage').nullable()

      table.string('appstream_id').nullable().unique()
      table.text('appstream_content', 'mediumtext').nullable()
      table.string('appstream_url').nullable()

      table.text('desktop_content').nullable()
      table.string('desktop_url').nullable()

      table
        .integer('icon_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('images')
        .onDelete('SET NULL')

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
