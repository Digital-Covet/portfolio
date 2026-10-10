import { BaseSchema } from '@adonisjs/lucid/schema'

// [table, column, ON DELETE rule]
const REFERENCES = [
  ['file', 'uploaded_by', 'RESTRICT'],
  ['client', 'created_by', 'RESTRICT'],
  ['client', 'updated_by', 'SET NULL'],
  ['case_study', 'created_by', 'RESTRICT'],
  ['case_study', 'updated_by', 'SET NULL'],
  ['share', 'created_by', 'RESTRICT'],
  ['share', 'updated_by', 'SET NULL'],
] as const

export default class extends BaseSchema {
  // purpose: Lets a mirrored user be re-keyed to a new IAM id without orphaning authorship.
  async up() {
    for (const [table, column, onDelete] of REFERENCES) {
      this.schema.raw(`ALTER TABLE ${table} DROP CONSTRAINT ${table}_${column}_fkey`)
      this.schema.raw(`
        ALTER TABLE ${table} ADD CONSTRAINT ${table}_${column}_fkey
          FOREIGN KEY (${column}) REFERENCES app_user (id) ON UPDATE CASCADE ON DELETE ${onDelete}
      `)
    }
  }

  async down() {
    for (const [table, column, onDelete] of REFERENCES) {
      this.schema.raw(`ALTER TABLE ${table} DROP CONSTRAINT ${table}_${column}_fkey`)
      this.schema.raw(`
        ALTER TABLE ${table} ADD CONSTRAINT ${table}_${column}_fkey
          FOREIGN KEY (${column}) REFERENCES app_user (id) ON DELETE ${onDelete}
      `)
    }
  }
}
