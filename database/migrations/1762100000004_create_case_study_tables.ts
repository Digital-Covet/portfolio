import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Tag junctions: [child column, referenced table].
 */
const TAGS = [
  ['key_business_id', 'key_business'],
  ['work_category_id', 'work_category'],
  ['service_id', 'service'],
  ['business_model_id', 'business_model'],
] as const

/**
 * Ordered one-to-many children that have their own id.
 */
const ORDERED_CHILDREN: Record<string, string> = {
  case_study_video: `
    url           text NOT NULL, -- embed URL; the provider is derived from it by the app`,
  case_study_metric: `
    label         varchar(255) NOT NULL,
    value         varchar(255) NOT NULL, -- display text such as '+45%'; free-form`,
  case_study_testimonial: `
    quote         text NOT NULL,
    author_name   varchar(255) NOT NULL,
    author_title  varchar(255),`,
}

export default class extends BaseSchema {
  async up() {
    // purpose: A portfolio case study: the central record of the workspace.
    this.schema.raw(`
      CREATE TABLE case_study (
        id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title            varchar(255) NOT NULL,
        slug             varchar(255) NOT NULL,
        content_markdown text,
        status           varchar(20) NOT NULL DEFAULT 'draft',
        client_id        uuid NOT NULL REFERENCES client (id) ON DELETE RESTRICT,
        department_id    uuid NOT NULL REFERENCES department (id) ON DELETE RESTRICT,
        hero_file_id     uuid REFERENCES file (id) ON DELETE SET NULL,
        created_by       uuid NOT NULL REFERENCES app_user (id) ON DELETE RESTRICT,
        updated_by       uuid REFERENCES app_user (id) ON DELETE SET NULL,
        created_at       timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at       timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at       timestamptz,
        CONSTRAINT case_study_status_check CHECK (status IN ('draft', 'published', 'archived'))
      )
    `)
    this.schema.raw(
      'CREATE UNIQUE INDEX case_study_slug_live_uq ON case_study (slug) WHERE deleted_at IS NULL'
    )
    this.schema.raw(
      'CREATE INDEX case_study_status_created_at_idx ON case_study (status, created_at DESC) WHERE deleted_at IS NULL'
    )
    this.schema.raw('CREATE INDEX case_study_client_id_idx ON case_study (client_id)')
    this.schema.raw('CREATE INDEX case_study_department_id_idx ON case_study (department_id)')
    this.schema.raw('CREATE INDEX case_study_created_by_idx ON case_study (created_by)')
    this.schema.raw(`
      CREATE TRIGGER case_study_set_updated_at BEFORE UPDATE ON case_study
        FOR EACH ROW EXECUTE FUNCTION set_updated_at()
    `)

    for (const [column, ref] of TAGS) {
      const table = `case_study_${ref}`
      this.schema.raw(`
        CREATE TABLE ${table} (
          case_study_id uuid NOT NULL REFERENCES case_study (id) ON DELETE CASCADE,
          ${column} uuid NOT NULL REFERENCES ${ref} (id) ON DELETE RESTRICT,
          PRIMARY KEY (case_study_id, ${column})
        )
      `)
      this.schema.raw(`CREATE INDEX ${table}_${column}_idx ON ${table} (${column})`)
    }

    // purpose: Ordered gallery images shown in the case study lightbox.
    this.schema.raw(`
      CREATE TABLE case_study_image (
        case_study_id uuid NOT NULL REFERENCES case_study (id) ON DELETE CASCADE,
        file_id       uuid NOT NULL REFERENCES file (id) ON DELETE RESTRICT,
        sort_order    integer NOT NULL DEFAULT 0,
        created_at    timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at    timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (case_study_id, file_id),
        CONSTRAINT case_study_image_sort_order_check CHECK (sort_order >= 0)
      )
    `)
    this.schema.raw(`
      CREATE TRIGGER case_study_image_set_updated_at BEFORE UPDATE ON case_study_image
        FOR EACH ROW EXECUTE FUNCTION set_updated_at()
    `)

    // purpose: Downloadable file attachments on a case study.
    this.schema.raw(`
      CREATE TABLE case_study_attachment (
        case_study_id uuid NOT NULL REFERENCES case_study (id) ON DELETE CASCADE,
        file_id       uuid NOT NULL REFERENCES file (id) ON DELETE RESTRICT,
        created_at    timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (case_study_id, file_id)
      )
    `)

    // purpose: Video embeds, KPI metrics and testimonials shown on a case study.
    for (const [table, columns] of Object.entries(ORDERED_CHILDREN)) {
      this.schema.raw(`
        CREATE TABLE ${table} (
          id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          case_study_id uuid NOT NULL REFERENCES case_study (id) ON DELETE CASCADE,${columns}
          sort_order    integer NOT NULL DEFAULT 0,
          created_at    timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at    timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT ${table}_sort_order_check CHECK (sort_order >= 0)
        )
      `)
      this.schema.raw(
        `CREATE INDEX ${table}_case_study_id_sort_order_idx ON ${table} (case_study_id, sort_order)`
      )
      this.schema.raw(`
        CREATE TRIGGER ${table}_set_updated_at BEFORE UPDATE ON ${table}
          FOR EACH ROW EXECUTE FUNCTION set_updated_at()
      `)
    }
  }

  async down() {
    const tables = [
      ...Object.keys(ORDERED_CHILDREN),
      'case_study_attachment',
      'case_study_image',
      ...TAGS.map(([, ref]) => `case_study_${ref}`),
      'case_study',
    ]
    for (const table of tables) {
      this.schema.raw(`DROP TABLE IF EXISTS ${table} CASCADE`)
    }
  }
}
