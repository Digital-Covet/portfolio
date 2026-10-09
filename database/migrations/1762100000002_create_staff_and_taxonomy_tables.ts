import { BaseSchema } from '@adonisjs/lucid/schema'

const TAXONOMY = ['department', 'sector', 'work_category', 'service', 'business_model'] as const

export default class extends BaseSchema {
  async up() {
    // purpose: Departments that scope which case studies a staff member may write.
    // purpose: Top level of the Sector > Industry > Key Business hierarchy.
    // purpose: Work categories, services and business models used to tag case studies.
    for (const table of TAXONOMY) {
      this.schema.raw(`
        CREATE TABLE ${table} (
          id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          name       citext NOT NULL,
          created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT ${table}_name_uq UNIQUE (name)
        )
      `)
      this.schema.raw(`
        CREATE TRIGGER ${table}_set_updated_at BEFORE UPDATE ON ${table}
          FOR EACH ROW EXECUTE FUNCTION set_updated_at()
      `)
    }

    // purpose: Local mirror of an IAM user (id is the IAM user id, no default, no cross-db FK).
    this.schema.raw(`
      CREATE TABLE app_user (
        id             uuid PRIMARY KEY,
        email          citext NOT NULL,
        name           text,
        image          text,
        role           varchar(20) NOT NULL,
        department_id  uuid REFERENCES department (id) ON DELETE RESTRICT,
        last_synced_at timestamptz,
        created_at     timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at     timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at     timestamptz,
        CONSTRAINT app_user_role_check CHECK (role IN ('employee', 'admin', 'superadmin'))
      )
    `)
    this.schema.raw(
      'CREATE UNIQUE INDEX app_user_email_live_uq ON app_user (email) WHERE deleted_at IS NULL'
    )
    this.schema.raw('CREATE INDEX app_user_department_id_idx ON app_user (department_id)')
    this.schema.raw(`
      CREATE TRIGGER app_user_set_updated_at BEFORE UPDATE ON app_user
        FOR EACH ROW EXECUTE FUNCTION set_updated_at()
    `)

    // purpose: Middle level of the hierarchy; belongs to exactly one sector.
    this.schema.raw(`
      CREATE TABLE industry (
        id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        sector_id  uuid NOT NULL REFERENCES sector (id) ON DELETE RESTRICT,
        name       citext NOT NULL,
        created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT industry_sector_name_uq UNIQUE (sector_id, name)
      )
    `)
    this.schema.raw(`
      CREATE TRIGGER industry_set_updated_at BEFORE UPDATE ON industry
        FOR EACH ROW EXECUTE FUNCTION set_updated_at()
    `)

    // purpose: Bottom level of the hierarchy; the level at which case studies and clients are tagged.
    this.schema.raw(`
      CREATE TABLE key_business (
        id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        industry_id uuid NOT NULL REFERENCES industry (id) ON DELETE RESTRICT,
        name        citext NOT NULL,
        created_at  timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at  timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT key_business_industry_name_uq UNIQUE (industry_id, name)
      )
    `)
    this.schema.raw(`
      CREATE TRIGGER key_business_set_updated_at BEFORE UPDATE ON key_business
        FOR EACH ROW EXECUTE FUNCTION set_updated_at()
    `)
  }

  async down() {
    for (const table of ['key_business', 'industry', 'app_user', ...TAXONOMY]) {
      this.schema.raw(`DROP TABLE IF EXISTS ${table} CASCADE`)
    }
  }
}
