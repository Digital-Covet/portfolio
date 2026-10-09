import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.raw('CREATE EXTENSION IF NOT EXISTS citext')

    // Keeps updated_at correct no matter which client or ORM writes the row.
    this.schema.raw(`
      CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
      LANGUAGE plpgsql AS $$
      BEGIN
        NEW.updated_at := CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$
    `)
  }

  async down() {
    this.schema.raw('DROP FUNCTION IF EXISTS set_updated_at()')
  }
}
