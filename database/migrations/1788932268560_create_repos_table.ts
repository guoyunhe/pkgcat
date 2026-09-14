import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'repos'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Both the name and the URL a repository is read from are unique: they are what tells two
      // repositories apart
      table.string('name').notNullable().unique()
      table.string('type').notNullable().index()
      table.string('source').notNullable().index()

      table.string('base_url').notNullable().unique()
      table.text('config_content').nullable()
      table.string('config_url').nullable()
      table.text('install_script').nullable()

      // Synchronization interval in days; null means the repo is only synced manually.
      table.integer('sync_interval_days').unsigned().nullable()
      table.timestamp('last_synced_at').nullable()

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
