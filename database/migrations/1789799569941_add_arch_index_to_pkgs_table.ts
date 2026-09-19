import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pkgs'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.index(['arch'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['arch'])
    })
  }
}
