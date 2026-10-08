import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { randomUUID } from 'node:crypto'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'
import ShareLink from '#models/share_link'
import CaseStudy from '#models/case_study'
import Sector from '#models/sector'
import Industry from '#models/industry'
import KeyBusiness from '#models/key_business'
import WorkCategory from '#models/work_category'
import ServiceItem from '#models/service_item'
import Client from '#models/client'
import DirectoryUser from '#models/directory_user'
import { shareValidator } from '#validators/share'
import { relativeFromISO, shareStatus } from '#services/portfolio_queries'

const ROLE_RANK = { employee: 0, admin: 1, superadmin: 2 } as const

function canUseRuleFilters(role: unknown): boolean {
  return (ROLE_RANK[role as keyof typeof ROLE_RANK] ?? 0) >= ROLE_RANK.admin
}

function roleOf(auth: HttpContext['auth']): unknown {
  return (auth.user as unknown as { role?: unknown } | null)?.role
}

export type StaffShareStatus = 'active' | 'expiring' | 'expired' | 'limit'

const STATUSES = ['all', 'active', 'expiring', 'expired', 'limit'] as const
type StatusFilter = (typeof STATUSES)[number]

async function pickerOptions() {
  const [sectors, industries, keyBusinesses, categories, services, clients, studies] =
    await Promise.all([
      Sector.query().orderBy('name', 'asc'),
      Industry.query().orderBy('name', 'asc'),
      KeyBusiness.query().orderBy('name', 'asc'),
      WorkCategory.query().orderBy('name', 'asc'),
      ServiceItem.query().orderBy('name', 'asc'),
      Client.query().orderBy('name', 'asc'),
      CaseStudy.query().where('status', 'published').orderBy('updated_at', 'desc').limit(50),
    ])
  const clientById = new Map(clients.map((c) => [c.id, c.name]))
  return {
    sectors: sectors.map((s) => s.name),
    industries: industries.map((i) => i.name),
    keyBusinesses: keyBusinesses.map((k) => k.name),
    categories: categories.map((c) => c.name),
    services: services.map((s) => s.name),
    clients: clients.map((c) => ({ id: c.id, name: c.name })),
    caseStudies: studies.map((s) => ({
      id: s.id,
      title: s.title,
      slug: s.slug,
      heroThumb: s.heroImageUrl,
      clientName: s.clientId ? (clientById.get(s.clientId) ?? '') : '',
      sector: '',
      status: s.status,
    })),
  }
}

function toRow(s: ShareLink, ownerName: string | null) {
  const status = shareStatus(s.expiresAt, s.maxViews, s.viewCount)
  const hasRule =
    (s.filterSectorIds?.length ?? 0) > 0 ||
    (s.filterIndustryIds?.length ?? 0) > 0 ||
    (s.filterKeyBusinessIds?.length ?? 0) > 0 ||
    (s.filterCategoryIds?.length ?? 0) > 0 ||
    (s.filterServiceIds?.length ?? 0) > 0 ||
    (s.filterClientIds?.length ?? 0) > 0
  return {
    id: s.id,
    recipient: s.recipientName ?? s.name,
    company: s.recipientEmail ?? '',
    token: s.token,
    tokenSuffix: s.token.slice(-6),
    content: hasRule
      ? { kind: 'rule' as const, label: 'Filter rule' }
      : { kind: 'selected' as const, label: `${s.specificCaseStudyIds?.length ?? 0} selected` },
    hasPassword: !!s.passwordHash,
    expiresAt: s.expiresAt ? s.expiresAt.toISO() : null,
    expiresRelative: s.expiresAt ? relativeFromISO(s.expiresAt.toISO()!) : null,
    views: s.viewCount,
    maxViews: s.maxViews,
    status: status as StaffShareStatus,
    createdAt: s.createdAt.toISO()!,
    createdRelative: relativeFromISO(s.createdAt.toISO()!),
    editable: true,
    ownerName,
  }
}

export default class SharesController {
  async index({ inertia, request }: HttpContext) {
    const rawStatus = String(request.input('status', 'all') ?? 'all')
    const status: StatusFilter = (STATUSES as readonly string[]).includes(rawStatus)
      ? (rawStatus as StatusFilter)
      : 'all'
    const page = Math.max(1, Number(request.input('page', 1) ?? 1) || 1)
    const rawPerPage = String(request.input('perPage', '25') ?? '25')
    const perPage = ['25', '50'].includes(rawPerPage) ? Number(rawPerPage) : 25
    const q = String(request.input('q', '') ?? '')
    const filters = { q, status, page, perPage }

    let query = ShareLink.query().orderBy('created_at', 'desc')
    if (q) {
      const like = `%${q}%`
      query = query.where((b) =>
        b.whereILike('name', like).orWhereILike('recipient_name', like).orWhereILike('token', like)
      )
    }
    const all = await query
    const ownerIds = [...new Set(all.map((s) => s.createdBy).filter(Boolean))] as string[]
    const owners = ownerIds.length > 0 ? await DirectoryUser.query().whereIn('id', ownerIds) : []
    const ownerById = new Map(owners.map((o) => [o.id, o.name]))

    let rows = all.map((s) => ({
      model: s,
      status: shareStatus(s.expiresAt, s.maxViews, s.viewCount),
    }))
    if (status !== 'all') rows = rows.filter((r) => r.status === status)

    const counts = {
      all: all.length,
      active: 0,
      expiring: 0,
      expired: 0,
      limit: 0,
    }
    all.forEach((s) => {
      counts[shareStatus(s.expiresAt, s.maxViews, s.viewCount)] += 1
    })

    const total = rows.length
    const slice = rows.slice((page - 1) * perPage, page * perPage)

    return inertia.render('shares', {
      filters,
      counts,
      rows: slice.map(({ model: s }) =>
        toRow(s, s.createdBy ? (ownerById.get(s.createdBy) ?? null) : null)
      ),
      meta: {
        total,
        from: total === 0 ? 0 : (page - 1) * perPage + 1,
        to: (page - 1) * perPage + slice.length,
        page,
        perPage,
      },
    })
  }

  async new({ auth, inertia, request }: HttpContext) {
    const preselect = String(request.input('caseStudy', '') ?? '')
    return inertia.render('share_builder', {
      mode: 'new',
      share: {
        id: null as string | null,
        mode: 'selected' as 'selected' | 'rule',
        selectedIds: preselect ? [preselect] : ([] as string[]),
        rule: {
          sectors: [] as string[],
          industries: [] as string[],
          keyBusinesses: [] as string[],
          categories: [] as string[],
          services: [] as string[],
          clients: [] as string[],
        },
        recipientName: '',
        company: '',
        email: '',
        requirePassword: false,
        passwordSet: false,
        expiresAt: null as string | null,
        maxViews: null as number | null,
        link: null as string | null,
        createdAt: null as string | null,
        views: 0,
        expired: false,
        expiredAt: null as string | null,
      },
      options: await pickerOptions(),
      matchPreview: { count: 0, thumbs: [] as Array<{ id: string; url: string | null }> },
      permissions: {
        editable: true,
        ownerName: null as string | null,
        canUseFilters: canUseRuleFilters(roleOf(auth)),
      },
    })
  }

  async store({ auth, request, response, session, inertia }: HttpContext) {
    const payload = await request.validateUsing(shareValidator)
    // Employees may only share specific case studies — taxonomy/client
    // filter rules are admin+.
    if (payload.mode === 'rule' && !canUseRuleFilters(roleOf(auth))) {
      response.status(403)
      return inertia.render('errors/forbidden', {
        message: 'Only admins can share with filters. Pick specific case studies instead.',
      })
    }
    const name = payload.recipientName || payload.company || 'Share'
    let passwordHash: string | null = null
    if (payload.requirePassword && payload.password)
      passwordHash = await hash.make(payload.password)
    let expiresAt: DateTime | null = null
    if (payload.expiresAt) {
      const parsed = DateTime.fromISO(payload.expiresAt)
      if (parsed.isValid) expiresAt = parsed
    }
    const row = await ShareLink.create({
      id: randomUUID(),
      token: randomUUID(),
      name,
      recipientName: payload.recipientName || null,
      recipientEmail: payload.email || null,
      passwordHash,
      expiresAt: expiresAt as any,
      maxViews: payload.maxViews ?? null,
      viewCount: 0,
      revoked: false,
      specificCaseStudyIds: payload.mode === 'selected' ? (payload.caseStudyIds ?? []) : [],
      filterSectorIds: [],
      filterIndustryIds: [],
      filterKeyBusinessIds: [],
      filterCategoryIds: [],
      filterServiceIds: [],
      filterClientIds: [],
      createdBy: (auth.user as unknown as { id?: string | number })?.id
        ? String((auth.user as unknown as { id: string | number }).id)
        : null,
    })
    // Persist rule ids best-effort (names → ids) when rule mode is used.
    if (payload.mode === 'rule' && payload.rule) {
      const lookup = async (table: string, names?: string[]) => {
        if (!names || names.length === 0) return []
        const rows = await db.from(table).whereIn('name', names).select('id')
        return rows.map((r) => String(r.id))
      }
      row.merge({
        filterSectorIds: await lookup('sectors', payload.rule.sectors),
        filterIndustryIds: await lookup('industries', payload.rule.industries),
        filterKeyBusinessIds: await lookup('key_businesses', payload.rule.keyBusinesses),
        filterCategoryIds: await lookup('work_categories', payload.rule.categories),
        filterServiceIds: await lookup('services', payload.rule.services),
        filterClientIds: await lookup('clients', payload.rule.clients),
      })
      await row.save()
    }
    session.flash('success', 'Share created')
    return response.redirect(`/shares/${row.id}/edit`)
  }

  async show({ inertia, params }: HttpContext) {
    const id = String(params.id ?? '')
    const s = (await ShareLink.find(id)) ?? (await ShareLink.findBy('token', id))
    if (!s) return inertia.render('errors/not_found', { message: 'Share not found' })
    const status = shareStatus(s.expiresAt, s.maxViews, s.viewCount)
    const visits = await db
      .from('share_views')
      .where('share_link_id', s.id)
      .orderBy('viewed_at', 'desc')
      .limit(20)
    const owner = s.createdBy ? await DirectoryUser.find(s.createdBy).catch(() => null) : null
    return inertia.render('share_detail', {
      share: {
        id: s.id,
        recipient: s.recipientName ?? s.name,
        company: s.recipientEmail ?? '',
        token: s.token,
        tokenSuffix: s.token.slice(-6),
        link: `/s/${s.token}`,
        status: status as StaffShareStatus,
        hasPassword: !!s.passwordHash,
        expiresAt: s.expiresAt ? s.expiresAt.toISO() : null,
        expiresRelative: s.expiresAt ? relativeFromISO(s.expiresAt.toISO()!) : null,
        maxViews: s.maxViews,
        createdAt: s.createdAt.toISO()!,
        createdRelative: relativeFromISO(s.createdAt.toISO()!),
        editable: true,
        ownerName: owner?.name ?? null,
      },
      kpis: {
        totalViews: s.viewCount,
        lastViewedAt: visits[0] ? new Date(visits[0].viewed_at).toISOString() : null,
        lastViewedRelative: visits[0]
          ? relativeFromISO(new Date(visits[0].viewed_at).toISOString())
          : 'Never',
        viewsRemaining:
          s.maxViews === null ? 'Unlimited' : String(Math.max(0, s.maxViews - s.viewCount)),
        expiresIn: s.expiresAt ? relativeFromISO(s.expiresAt.toISO()!) : 'No expiry',
      },
      viewsSeries: { labels: [] as string[], values: [] as number[], total: s.viewCount },
      visits: visits.map((v: any) => ({
        id: String(v.id),
        viewedAt: new Date(v.viewed_at).toISOString(),
        viewedRelative: relativeFromISO(new Date(v.viewed_at).toISOString()),
        maskedIp: v.ip ? `${String(v.ip).slice(0, 3)}•••` : '—',
        device: v.user_agent ?? 'Unknown',
      })),
    })
  }

  async edit({ auth, inertia, params }: HttpContext) {
    const id = String(params.id ?? '')
    const s = await ShareLink.find(id)
    if (!s) return inertia.render('errors/not_found', { message: 'Share not found' })
    const isRule =
      (s.filterSectorIds?.length ?? 0) > 0 ||
      (s.filterIndustryIds?.length ?? 0) > 0 ||
      (s.filterKeyBusinessIds?.length ?? 0) > 0 ||
      (s.filterCategoryIds?.length ?? 0) > 0 ||
      (s.filterServiceIds?.length ?? 0) > 0 ||
      (s.filterClientIds?.length ?? 0) > 0
    const nameOf = async (table: string, ids?: string[] | null) => {
      if (!ids || ids.length === 0) return []
      const rows = await db.from(table).whereIn('id', ids).select('name')
      return rows.map((r) => r.name)
    }
    return inertia.render('share_builder', {
      mode: 'edit',
      share: {
        id: s.id,
        mode: isRule ? ('rule' as const) : ('selected' as const),
        selectedIds: s.specificCaseStudyIds ?? [],
        rule: {
          sectors: await nameOf('sectors', s.filterSectorIds),
          industries: await nameOf('industries', s.filterIndustryIds),
          keyBusinesses: await nameOf('key_businesses', s.filterKeyBusinessIds),
          categories: await nameOf('work_categories', s.filterCategoryIds),
          services: await nameOf('services', s.filterServiceIds),
          clients: await nameOf('clients', s.filterClientIds),
        },
        recipientName: s.recipientName ?? s.name,
        company: '',
        email: s.recipientEmail ?? '',
        requirePassword: !!s.passwordHash,
        passwordSet: !!s.passwordHash,
        expiresAt: s.expiresAt ? s.expiresAt.toISO() : null,
        maxViews: s.maxViews,
        link: `/s/${s.token}`,
        createdAt: s.createdAt.toISO()!,
        views: s.viewCount,
        expired: shareStatus(s.expiresAt, s.maxViews, s.viewCount) === 'expired',
        expiredAt: s.expiresAt ? s.expiresAt.toISO() : null,
      },
      options: await pickerOptions(),
      matchPreview: { count: 0, thumbs: [] as Array<{ id: string; url: string | null }> },
      permissions: {
        editable: true,
        ownerName: null as string | null,
        canUseFilters: canUseRuleFilters(roleOf(auth)),
      },
    })
  }

  async update({ auth, request, response, session, params, inertia }: HttpContext) {
    const payload = await request.validateUsing(shareValidator)
    if (payload.mode === 'rule' && !canUseRuleFilters(roleOf(auth))) {
      response.status(403)
      return inertia.render('errors/forbidden', {
        message: 'Only admins can share with filters. Pick specific case studies instead.',
      })
    }
    const s = await ShareLink.find(String(params.id ?? ''))
    if (!s) {
      session.flash('error', 'Share not found')
      return response.redirect('/shares')
    }
    s.merge({
      recipientName: payload.recipientName ?? s.recipientName,
      recipientEmail: payload.email ?? s.recipientEmail,
      maxViews: payload.maxViews ?? s.maxViews,
      specificCaseStudyIds:
        payload.mode === 'selected'
          ? (payload.caseStudyIds ?? s.specificCaseStudyIds)
          : s.specificCaseStudyIds,
    })
    if (payload.requirePassword && payload.password)
      s.passwordHash = await hash.make(payload.password)
    if (payload.requirePassword === false) s.passwordHash = null
    await s.save()
    session.flash('success', 'Share updated')
    return response.redirect().back()
  }

  async destroy({ response, session, params }: HttpContext) {
    const s = await ShareLink.find(String(params.id ?? ''))
    if (s) {
      s.revoked = true
      await s.save()
    }
    session.flash('success', 'Share deleted')
    return response.redirect('/shares')
  }

  async preview({ auth, request, response }: HttpContext) {
    if (!canUseRuleFilters(roleOf(auth))) {
      return response.forbidden({ message: 'Only admins can preview filter rules' })
    }
    const ids = async (table: string, names: string[]) => {
      if (names.length === 0) return []
      const rows = await db.from(table).whereIn('name', names).select('id')
      return rows.map((r) => String(r.id))
    }
    const rule = request.only([
      'sectors',
      'industries',
      'keyBusinesses',
      'categories',
      'services',
      'clients',
    ]) as Record<string, string[] | undefined>
    let query = CaseStudy.query().where('status', 'published')
    if (rule.categories?.length) {
      const cids = await ids('work_categories', rule.categories)
      const links = await db
        .from('case_study_categories')
        .whereIn('category_id', cids.length ? cids : ['__none__'])
        .select('case_study_id as id')
      query = query.whereIn('id', [...new Set(links.map((r) => String(r.id))), '__none__'])
    }
    if (rule.services?.length) {
      const sids = await ids('services', rule.services)
      const links = await db
        .from('case_study_services')
        .whereIn('service_id', sids.length ? sids : ['__none__'])
        .select('case_study_id as id')
      query = query.whereIn('id', [...new Set(links.map((r) => String(r.id))), '__none__'])
    }
    const matches = await query.limit(7)
    return response.json({
      count: matches.length,
      thumbs: matches.slice(0, 6).map((m) => ({ id: m.id, url: m.heroImageUrl })),
    })
  }
}
