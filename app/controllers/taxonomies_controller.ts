import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { errors } from '@vinejs/vine'
import { taxonomyValidator } from '#validators/taxonomy'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** URL segment -> table, parent column and label used in flash messages. */
const KINDS = {
  'sector': { table: 'sector', parent: null, label: 'Sector' },
  'industry': { table: 'industry', parent: 'sector_id', label: 'Industry' },
  'key-business': { table: 'key_business', parent: 'industry_id', label: 'Key business' },
  'work-category': { table: 'work_category', parent: null, label: 'Work category' },
  'service': { table: 'service', parent: null, label: 'Service' },
  'business-model': { table: 'business_model', parent: null, label: 'Business model' },
} as const

type Kind = keyof typeof KINDS

const isKind = (k: string): k is Kind => Object.hasOwn(KINDS, k)

type Counts = Map<string, number>

/** Live case studies referencing each row of a taxonomy table. */
async function caseStudyCounts(table: string) {
  const via = {
    sector: `SELECT i.sector_id AS id, count(DISTINCT cs.id)::int AS n
             FROM case_study cs
             JOIN case_study_key_business ck ON ck.case_study_id = cs.id
             JOIN key_business kb ON kb.id = ck.key_business_id
             JOIN industry i ON i.id = kb.industry_id
             WHERE cs.deleted_at IS NULL GROUP BY 1`,
    industry: `SELECT kb.industry_id AS id, count(DISTINCT cs.id)::int AS n
               FROM case_study cs
               JOIN case_study_key_business ck ON ck.case_study_id = cs.id
               JOIN key_business kb ON kb.id = ck.key_business_id
               WHERE cs.deleted_at IS NULL GROUP BY 1`,
    key_business: `SELECT ck.key_business_id AS id, count(DISTINCT cs.id)::int AS n
                   FROM case_study cs
                   JOIN case_study_key_business ck ON ck.case_study_id = cs.id
                   WHERE cs.deleted_at IS NULL GROUP BY 1`,
  } as Record<string, string>

  const sql =
    via[table] ??
    `SELECT x.${table}_id AS id, count(DISTINCT cs.id)::int AS n
     FROM case_study cs
     JOIN case_study_${table} x ON x.case_study_id = cs.id
     WHERE cs.deleted_at IS NULL GROUP BY 1`
  return toMap((await db.rawQuery(sql)).rows)
}

/** Live shares whose targeting rules include each row. Business models are not a rule. */
async function shareCounts(table: string) {
  if (table === 'business_model') return new Map<string, number>()
  const { rows } = await db.rawQuery(
    `SELECT x.${table}_id AS id, count(DISTINCT s.id)::int AS n
     FROM share_${table} x
     JOIN share s ON s.id = x.share_id AND s.deleted_at IS NULL
     GROUP BY 1`
  )
  return toMap(rows)
}

async function clientCounts() {
  const { rows } = await db.rawQuery(
    `SELECT ck.key_business_id AS id, count(DISTINCT c.id)::int AS n
     FROM client_key_business ck
     JOIN client c ON c.id = ck.client_id
     GROUP BY 1`
  )
  return toMap(rows)
}

const toMap = (rows: { id: string; n: number }[]): Counts => new Map(rows.map((r) => [r.id, r.n]))

async function list(table: string, parent?: string) {
  const [rows, cs, sh] = await Promise.all([
    db
      .from(table)
      .select('id', 'name', ...(parent ? [parent] : []))
      .orderBy('name'),
    caseStudyCounts(table),
    shareCounts(table),
  ])
  return rows.map((r: Record<string, string>) => ({
    id: r.id,
    name: r.name,
    parentId: parent ? r[parent] : null,
    caseStudies: cs.get(r.id) ?? 0,
    shares: sh.get(r.id) ?? 0,
  }))
}

const duplicate = () =>
  new errors.E_VALIDATION_ERROR([
    { field: 'name', message: 'That name already exists here.', rule: 'unique' },
  ])

const pgCode = (e: unknown) => (e as { code?: string }).code

export default class TaxonomiesController {
  /**
   * Whole vocabulary in one payload: the sector tree plus the three flat lists.
   * It is small and bounded, and the tabs switch client-side without a request.
   */
  async index({ inertia }: HttpContext) {
    return inertia.render('taxonomies/index', {
      sectors: async () => {
        const [sectors, industries, keyBusinesses, clients] = await Promise.all([
          list('sector'),
          list('industry', 'sector_id'),
          list('key_business', 'industry_id'),
          clientCounts(),
        ])
        const kbByIndustry = Map.groupBy(keyBusinesses, (k) => k.parentId!)
        const indBySector = Map.groupBy(industries, (i) => i.parentId!)
        return sectors.map(({ parentId: _s, ...s }) => ({
          ...s,
          industries: (indBySector.get(s.id) ?? []).map(({ parentId: _i, ...i }) => ({
            ...i,
            keyBusinesses: (kbByIndustry.get(i.id) ?? []).map(({ parentId: _k, ...k }) => ({
              ...k,
              clients: clients.get(k.id) ?? 0,
            })),
          })),
        }))
      },
      workCategories: () => list('work_category'),
      services: () => list('service'),
      businessModels: () => list('business_model'),
    })
  }

  async store({ params, request, response, session }: HttpContext) {
    if (!isKind(params.kind)) return response.notFound()
    const kind = KINDS[params.kind]
    const { name, parentId } = await request.validateUsing(taxonomyValidator)

    const row: Record<string, string> = { name }
    if (kind.parent) {
      if (!parentId) return response.unprocessableEntity({ errors: [{ field: 'parentId' }] })
      row[kind.parent] = parentId
    }

    try {
      await db.table(kind.table).insert(row)
    } catch (e) {
      if (pgCode(e) === '23505') throw duplicate()
      if (pgCode(e) === '23503') return response.notFound()
      throw e
    }
    session.flash('success', `${kind.label} “${name}” added.`)
    return response.redirect().back()
  }

  async update({ params, request, response, session }: HttpContext) {
    if (!isKind(params.kind) || !UUID.test(params.id)) return response.notFound()
    const kind = KINDS[params.kind]
    const { name } = await request.validateUsing(taxonomyValidator)

    let updated: unknown[]
    try {
      updated = await db.from(kind.table).where('id', params.id).update({ name }).returning('id')
    } catch (e) {
      if (pgCode(e) === '23505') throw duplicate()
      throw e
    }
    if (!updated.length) return response.notFound()
    session.flash('success', `${kind.label} renamed to “${name}”.`)
    return response.redirect().back()
  }

  /**
   * Every junction references the taxonomy row with ON DELETE RESTRICT, so a row that is
   * still tagged, targeted by a share rule, or has children cannot be removed. The dialog
   * already blocks live usage; this catches the remainder (e.g. soft-deleted studies).
   */
  async destroy({ params, response, session }: HttpContext) {
    if (!isKind(params.kind) || !UUID.test(params.id)) return response.notFound()
    const kind = KINDS[params.kind]

    let deleted: unknown[]
    try {
      deleted = await db.from(kind.table).where('id', params.id).delete().returning('id')
    } catch (e) {
      if (pgCode(e) === '23503') {
        session.flash(
          'error',
          `${kind.label} is still in use. Reassign or remove what references it first.`
        )
        return response.redirect().back()
      }
      throw e
    }
    if (!deleted.length) return response.notFound()
    session.flash('success', `${kind.label} deleted.`)
    return response.redirect().back()
  }
}
