import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import CaseStudy from '#models/case_study'
import ShareLink from '#models/share_link'
import Sector from '#models/sector'
import { enrichCaseStudies, relativeFromISO, shareStatus } from '#services/portfolio_queries'

const RANGES = ['7', '30', '90'] as const
type Range = (typeof RANGES)[number]

export type DashboardShareStatus = 'active' | 'expiring' | 'expired' | 'limit'

/**
 * Portfolio-health dashboard backed by live Supabase tables.
 */
export default class DashboardController {
  async index({ inertia, request }: HttpContext) {
    const rawRange = String(request.input('range', '30') ?? '30')
    const range: Range = (RANGES as readonly string[]).includes(rawRange)
      ? (rawRange as Range)
      : '30'
    const sector = String(request.input('sector', 'all') ?? 'all')
    const days = Number(range)
    const since = DateTime.now().minus({ days })

    const [statusRows, shares, sectors] = await Promise.all([
      db.from('case_studies').select('status').count('* as count').groupBy('status'),
      ShareLink.query().orderBy('created_at', 'desc').limit(200),
      Sector.query().orderBy('name', 'asc'),
    ])
    const counts = new Map<string, number>(
      statusRows.map((r) => [String(r.status), Number(r.count)])
    )
    const published = counts.get('published') ?? 0
    const drafts = counts.get('draft') ?? 0

    const publishedSince = await db
      .from('case_studies')
      .where('status', 'published')
      .where('updated_at', '>=', since.toSQL())
      .count('* as count')
      .first()
    const publishedPrev = await db
      .from('case_studies')
      .where('status', 'published')
      .where('updated_at', '>=', since.minus({ days }).toSQL())
      .where('updated_at', '<', since.toSQL())
      .count('* as count')
      .first()
    const publishedDelta = Number(publishedSince?.count ?? 0) - Number(publishedPrev?.count ?? 0)

    const shareStates = shares.map((s) => ({
      share: s,
      status: shareStatus(s.expiresAt, s.maxViews, s.viewCount),
    }))
    const activeShares = shareStates.filter(
      (s) => s.status === 'active' || s.status === 'expiring'
    ).length
    const expiringSoon = shareStates.filter((s) => s.status === 'expiring').length

    const viewAgg = await db
      .from('share_views')
      .where('viewed_at', '>=', since.toSQL())
      .count('* as count')
      .first()
    const views = Number(viewAgg?.count ?? 0)

    // Views-over-time series (bucketed per day).
    const labels: string[] = []
    const values: number[] = []
    for (let i = days - 1; i >= 0; i--) {
      const day = DateTime.now().minus({ days: i })
      labels.push(day.toFormat('MMM d'))
      values.push(0)
    }
    const daily = await db
      .from('share_views')
      .where('viewed_at', '>=', since.startOf('day').toSQL())
      .select(db.raw(`date_trunc('day', viewed_at) as day`))
      .count('* as count')
      .groupByRaw(`date_trunc('day', viewed_at)`)
    daily.forEach((row) => {
      const d = DateTime.fromISO(new Date(row.day).toISOString()).toFormat('MMM d')
      const idx = labels.indexOf(d)
      if (idx >= 0) values[idx] = Number(row.count)
    })
    const total = values.reduce((a, b) => a + b, 0)

    const topShares = shareStates.slice(0, 5).map(({ share: s, status }) => ({
      id: s.id,
      recipient: s.recipientName ?? s.name,
      company: s.recipientEmail ?? '',
      tokenSuffix: s.token.slice(-6),
      views: s.viewCount,
      status: status as DashboardShareStatus,
    }))

    // Published-by-sector via key-business chain.
    let bySector: Array<{ name: string; count: number }> = []
    try {
      const rows = await db
        .from('case_studies')
        .join(
          'case_study_key_businesses',
          'case_study_key_businesses.case_study_id',
          'case_studies.id'
        )
        .join('key_businesses', 'key_businesses.id', 'case_study_key_businesses.key_business_id')
        .join('industries', 'industries.id', 'key_businesses.industry_id')
        .join('sectors', 'sectors.id', 'industries.sector_id')
        .where('case_studies.status', 'published')
        .groupBy('sectors.name')
        .select('sectors.name as name')
        .count('* as count')
        .orderByRaw('count(*) desc')
      bySector = rows.map((r) => ({ name: r.name, count: Number(r.count) }))
    } catch {
      bySector = []
    }

    let recentQuery = CaseStudy.query().orderBy('updated_at', 'desc').limit(5)
    if (sector !== 'all') {
      const sectorRow = sectors.find((s) => s.name === sector)
      if (sectorRow) {
        const ids = await db
          .from('case_study_key_businesses')
          .join('key_businesses', 'key_businesses.id', 'case_study_key_businesses.key_business_id')
          .join('industries', 'industries.id', 'key_businesses.industry_id')
          .where('industries.sector_id', sectorRow.id)
          .select('case_study_key_businesses.case_study_id as id')
        const idList = [...new Set(ids.map((r) => String(r.id)))]
        recentQuery = recentQuery.whereIn('id', idList.length > 0 ? idList : ['__none__'])
      }
    }
    const recentRows = await recentQuery
    const enriched = await enrichCaseStudies(recentRows)

    return inertia.render('dashboard', {
      filters: { range, sector },
      sectors: ['All sectors', ...sectors.map((s) => s.name)],
      stats: { published, publishedDelta, drafts, activeShares, expiringSoon, views },
      viewsSeries: { labels, values, total },
      topShares,
      bySector,
      recent: enriched.map((r) => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        status: r.status,
        ownerName: r.ownerName,
        ownerInitials: r.ownerInitials,
        updatedAt: r.updatedAt,
        updatedRelative: relativeFromISO(r.updatedAt),
      })),
    })
  }
}
