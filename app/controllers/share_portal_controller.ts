import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'
import { randomUUID } from 'node:crypto'
import ShareLink from '#models/share_link'
import CaseStudy from '#models/case_study'
import CaseStudyMetric from '#models/case_study_metric'
import Client from '#models/client'
import { shareUnlockValidator } from '#validators/share'
import { enrichCaseStudies, shareStatus } from '#services/portfolio_queries'

export type PortalState = 'gate' | 'viewer' | 'expired' | 'limit' | 'unavailable' | 'locked'

const COOKIE = 'share_unlock_'

async function portalItems(link: ShareLink) {
  let ids = link.specificCaseStudyIds ?? []
  if (ids.length === 0) {
    // Filter-rule mode: resolve matching published studies (best-effort).
    let query = CaseStudy.query().where('status', 'published')
    if (link.filterCategoryIds?.length) {
      const links = await db
        .from('case_study_categories')
        .whereIn('category_id', link.filterCategoryIds)
        .select('case_study_id as id')
      query = query.whereIn('id', [...new Set(links.map((r) => String(r.id))), '__none__'])
    }
    if (link.filterServiceIds?.length) {
      const links = await db
        .from('case_study_services')
        .whereIn('service_id', link.filterServiceIds)
        .select('case_study_id as id')
      query = query.whereIn('id', [...new Set(links.map((r) => String(r.id))), '__none__'])
    }
    if (link.filterClientIds?.length) query = query.whereIn('client_id', link.filterClientIds)
    const rows = await query.limit(24)
    ids = rows.map((r) => r.id)
  }
  if (ids.length === 0) return { items: [], sectors: [] as string[] }
  const rows = await CaseStudy.query().whereIn('id', ids).where('status', 'published')
  const enriched = await enrichCaseStudies(rows)
  const items = await Promise.all(
    rows.map(async (r) => {
      const e = enriched.find((x) => x.id === r.id)!
      const metrics = await CaseStudyMetric.query()
        .where('case_study_id', r.id)
        .orderBy('sort_order', 'asc')
      return {
        id: r.id,
        slug: r.slug,
        title: r.title,
        summary: r.description ?? '',
        heroImage: r.heroImageUrl,
        clientName: e.clientName,
        sector: e.sector,
        industry: e.industry,
        keyBusiness: e.keyBusiness,
        services: e.services,
        storyMarkdown: [r.challenge, r.solution, r.results].filter(Boolean).join('\n\n'),
        metrics: metrics.map((m) => ({ label: m.label, value: m.value, suffix: m.unit ?? '' })),
        videos: r.videoEmbedUrl ? [{ url: r.videoEmbedUrl, provider: 'other' }] : [],
        gallery: (r.galleryUrls ?? []).map((url) => ({ url, caption: '' })),
        testimonial: {
          quote: r.testimonialQuote ?? '',
          name: r.testimonialAuthor ?? '',
          role: r.testimonialTitle ?? '',
        },
        attachments: [] as Array<{ name: string; size: string; url: string }>,
      }
    })
  )
  return { items, sectors: [...new Set(enriched.map((e) => e.sector).filter(Boolean))] }
}

export default class SharePortalController {
  async show({ inertia, params, request }: HttpContext) {
    const token = String(params.token ?? '')
    const link = await ShareLink.findBy('token', token)
    if (!link || link.revoked) {
      return inertia.render('share_portal', {
        state: 'unavailable' as PortalState,
        token,
        gate: null,
        portal: null,
      })
    }
    const status = shareStatus(link.expiresAt, link.maxViews, link.viewCount)
    if (status === 'expired') {
      return inertia.render('share_portal', {
        state: 'expired' as PortalState,
        token,
        gate: null,
        portal: null,
      })
    }
    if (status === 'limit') {
      return inertia.render('share_portal', {
        state: 'limit' as PortalState,
        token,
        gate: null,
        portal: null,
      })
    }

    const unlocked = request.plainCookie(COOKIE + link.id) === '1'
    if (link.passwordHash && !unlocked) {
      return inertia.render('share_portal', {
        state: 'gate' as PortalState,
        token,
        gate: {
          recipient: link.recipientName ?? link.name,
          attemptsRemaining: 5,
          lockedUntil: null,
          lockCountdown: null,
        },
        portal: null,
      })
    }

    const { items, sectors } = await portalItems(link)
    return inertia.render('share_portal', {
      state: 'viewer' as PortalState,
      token,
      gate: null,
      portal: {
        recipient: link.recipientName ?? link.name,
        company: link.recipientEmail ?? null,
        intro: null,
        count: items.length,
        sectors,
        items,
      },
    })
  }

  async unlock({ request, response, session, params }: HttpContext) {
    const token = String(params.token ?? '')
    const { password } = await request.validateUsing(shareUnlockValidator)
    const link = await ShareLink.findBy('token', token)
    if (!link || link.revoked || !link.passwordHash) {
      session.flash('error', 'That password isn’t right. Try again.')
      return response.redirect().back()
    }
    const ok = await hash.verify(link.passwordHash, password)
    if (!ok) {
      session.flash('error', 'That password isn’t right. Try again.')
      return response.redirect().back()
    }
    response.plainCookie(COOKIE + link.id, '1', {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    await db.table('share_views').insert({
      id: randomUUID(),
      share_link_id: link.id,
      ip: request.ip() ?? null,
      user_agent: request.header('user-agent') ?? null,
    })
    await link.merge({ viewCount: link.viewCount + 1 }).save()
    void Client
    return response.redirect().toPath(`/s/${token}`)
  }
}
