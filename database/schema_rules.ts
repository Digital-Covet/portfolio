import { type SchemaRules } from '@adonisjs/lucid/types/schema_generator'

/**
 * `citext` columns are reported with an unknown type; type them as plain strings.
 */
const citextName = { tsType: 'string', decorators: [{ name: '@column' }] }

export default {
  tables: {
    app_user: {
      columns: {
        email: citextName,
        role: {
          tsType: `'employee' | 'admin' | 'superadmin'`,
          decorators: [{ name: '@column' }],
        },
      },
    },
    department: { columns: { name: citextName } },
    sector: { columns: { name: citextName } },
    industry: { columns: { name: citextName } },
    key_business: { columns: { name: citextName } },
    work_category: { columns: { name: citextName } },
    service: { columns: { name: citextName } },
    business_model: { columns: { name: citextName } },
    file: {
      columns: {
        visibility: {
          tsType: `'public' | 'authenticated'`,
          decorators: [{ name: '@column' }],
        },
      },
    },
    case_study: {
      columns: {
        status: {
          tsType: `'draft' | 'published' | 'archived'`,
          decorators: [{ name: '@column' }],
        },
      },
    },
  },
} satisfies SchemaRules
