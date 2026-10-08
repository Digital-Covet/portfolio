import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('password').nullable().alter()
      table.string('iam_sub').nullable().unique()
      table.string('role').notNullable().defaultTo('employee')
      table.text('app_access').nullable()
      table.string('avatar_url').nullable()
      table.boolean('email_verified').notNullable().defaultTo(false)
      table.string('department_id').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('iam_sub')
      table.dropColumn('role')
      table.dropColumn('app_access')
      table.dropColumn('avatar_url')
      table.dropColumn('email_verified')
      table.dropColumn('department_id')
    })
  }
}
