import { randomInt } from 'node:crypto'
import db from '@adonisjs/lucid/services/db'
import { UUID } from '#services/file_urls'
import { publicThumbnail } from '#services/dashboard_service'
import type { RuleField } from '#validators/share'

export type Rule = { field: RuleField; ids: string[] }

export type StudySummary = {
  id: string
  title: string
  folio: number
  client: string
  thumbnail: string | null
}

export type MatchPreview = { count: number; items: StudySummary[] }

/** Junction table and id column behind each rule field. */
export const RULE_TABLES: Record<RuleField, { table: string; column: string }> = {
  sector: { table: 'share_sector', column: 'sector_id' },
  industry: { table: 'share_industry', column: 'industry_id' },
  keyBusiness: { table: 'share_key_business', column: 'key_business_id' },
  workCategory: { table: 'share_work_category', column: 'work_category_id' },
  service: { table: 'share_service', column: 'service_id' },
  client: { table: 'share_client', column: 'client_id' },
}

/** Source table for each rule field, used to confirm ids still exist. */
export const RULE_SOURCES: Record<RuleField, string> = {
  sector: 'sector',
  industry: 'industry',
  keyBusiness: 'key_business',
  workCategory: 'work_category',
  service: 'service',
  client: 'client',
}

/** Unambiguous uppercase alphabet (no 0/O, 1/I/L) so a link can be read aloud. */
const TOKEN_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
const TOKEN_LENGTH = 16

export function generateToken() {
  let out = ''
  for (let i = 0; i < TOKEN_LENGTH; i++) out += TOKEN_ALPHABET[randomInt(TOKEN_ALPHABET.length)]
  return out
}

/** Parses the `rules` query param of a match-preview request, dropping anything malformed. */
export function parseRules(raw: unknown): Rule[] {
  if (typeof raw !== 'string' || raw.length > 20_000) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const seen = new Set<string>()
    const rules: Rule[] = []
    for (const r of parsed) {
      if (!r || !(r.field in RULE_TABLES) || seen.has(r.field) || !Array.isArray(r.ids)) continue
      const ids = [
        ...new Set<string>(r.ids.filter((id: unknown) => typeof id === 'string' && UUID.test(id))),
      ].slice(0, 100)
      if (!ids.length) continue
      seen.add(r.field)
      rules.push({ field: r.field, ids })
    }
    return rules
  } catch {
    return []
  }
}

/** Published, live case studies matching every rule (any value within a rule, all rules together). */
function matchingQuery(rules: Rule[]) {
  const q = db.from('case_study as cs').whereNull('cs.deleted_at').where('cs.status', 'published')
  for (const { field, ids } of rules) {
    switch (field) {
      case 'client':
        q.whereIn('cs.client_id', ids)
        break
      case 'workCategory':
        q.whereIn(
          'cs.id',
          db
            .from('case_study_work_category')
            .select('case_study_id')
            .whereIn('work_category_id', ids)
        )
        break
      case 'service':
        q.whereIn(
          'cs.id',
          db.from('case_study_service').select('case_study_id').whereIn('service_id', ids)
        )
        break
      case 'keyBusiness':
        q.whereIn(
          'cs.id',
          db.from('case_study_key_business').select('case_study_id').whereIn('key_business_id', ids)
        )
        break
      case 'industry':
        q.whereIn(
          'cs.id',
          db
            .from('case_study_key_business as x')
            .join('key_business as kb', 'kb.id', 'x.key_business_id')
            .select('x.case_study_id')
            .whereIn('kb.industry_id', ids)
        )
        break
      case 'sector':
        q.whereIn(
          'cs.id',
          db
            .from('case_study_key_business as x')
            .join('key_business as kb', 'kb.id', 'x.key_business_id')
            .join('industry as i', 'i.id', 'kb.industry_id')
            .select('x.case_study_id')
            .whereIn('i.sector_id', ids)
        )
        break
    }
  }
  return q
}

/** Adds the columns a study summary needs. Folio is the study's position in creation order. */
function summarise<T extends ReturnType<typeof db.from>>(q: T) {
  return q
    .join('client as cl', 'cl.id', 'cs.client_id')
    .leftJoin('file as f', 'f.id', 'cs.hero_file_id')
    .select(
      'cs.id',
      'cs.title',
      'cs.hero_file_id',
      'cl.name as client',
      'f.bucket',
      'f.storage_path',
      'f.visibility',
      db.raw(
        `(SELECT count(*)::int FROM case_study c2
           WHERE (c2.created_at, c2.id) <= (cs.created_at, cs.id)) AS seq`
      )
    )
}

type SummaryRow = {
  id: string
  title: string
  hero_file_id: string | null
  client: string
  bucket: string | null
  storage_path: string | null
  visibility: string | null
  seq: number
}

function toSummary(r: SummaryRow): StudySummary {
  return {
    id: r.id,
    title: r.title,
    folio: r.seq,
    client: r.client,
    thumbnail: publicThumbnail(r) ?? (r.hero_file_id ? `/files/${r.hero_file_id}` : null),
  }
}

export default class ShareService {
  /** Every published study, for the builder's picker. The catalogue is small and bounded. */
  async publishedStudies(): Promise<StudySummary[]> {
    const rows: SummaryRow[] = await summarise(
      db.from('case_study as cs').whereNull('cs.deleted_at').where('cs.status', 'published')
    ).orderBy('cs.title')
    return rows.map(toSummary)
  }

  async matchCount(rules: Rule[]): Promise<number> {
    if (!rules.length) return 0
    const [row] = await matchingQuery(rules).count('* as n')
    return Number(row.n)
  }

  /** How many studies a rule set admits right now, plus the first few for the preview list. */
  async matchPreview(rules: Rule[]): Promise<MatchPreview> {
    if (!rules.length) return { count: 0, items: [] }
    const [count, rows] = await Promise.all([
      this.matchCount(rules),
      summarise(matchingQuery(rules)).orderBy('cs.title').limit(8) as Promise<SummaryRow[]>,
    ])
    return { count, items: rows.map(toSummary) }
  }

  /** Published ids among `ids`; used to reject a pick that includes a draft or deleted study. */
  async publishedCount(ids: string[]): Promise<number> {
    if (!ids.length) return 0
    const [row] = await db
      .from('case_study')
      .whereIn('id', ids)
      .whereNull('deleted_at')
      .where('status', 'published')
      .count('* as n')
    return Number(row.n)
  }

  /** Counts of existing rows for a rule field, to catch stale ids before the FK does. */
  async existingCount(field: RuleField, ids: string[]): Promise<number> {
    const q = db.from(RULE_SOURCES[field]).whereIn('id', ids)
    if (field === 'client') q.whereNull('deleted_at')
    const [row] = await q.count('* as n')
    return Number(row.n)
  }

  /** Summaries for specific studies, in the order given (the share's pinned list). */
  async studiesByIds(ids: string[]): Promise<StudySummary[]> {
    if (!ids.length) return []
    const rows: SummaryRow[] = await summarise(
      db.from('case_study as cs').whereNull('cs.deleted_at').whereIn('cs.id', ids)
    ).orderBy('cs.title')
    return rows.map(toSummary)
  }

  /** Names behind each rule value, for the read-only rule summary chips. */
  async ruleNames(rules: Rule[]) {
    return Promise.all(
      rules.map(async ({ field, ids }) => {
        const rows: { name: string }[] = await db
          .from(RULE_SOURCES[field])
          .whereIn('id', ids)
          .select('name')
          .orderBy('name')
        return { field, names: rows.map((r) => r.name) }
      })
    )
  }

  /** Daily visit counts for the last `days` days, zero-filled so the chart has no gaps. */
  async series(shareId: string, days: number) {
    const { rows } = await db.rawQuery(
      `SELECT to_char(d.day, 'YYYY-MM-DD') AS date, count(v.id)::int AS value
       FROM generate_series(
              (now() AT TIME ZONE 'UTC')::date - (?::int - 1),
              (now() AT TIME ZONE 'UTC')::date,
              interval '1 day') AS d(day)
       LEFT JOIN share_view v ON v.share_id = ?
         AND (v.viewed_at AT TIME ZONE 'UTC')::date = d.day::date
       GROUP BY d.day ORDER BY d.day`,
      [days, shareId]
    )
    return rows as { date: string; value: number }[]
  }
  /** The stored live-rule conditions of a share (empty for a pinned share). */
  async rulesFor(shareId: string): Promise<Rule[]> {
    const rules: Rule[] = []
    for (const [field, { table, column }] of Object.entries(RULE_TABLES) as [
      RuleField,
      { table: string; column: string },
    ][]) {
      const rows: Record<string, string>[] = await db.from(table).where('share_id', shareId)
      if (rows.length) rules.push({ field, ids: rows.map((r) => r[column]) })
    }
    return rules
  }

  /** Ids of the published, live studies a share admits right now, in catalogue (folio) order. */
  async studyIdsFor(shareId: string): Promise<string[]> {
    const rules = await this.rulesFor(shareId)
    const q = rules.length
      ? matchingQuery(rules)
      : db
          .from('case_study as cs')
          .whereNull('cs.deleted_at')
          .where('cs.status', 'published')
          .whereIn(
            'cs.id',
            db.from('share_case_study').select('case_study_id').where('share_id', shareId)
          )
    const rows: { id: string }[] = await q
      .select('cs.id')
      .orderBy([{ column: 'cs.created_at' }, { column: 'cs.id' }])
    return rows.map((r) => r.id)
  }
}

export type Device = 'Desktop' | 'Mobile' | 'Tablet'

/** Coarse device and browser from a User-Agent string; good enough for an engagement view. */
export function parseAgent(ua: string | null): { device: Device; browser: string } {
  const s = ua ?? ''
  const device: Device = /iPad|Tablet|Android(?!.*Mobile)/i.test(s)
    ? 'Tablet'
    : /Mobi|iPhone|Android/i.test(s)
      ? 'Mobile'
      : 'Desktop'
  const browser = /Edg\//.test(s)
    ? 'Edge'
    : /OPR\/|Opera/.test(s)
      ? 'Opera'
      : /Firefox\//.test(s)
        ? 'Firefox'
        : /Chrome\/|CriOS/.test(s)
          ? 'Chrome'
          : /Safari\//.test(s)
            ? 'Safari'
            : 'Other'
  return { device, browser }
}
