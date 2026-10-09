import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Targeting junctions: [child column, referenced table]. RESTRICT on the referenced
 * side stops a deletion from silently widening or emptying a share.
 */
const TARGETS = [
  ['case_study_id', 'case_study'],
  ['sector_id', 'sector'],
  ['industry_id', 'industry'],
  ['key_business_id', 'key_business'],
  ['work_category_id', 'work_category'],
  ['service_id', 'service'],
  ['client_id', 'client'],
] as const

export default class extends BaseSchema {
  async up() {
    // purpose: A shareable portfolio link with optional password, expiry and view cap.
    this.schema.raw(`
      CREATE TABLE share (
        id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name              varchar(255) NOT NULL,
        token             text NOT NULL,
        password_hash     text, -- NULL means no password; always a hash
        expires_at        timestamptz,
        max_views         integer,
        view_count        integer NOT NULL DEFAULT 0,
        recipient_name    varchar(255),
        recipient_email   varchar(320),
        recipient_company varchar(255),
        created_by        uuid NOT NULL REFERENCES app_user (id) ON DELETE RESTRICT,
        updated_by        uuid REFERENCES app_user (id) ON DELETE SET NULL,
        created_at        timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at        timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at        timestamptz, -- soft delete doubles as revoking the link
        CONSTRAINT share_token_uq UNIQUE (token),
        CONSTRAINT share_max_views_check CHECK (max_views IS NULL OR max_views > 0),
        CONSTRAINT share_view_count_check CHECK (view_count >= 0)
      )
    `)
    this.schema.raw(
      'CREATE INDEX share_created_by_idx ON share (created_by) WHERE deleted_at IS NULL'
    )
    this.schema.raw(`
      CREATE TRIGGER share_set_updated_at BEFORE UPDATE ON share
        FOR EACH ROW EXECUTE FUNCTION set_updated_at()
    `)

    for (const [column, ref] of TARGETS) {
      const table = `share_${ref}`
      this.schema.raw(`
        CREATE TABLE ${table} (
          share_id uuid NOT NULL REFERENCES share (id) ON DELETE CASCADE,
          ${column} uuid NOT NULL REFERENCES ${ref} (id) ON DELETE RESTRICT,
          PRIMARY KEY (share_id, ${column})
        )
      `)
      this.schema.raw(`CREATE INDEX ${table}_${column}_idx ON ${table} (${column})`)
    }

    // purpose: One row per visit to a share portal, feeding the views-over-time analytics.
    this.schema.raw(`
      CREATE TABLE share_view (
        id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        share_id   uuid NOT NULL REFERENCES share (id) ON DELETE CASCADE,
        viewed_at  timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ip_address inet, -- personal data under many privacy laws; consider a retention window
        user_agent text
      )
    `)
    this.schema.raw(
      'CREATE INDEX share_view_share_id_viewed_at_idx ON share_view (share_id, viewed_at)'
    )
    this.schema.raw('CREATE INDEX share_view_viewed_at_idx ON share_view (viewed_at)')
  }

  async down() {
    const tables = ['share_view', ...TARGETS.map(([, ref]) => `share_${ref}`), 'share']
    for (const table of tables) {
      this.schema.raw(`DROP TABLE IF EXISTS ${table} CASCADE`)
    }
  }
}
