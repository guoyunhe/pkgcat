import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    // The distribution a user runs and the avatar they uploaded. Both point at tables written after
    // `users` — a distribution is one entry per release, an avatar is an image — so they are added
    // here, where everything they reference exists.
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('distro_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('distros')
        .onDelete('SET NULL')
      table
        .integer('avatar_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('images')
        .onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign('distro_id')
      table.dropForeign('avatar_id')
      table.dropColumn('distro_id')
      table.dropColumn('avatar_id')
    })
  }
}
