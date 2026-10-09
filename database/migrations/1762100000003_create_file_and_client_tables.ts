import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // purpose: Metadata for every object stored in Supabase Object Storage; file proxy routes authorize against it.
    this.schema.raw(`
      CREATE TABLE file (
        id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        bucket        text NOT NULL, -- Supabase Storage bucket name
        storage_path  text NOT NULL, -- object path inside the bucket
        original_name text NOT NULL,
        mime_type     varchar(255) NOT NULL,
        size_bytes    bigint NOT NULL,
        visibility    varchar(20) NOT NULL DEFAULT 'authenticated',
        uploaded_by   uuid NOT NULL REFERENCES app_user (id) ON DELETE RESTRICT,
        created_at    timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT file_bucket_path_uq UNIQUE (bucket, storage_path),
        CONSTRAINT file_size_bytes_check CHECK (size_bytes >= 0),
        CONSTRAINT file_visibility_check CHECK (visibility IN ('public', 'authenticated'))
      )
    `)
    this.schema.raw('CREATE INDEX file_uploaded_by_idx ON file (uploaded_by)')

    // purpose: A client the agency has worked for (admin and above manage these).
    this.schema.raw(`
      CREATE TABLE client (
        id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name         varchar(255) NOT NULL, -- not unique: two distinct clients may share a name
        logo_file_id uuid REFERENCES file (id) ON DELETE SET NULL,
        created_by   uuid NOT NULL REFERENCES app_user (id) ON DELETE RESTRICT,
        updated_by   uuid REFERENCES app_user (id) ON DELETE SET NULL,
        created_at   timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at   timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at   timestamptz
      )
    `)
    this.schema.raw('CREATE INDEX client_name_idx ON client (name) WHERE deleted_at IS NULL')
    this.schema.raw(`
      CREATE TRIGGER client_set_updated_at BEFORE UPDATE ON client
        FOR EACH ROW EXECUTE FUNCTION set_updated_at()
    `)

    // purpose: Links a client to the Key Businesses it operates in (many-to-many).
    this.schema.raw(`
      CREATE TABLE client_key_business (
        client_id       uuid NOT NULL REFERENCES client (id) ON DELETE CASCADE,
        key_business_id uuid NOT NULL REFERENCES key_business (id) ON DELETE RESTRICT,
        PRIMARY KEY (client_id, key_business_id)
      )
    `)
    this.schema.raw(
      'CREATE INDEX client_key_business_key_business_id_idx ON client_key_business (key_business_id)'
    )
  }

  async down() {
    for (const table of ['client_key_business', 'client', 'file']) {
      this.schema.raw(`DROP TABLE IF EXISTS ${table} CASCADE`)
    }
  }
}
