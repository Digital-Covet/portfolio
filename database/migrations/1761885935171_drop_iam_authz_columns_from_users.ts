import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * IAM is the sole authority for authorization. `role` and `app_access`
 * were synced copies that went stale (deleted/disabled IAM users kept
 * their last Portfolio role, and unknown roles fell back to 'employee').
 * Authz now lives in the session claims stored at OAuth login, so drop
 * the columns. Identity link (`iam_sub`) + profile cache
 * (`avatar_url`, `email_verified`, `department_id`) stay.
 */
export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('role')
      table.dropColumn('app_access')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('role').notNullable().defaultTo('employee')
      table.text('app_access').nullable()
    })
  }
}
