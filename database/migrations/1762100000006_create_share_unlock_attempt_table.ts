import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // purpose: Counts password attempts on share links per client, shared across app processes.
    this.schema.raw(`
      CREATE TABLE share_unlock_attempt (
        key       text PRIMARY KEY, -- "<client ip>:<share id>"
        attempts  integer NOT NULL,
        reset_at  timestamptz NOT NULL
      )
    `)
    this.schema.raw(
      'CREATE INDEX share_unlock_attempt_reset_at_idx ON share_unlock_attempt (reset_at)'
    )
  }

  async down() {
    this.schema.raw('DROP TABLE IF EXISTS share_unlock_attempt')
  }
}
