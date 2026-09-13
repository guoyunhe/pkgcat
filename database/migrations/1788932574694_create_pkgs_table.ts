import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pkgs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('type').notNullable().index()
      table.string('name').notNullable().index()
      table.string('version').nullable()
      table.string('release').nullable()
      table.string('arch').nullable()
      table.text('license').nullable()
      table.text('summary').nullable()
      table.text('description').nullable()
      table
        .integer('repo_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('repos')
        .onDelete('SET NULL')
      table.string('path').nullable()
      table
        .integer('user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.string('download_url').nullable()
      table.string('checksum').nullable()
      table.string('checksum_type').nullable()
      table.integer('size').unsigned().nullable()
      table.text('install_command').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
