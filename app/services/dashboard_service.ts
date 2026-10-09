import db from '@adonisjs/lucid/services/db'
import env from '#start/env'
import StorageService from '#services/storage_service'

export type Range = '7d' | '30d' | '90d'

export const RANGES: readonly Range[] = ['7d', '30d', '90d']

const RANGE_DAYS: Record<Range, number> = { '7d': 7, '30d': 30, '90d': 90 }

export type DashboardStats = {
  published: number
  publishedDelta: number
  drafts: number
  staleDrafts: number
  activeShares: number
  sharesTrend: number[]
  views30d: number
  viewsDelta: number
}

export type ShareHealth = { active: number; expiring: number; expired: number; limit: number }

export type AttentionItem = {
  id: string
  kind: 'draft' | 'share'
  status: 'draft' | 'expiring' | 'expired' | 'limit'
  title: string
  meta: string
  href: string
  due: 'today' | 'week' | 'later'
}

export type Views = { range: Range; points: { date: string; value: number }[] }

export type Latest = {
  folio: number
  title: string
  client: string
  href: string
  thumbnail?: string
} | null

/** Drafts untouched for this long count as stale. */
const STALE_DRAFT_DAYS = 14
/** A share expiring within this window is "expiring". */
const EXPIRING_DAYS = 7

/**
 * Share state, derived because the `share` table has no status column. Revoked
 * shares are soft-deleted and filtered out before this runs. Precedence matters:
 * a share past its date is "expired" even if it also hit its view cap.
 */
export const SHARE_STATE_SQL = `
  CASE
    WHEN s.expires_at IS NOT NULL AND s.expires_at <= now() THEN 'expired'
    WHEN s.max_views IS NOT NULL AND s.view_count >= s.max_views THEN 'limit'
    WHEN s.expires_at IS NOT NULL AND s.expires_at <= now() + interval '${EXPIRING_DAYS} days' THEN 'expiring'
    ELSE 'active'
  END
`

/** Read-only queries behind the dashboard. Everything excludes soft-deleted rows. */
export default class DashboardService {
  async stats(): Promise<DashboardStats> {
    const [counts, trend, views] = await Promise.all([
      db.rawQuery(
        `SELECT
           count(*) FILTER (WHERE status = 'published')::int AS published,
           count(*) FILTER (WHERE status = 'published'
             AND created_at >= date_trunc('month', now()))::int AS published_delta,
           count(*) FILTER (WHERE status = 'draft')::int AS drafts,
           count(*) FILTER (WHERE status = 'draft'
             AND updated_at < now() - interval '${STALE_DRAFT_DAYS} days')::int AS stale_drafts
         FROM case_study WHERE deleted_at IS NULL`
      ),
      // Shares that were live (created, not yet expired or revoked) at each of the last 9 weekly marks.
      db.rawQuery(
        `SELECT count(s.id)::int AS n
         FROM generate_series(8, 0, -1) AS w(i)
         LEFT JOIN share s
           ON s.created_at <= now() - (w.i * interval '1 week')
          AND (s.expires_at IS NULL OR s.expires_at > now() - (w.i * interval '1 week'))
          AND (s.deleted_at IS NULL OR s.deleted_at > now() - (w.i * interval '1 week'))
         GROUP BY w.i ORDER BY w.i DESC`
      ),
      db.rawQuery(
        `SELECT
           count(*) FILTER (WHERE v.viewed_at >= now() - interval '30 days')::int AS current,
           count(*) FILTER (WHERE v.viewed_at < now() - interval '30 days')::int AS prior
         FROM share_view v
         JOIN share s ON s.id = v.share_id AND s.deleted_at IS NULL
         WHERE v.viewed_at >= now() - interval '60 days'`
      ),
    ])

    const c = counts.rows[0]
    const v = views.rows[0]
    const sharesTrend = trend.rows.map((r: { n: number }) => r.n)

    return {
      published: c.published,
      publishedDelta: c.published_delta,
      drafts: c.drafts,
      staleDrafts: c.stale_drafts,
      activeShares: sharesTrend.at(-1) ?? 0,
      sharesTrend,
      views30d: v.current,
      // Prior window empty → no meaningful percentage.
      viewsDelta: v.prior > 0 ? Math.round(((v.current - v.prior) / v.prior) * 100) : 0,
    }
  }

  async shareHealth(): Promise<ShareHealth> {
    const { rows } = await db.rawQuery(
      `SELECT state, count(*)::int AS n
       FROM (SELECT ${SHARE_STATE_SQL} AS state FROM share s WHERE s.deleted_at IS NULL) t
       GROUP BY state`
    )
    const by = Object.fromEntries(rows.map((r: { state: string; n: number }) => [r.state, r.n]))
    return {
      active: by.active ?? 0,
      expiring: by.expiring ?? 0,
      expired: by.expired ?? 0,
      limit: by.limit ?? 0,
    }
  }

  /**
   * Stale drafts and shares that need action, soonest first.
   * Shares that are merely "active" are excluded; expired ones are only shown for 14 days.
   */
  async attention(): Promise<AttentionItem[]> {
    const [drafts, shares] = await Promise.all([
      db.rawQuery(
        `SELECT id, title, seq FROM (
           SELECT id, title, status, deleted_at, updated_at,
                  row_number() OVER (ORDER BY created_at, id)::int AS seq
           FROM case_study
         ) c
         WHERE status = 'draft' AND deleted_at IS NULL
           AND updated_at < now() - interval '${STALE_DRAFT_DAYS} days'
         ORDER BY updated_at LIMIT 10`
      ),
      db.rawQuery(
        `SELECT id, name, state, expires_at, view_count, max_views FROM (
           SELECT s.id, s.name, s.expires_at, s.view_count, s.max_views, ${SHARE_STATE_SQL} AS state
           FROM share s WHERE s.deleted_at IS NULL
         ) t
         WHERE state <> 'active'
           AND (state <> 'expired' OR expires_at > now() - interval '14 days')
         ORDER BY expires_at NULLS LAST LIMIT 20`
      ),
    ])

    const items: AttentionItem[] = []

    for (const d of drafts.rows) {
      items.push({
        id: `draft-${d.id}`,
        kind: 'draft',
        status: 'draft',
        title: d.title,
        meta: folio(d.seq),
        href: '/case-studies?status=draft',
        due: 'later',
      })
    }

    const now = Date.now()
    for (const s of shares.rows) {
      const expires: Date | null = s.expires_at ? new Date(s.expires_at) : null
      const days = expires ? (expires.getTime() - now) / 86_400_000 : null
      items.push({
        id: `share-${s.id}`,
        kind: 'share',
        status: s.state,
        title: s.name,
        meta:
          s.state === 'limit'
            ? `${s.view_count}/${s.max_views} views`
            : s.state === 'expired'
              ? `Expired ${shortDate(expires!)}`
              : days !== null && days < 1
                ? 'Expires today'
                : `Expires ${shortDate(expires!)}`,
        href: '/shares',
        // Dead links (expired, limit hit) need action now; expiring ones by how soon.
        due:
          s.state === 'expired' || s.state === 'limit' || (days !== null && days < 1)
            ? 'today'
            : days !== null && days <= EXPIRING_DAYS
              ? 'week'
              : 'later',
      })
    }

    const order = { today: 0, week: 1, later: 2 }
    return items.sort((a, b) => order[a.due] - order[b.due])
  }

  /** Daily view counts, zero-filled so the chart has no gaps. */
  async views(range: Range): Promise<Views> {
    const days = RANGE_DAYS[range]
    const { rows } = await db.rawQuery(
      `SELECT to_char(d.day, 'YYYY-MM-DD') AS date, count(v.id)::int AS value
       FROM generate_series(
              (now() AT TIME ZONE 'UTC')::date - (?::int - 1),
              (now() AT TIME ZONE 'UTC')::date,
              interval '1 day') AS d(day)
       LEFT JOIN (
         SELECT sv.id, (sv.viewed_at AT TIME ZONE 'UTC')::date AS day
         FROM share_view sv JOIN share s ON s.id = sv.share_id AND s.deleted_at IS NULL
       ) v ON v.day = d.day::date
       GROUP BY d.day ORDER BY d.day`,
      [days]
    )
    return { range, points: rows }
  }

  async latest(): Promise<Latest> {
    const { rows } = await db.rawQuery(
      `SELECT c.id, c.title, c.seq, c.hero_file_id, cl.name AS client, f.bucket, f.storage_path, f.visibility
       FROM (
         SELECT id, title, status, deleted_at, client_id, hero_file_id, updated_at,
                row_number() OVER (ORDER BY created_at, id)::int AS seq
         FROM case_study
       ) c
       JOIN client cl ON cl.id = c.client_id
       LEFT JOIN file f ON f.id = c.hero_file_id
       WHERE c.status = 'published' AND c.deleted_at IS NULL
       ORDER BY c.updated_at DESC LIMIT 1`
    )
    const r = rows[0]
    if (!r) return null
    return {
      folio: r.seq,
      title: r.title,
      client: r.client,
      href: `/case-studies/${r.id}`,
      // Private heroes go through the authenticated file proxy.
      thumbnail: publicThumbnail(r) ?? (r.hero_file_id ? `/files/${r.hero_file_id}` : undefined),
    }
  }
}

/**
 * Only public-bucket heroes can be linked directly; 'authenticated' files need the
 * file proxy route, which does not exist yet, so those fall back to the placeholder.
 */
export function publicThumbnail(f: {
  bucket: string | null
  storage_path: string | null
  visibility: string | null
}) {
  if (!f.bucket || !f.storage_path || f.visibility !== 'public' || !env.get('SUPABASE_URL')) {
    return undefined
  }
  try {
    return new StorageService().publicUrl(f.bucket, f.storage_path)
  } catch {
    return undefined
  }
}

/** Folio Nº: a case study's position in creation order, soft-deleted rows included so it never shifts. */
export function folio(n: number) {
  return `Nº ${String(n).padStart(4, '0')}`
}

function shortDate(d: Date) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}
