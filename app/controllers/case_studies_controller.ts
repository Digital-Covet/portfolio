import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { randomUUID } from 'node:crypto'
import CaseStudy from '#models/case_study'
import CaseStudyMetric from '#models/case_study_metric'
import Client from '#models/client'
import Sector from '#models/sector'
import Industry from '#models/industry'
import KeyBusiness from '#models/key_business'
import WorkCategory from '#models/work_category'
import ServiceItem from '#models/service_item'
import BusinessModel from '#models/business_model'
import { caseStudyDraftValidator, caseStudyPublishValidator } from '#validators/case_study'
import { enrichCaseStudies } from '#services/portfolio_queries'

const STATUSES = ['all', 'published', 'draft', 'archived'] as const
type Status = (typeof STATUSES)[number]

const SORTS = ['updated', 'title'] as const
type Sort = (typeof SORTS)[number]

const PER_PAGES = ['25', '50'] as const
type EditorStatus = 'draft' | 'published' | 'archived'

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120) || `case-study-${Date.now()}`
  )
}

async function uniqueCaseSlug(base: string, ignoreId?: string): Promise<string> {
  let slug = base
  let n = 2
  for (;;) {
    const q = CaseStudy.query().where('slug', slug)
    if (ignoreId) q.whereNot('id', ignoreId)
    if (!(await q.first())) return slug
    slug = `${base.slice(0, 110)}-${n}`
    n += 1
  }
}

async function idsForNames(table: string, names: string[]): Promise<string[]> {
  if (names.length === 0) return []
  const rows = await db.from(table).whereIn('name', names).select('id')
  return rows.map((r) => String(r.id))
}

async function syncPivots(caseStudyId: string, payload: Record<string, any>) {
  const categoryIds = await idsForNames('work_categories', payload.categories ?? [])
  const serviceIds = await idsForNames('services', payload.services ?? [])
  const modelIds = await idsForNames('business_models', payload.businessModels ?? [])

  let keyIds: string[] = []
  if (payload.keyBusiness) {
    if (Array.isArray(payload.keyBusiness))
      keyIds = await idsForNames('key_businesses', payload.keyBusiness)
    else {
      const row = await db.from('key_businesses').where('name', payload.keyBusiness).first()
      if (row) keyIds = [String(row.id)]
      else if (payload.industry) {
        const ind = await db.from('industries').where('name', payload.industry).first()
        if (ind) {
          const kb = await db.from('key_businesses').where('industry_id', ind.id).first()
          if (kb) keyIds = [String(kb.id)]
        }
      }
    }
  }

  await db.from('case_study_categories').where('case_study_id', caseStudyId).delete()
  await db.from('case_study_services').where('case_study_id', caseStudyId).delete()
  await db.from('case_study_business_models').where('case_study_id', caseStudyId).delete()
  await db.from('case_study_key_businesses').where('case_study_id', caseStudyId).delete()

  if (categoryIds.length > 0) {
    await db
      .table('case_study_categories')
      .multiInsert(categoryIds.map((category_id) => ({ case_study_id: caseStudyId, category_id })))
  }
  if (serviceIds.length > 0) {
    await db
      .table('case_study_services')
      .multiInsert(serviceIds.map((service_id) => ({ case_study_id: caseStudyId, service_id })))
  }
  if (modelIds.length > 0) {
    await db.table('case_study_business_models').multiInsert(
      modelIds.map((business_model_id) => ({
        id: randomUUID(),
        case_study_id: caseStudyId,
        business_model_id,
      }))
    )
  }
  if (keyIds.length > 0) {
    await db
      .table('case_study_key_businesses')
      .multiInsert(
        keyIds.map((key_business_id) => ({ case_study_id: caseStudyId, key_business_id }))
      )
  }
}

async function taxonomyOptions() {
  const [sectors, industries, keyBusinesses, categories, services, models, clients] =
    await Promise.all([
      Sector.query().orderBy('name', 'asc'),
      Industry.query().orderBy('name', 'asc'),
      KeyBusiness.query().orderBy('name', 'asc'),
      WorkCategory.query().orderBy('name', 'asc'),
      ServiceItem.query().orderBy('name', 'asc'),
      BusinessModel.query().orderBy('name', 'asc'),
      Client.query().orderBy('name', 'asc'),
    ])
  return {
    sectors: sectors.map((s) => s.name),
    industries: industries.map((i) => i.name),
    keyBusinesses: keyBusinesses.map((k) => k.name),
    categories: categories.map((c) => c.name),
    services: services.map((s) => s.name),
    businessModels: models.map((m) => m.name),
    clients: clients.map((c) => ({ id: c.id, name: c.name, logoUrl: c.logoUrl })),
  }
}

function emptyForm() {
  return {
    title: '',
    slug: '',
    summary: '',
    heroImageKey: null as string | null,
    heroImageUrl: null as string | null,
    gallery: [] as Array<{ key: string; url: string; uploading?: boolean; failed?: boolean }>,
    storyMarkdown: '',
    videos: [] as Array<{ url: string; provider: 'youtube' | 'vimeo' | 'other' }>,
    metrics: [] as Array<{ label: string; value: string; suffix: '%' | 'x' | '+' | '' }>,
    testimonialQuote: '',
    testimonialName: '',
    testimonialRole: '',
    attachments: [] as Array<{ key: string; name: string; size: string; url: string }>,
    clientId: '',
    sector: '',
    industry: '',
    keyBusiness: '',
    categories: [] as string[],
    services: [] as string[],
    businessModels: [] as string[],
  }
}

function ownerOf(auth: HttpContext['auth']) {
  const u = auth.user as unknown as {
    fullName?: string | null
    name?: string | null
    email: string
  } | null
  const name = u?.fullName ?? u?.name ?? u?.email ?? 'Studio'
  return { ownerName: name, ownerInitials: name.slice(0, 2).toUpperCase(), department: 'Studio' }
}

export default class CaseStudiesController {
  async index({ inertia, request }: HttpContext) {
    const rawStatus = String(request.input('status', 'all') ?? 'all')
    const status: Status = (STATUSES as readonly string[]).includes(rawStatus)
      ? (rawStatus as Status)
      : 'all'
    const rawSort = String(request.input('sort', 'updated') ?? 'updated')
    const sort: Sort = (SORTS as readonly string[]).includes(rawSort)
      ? (rawSort as Sort)
      : 'updated'
    const rawPerPage = String(request.input('perPage', '25') ?? '25')
    const perPage = (PER_PAGES as readonly string[]).includes(rawPerPage) ? Number(rawPerPage) : 25
    const page = Math.max(1, Number(request.input('page', 1) ?? 1) || 1)
    const rawView = String(request.input('view', 'table') ?? 'table')
    const view: 'table' | 'grid' = rawView === 'grid' ? 'grid' : 'table'

    const filters = {
      q: String(request.input('q', '') ?? ''),
      status,
      sector: String(request.input('sector', 'all') ?? 'all'),
      industry: String(request.input('industry', 'all') ?? 'all'),
      keyBusiness: String(request.input('keyBusiness', 'all') ?? 'all'),
      category: String(request.input('category', 'all') ?? 'all'),
      service: String(request.input('service', 'all') ?? 'all'),
      client: String(request.input('client', 'all') ?? 'all'),
      owner: String(request.input('owner', 'all') ?? 'all'),
      sort,
      page,
      perPage,
      view,
    }

    let query = CaseStudy.query()
    if (status !== 'all') query = query.where('status', status)
    if (filters.q) {
      const q = `%${filters.q}%`
      query = query.where((b) => b.whereILike('title', q).orWhereILike('slug', q))
    }
    if (filters.client !== 'all') {
      const clientRow = await db.from('clients').where('name', filters.client).first()
      query = query.where('client_id', clientRow ? String(clientRow.id) : '__none__')
    }
    if (filters.owner !== 'all') {
      const ownerRow = await db.from('user').where('name', filters.owner).first()
      query = query.where('created_by', ownerRow ? String(ownerRow.id) : '__none__')
    }
    const applyPivotFilter = async (pivot: string, table: string, name: string, column: string) => {
      if (name === 'all') return
      const term = await db.from(table).where('name', name).first()
      if (!term) {
        query = query.where('id', '__none__')
        return
      }
      const links = await db.from(pivot).where(column, term.id).select('case_study_id as id')
      const ids = [...new Set(links.map((r) => String(r.id)))]
      query = query.whereIn('id', ids.length > 0 ? ids : ['__none__'])
    }
    await applyPivotFilter(
      'case_study_categories',
      'work_categories',
      filters.category,
      'category_id'
    )
    await applyPivotFilter('case_study_services', 'services', filters.service, 'service_id')
    if (filters.keyBusiness !== 'all' || filters.industry !== 'all' || filters.sector !== 'all') {
      let keyIds: string[] = []
      if (filters.keyBusiness !== 'all') {
        const kb = await db.from('key_businesses').where('name', filters.keyBusiness).first()
        keyIds = kb ? [String(kb.id)] : []
      } else if (filters.industry !== 'all') {
        const ind = await db.from('industries').where('name', filters.industry).first()
        if (ind) {
          const kbRows = await db.from('key_businesses').where('industry_id', ind.id).select('id')
          keyIds = kbRows.map((r) => String(r.id))
        }
      } else {
        const sec = await db.from('sectors').where('name', filters.sector).first()
        const inds = sec ? await db.from('industries').where('sector_id', sec.id).select('id') : []
        const indIds = inds.map((r) => String(r.id))
        if (indIds.length > 0) {
          const kbRows = await db.from('key_businesses').whereIn('industry_id', indIds).select('id')
          keyIds = kbRows.map((r) => String(r.id))
        }
      }
      if (keyIds.length === 0) {
        query = query.where('id', '__none__')
      } else {
        const links = await db
          .from('case_study_key_businesses')
          .whereIn('key_business_id', keyIds)
          .select('case_study_id as id')
        const ids = [...new Set(links.map((r) => String(r.id)))]
        query = query.whereIn('id', ids.length > 0 ? ids : ['__none__'])
      }
    }

    if (sort === 'title') query = query.orderBy('title', 'asc')
    else query = query.orderBy('updated_at', 'desc')

    const countRows = await db
      .from('case_studies')
      .select('status')
      .count('* as count')
      .groupBy('status')
    const countMap = new Map<string, number>(
      countRows.map((r) => [String(r.status), Number(r.count)])
    )
    const counts = {
      all: [...countMap.values()].reduce((a, b) => a + b, 0),
      published: countMap.get('published') ?? 0,
      draft: countMap.get('draft') ?? 0,
      archived: countMap.get('archived') ?? 0,
    }

    const paginator = await query.paginate(page, perPage)
    const enriched = await enrichCaseStudies(paginator.all())

    const [sectorOpts, industryOpts, keyOpts, catOpts, svcOpts, clientOpts, ownerOpts] =
      await Promise.all([
        db.from('sectors').orderBy('name', 'asc').select('name'),
        db.from('industries').orderBy('name', 'asc').select('name'),
        db.from('key_businesses').orderBy('name', 'asc').select('name'),
        db.from('work_categories').orderBy('name', 'asc').select('name'),
        db.from('services').orderBy('name', 'asc').select('name'),
        db.from('clients').orderBy('name', 'asc').select('name'),
        db.from('user').orderBy('name', 'asc').select('name'),
      ])

    return inertia.render('case_studies', {
      filters,
      counts,
      rows: enriched.map((r) => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        heroThumb: r.heroThumb,
        clientName: r.clientName,
        clientLogo: r.clientLogo,
        sector: r.sector,
        industry: r.industry,
        status: r.status,
        ownerName: r.ownerName,
        ownerInitials: r.ownerInitials,
        ownerDepartment: r.ownerDepartment,
        editable: true,
        updatedAt: r.updatedAt,
        updatedRelative: r.updatedRelative,
      })),
      meta: {
        total: paginator.getMeta().total,
        from: (page - 1) * perPage + (enriched.length > 0 ? 1 : 0),
        to: (page - 1) * perPage + enriched.length,
        page,
        perPage,
      },
      filterOptions: {
        sectors: sectorOpts.map((r) => r.name),
        industries: industryOpts.map((r) => r.name),
        keyBusinesses: keyOpts.map((r) => r.name),
        categories: catOpts.map((r) => r.name),
        services: svcOpts.map((r) => r.name),
        clients: clientOpts.map((r) => r.name),
        owners: ownerOpts.map((r) => r.name),
      },
    })
  }

  async new({ inertia, auth }: HttpContext) {
    return inertia.render('case_study_editor', {
      mode: 'new',
      caseStudy: {
        id: null as string | null,
        status: 'draft' as EditorStatus,
        updatedAt: null as string | null,
        updatedRelative: 'Unsaved',
        form: emptyForm(),
      },
      options: await taxonomyOptions(),
      ownership: ownerOf(auth),
      permissions: {
        editable: true,
        ownerName: null as string | null,
        ownerDepartment: null as string | null,
      },
    })
  }

  async store({ auth, request, response, session }: HttpContext) {
    const payload = await request.validateUsing(caseStudyDraftValidator)
    const title = payload.title?.trim() || 'Untitled case study'
    const slug = await uniqueCaseSlug(slugify(title))
    const row = await CaseStudy.create({
      id: randomUUID(),
      title,
      slug,
      status: 'draft',
      description: payload.summary ?? null,
      solution: payload.storyMarkdown ?? null,
      heroImageUrl: payload.heroImageKey ?? null,
      videoEmbedUrl: payload.videos?.[0]?.url ?? null,
      testimonialQuote: payload.testimonialQuote ?? null,
      testimonialAuthor: payload.testimonialName ?? null,
      testimonialTitle: payload.testimonialRole ?? null,
      clientId: payload.clientId || null,
      galleryUrls: payload.galleryKeys ?? [],
      attachmentUrls: payload.attachmentKeys ?? [],
      createdBy: (auth.user as unknown as { id?: string | number })?.id
        ? String((auth.user as unknown as { id: string | number }).id)
        : null,
    })
    if (payload.metrics && payload.metrics.length > 0) {
      await CaseStudyMetric.createMany(
        payload.metrics.map((m, i) => ({
          id: randomUUID(),
          caseStudyId: row.id,
          label: m.label,
          value: m.value,
          unit: m.suffix || null,
          sortOrder: i,
        }))
      )
    }
    await syncPivots(row.id, payload)
    session.flash('success', 'Draft saved')
    return response.redirect(`/case-studies/${row.id}/edit`)
  }

  async show({ inertia, auth, params }: HttpContext) {
    const id = String(params.id ?? '')
    const row = (await CaseStudy.find(id)) ?? (await CaseStudy.findBy('slug', id))
    if (!row) {
      return inertia.render('errors/not_found', { message: 'Case study not found' })
    }
    const [enriched] = await enrichCaseStudies([row])
    const metrics = await CaseStudyMetric.query()
      .where('case_study_id', row.id)
      .orderBy('sort_order', 'asc')
    const client = row.clientId ? await Client.find(row.clientId) : null
    const user = auth.user!
    const ownerName =
      (user as unknown as { fullName?: string })?.fullName ??
      (user as unknown as { email: string }).email

    let shares: any[] = []
    try {
      const all = await db
        .from('share_links')
        .select(
          'id',
          'name',
          'recipient_name',
          'token',
          'expires_at',
          'max_views',
          'view_count',
          'specific_case_study_ids'
        )
        .limit(50)
      shares = all.filter((s: any) => {
        const ids = s.specific_case_study_ids
        return Array.isArray(ids) && ids.includes(row.id)
      })
    } catch {
      shares = []
    }

    return inertia.render('case_study_detail', {
      caseStudy: {
        id: row.id,
        title: row.title,
        slug: row.slug,
        summary: row.description ?? '',
        status: row.status as EditorStatus,
        heroImageUrl: row.heroImageUrl,
        gallery: (row.galleryUrls ?? []).map((url) => ({ key: url, url })),
        storyMarkdown: [row.challenge, row.solution, row.results].filter(Boolean).join('\n\n'),
        videos: row.videoEmbedUrl ? [{ url: row.videoEmbedUrl, provider: 'other' as const }] : [],
        metrics: metrics.map((m) => ({
          label: m.label,
          value: m.value,
          suffix: (m.unit ?? '') as '%' | 'x' | '+' | '',
        })),
        testimonial: {
          quote: row.testimonialQuote ?? '',
          name: row.testimonialAuthor ?? '',
          role: row.testimonialTitle ?? '',
        },
        attachments: Array.isArray(row.attachmentUrls)
          ? (row.attachmentUrls as any[]).map((a) =>
              typeof a === 'string'
                ? { key: a, name: a.split('/').pop() ?? a, size: '', url: a }
                : a
            )
          : [],
        client: {
          id: client?.id ?? '',
          name: client?.name ?? '—',
          logoUrl: client?.logoUrl ?? null,
        },
        sector: enriched.sector,
        industry: enriched.industry,
        keyBusiness: enriched.keyBusiness,
        categories: enriched.categories,
        services: enriched.services,
        businessModels: enriched.businessModels,
        ownerName: enriched.ownerName,
        ownerInitials: enriched.ownerInitials,
        department: enriched.ownerDepartment,
        updatedAt: enriched.updatedAt,
        updatedRelative: enriched.updatedRelative,
      },
      permissions: { editable: true, ownerName, ownerDepartment: 'Studio' },
      sharedIn: shares.map((s: any) => ({
        id: String(s.id),
        recipient: s.recipient_name ?? s.name,
        company: '',
        tokenSuffix: String(s.token).slice(-6),
        status: 'active' as const,
        views: String(s.view_count ?? 0),
        expiresAt: s.expires_at ? new Date(s.expires_at).toISOString() : null,
      })),
    })
  }

  async edit({ inertia, auth, params }: HttpContext) {
    const id = String(params.id ?? '')
    const row = (await CaseStudy.find(id)) ?? (await CaseStudy.findBy('slug', id))
    if (!row) {
      return inertia.render('errors/not_found', { message: 'Case study not found' })
    }
    const [enriched] = await enrichCaseStudies([row])
    const metrics = await CaseStudyMetric.query()
      .where('case_study_id', row.id)
      .orderBy('sort_order', 'asc')
    const attachments = Array.isArray(row.attachmentUrls) ? (row.attachmentUrls as string[]) : []
    return inertia.render('case_study_editor', {
      mode: 'edit',
      caseStudy: {
        id: row.id,
        status: row.status as EditorStatus,
        updatedAt: enriched.updatedAt,
        updatedRelative: enriched.updatedRelative,
        form: {
          ...emptyForm(),
          title: row.title,
          slug: row.slug,
          summary: row.description ?? '',
          heroImageKey: row.heroImageUrl,
          heroImageUrl: row.heroImageUrl,
          gallery: (row.galleryUrls ?? []).map((url) => ({ key: url, url })),
          storyMarkdown: row.solution ?? '',
          videos: row.videoEmbedUrl ? [{ url: row.videoEmbedUrl, provider: 'other' as const }] : [],
          metrics: metrics.map((m) => ({
            label: m.label,
            value: m.value,
            suffix: (m.unit ?? '') as '%' | 'x' | '+' | '',
          })),
          testimonialQuote: row.testimonialQuote ?? '',
          testimonialName: row.testimonialAuthor ?? '',
          testimonialRole: row.testimonialTitle ?? '',
          attachments: attachments.map((a) => ({
            key: a,
            name: String(a).split('/').pop() ?? a,
            size: '',
            url: a,
          })),
          clientId: row.clientId ?? '',
          sector: enriched.sector,
          industry: enriched.industry,
          keyBusiness: enriched.keyBusiness,
          categories: enriched.categories,
          services: enriched.services,
          businessModels: enriched.businessModels,
        },
      },
      options: await taxonomyOptions(),
      ownership: ownerOf(auth),
      permissions: {
        editable: true,
        ownerName: null as string | null,
        ownerDepartment: null as string | null,
      },
    })
  }

  async update({ request, response, session, params }: HttpContext) {
    const payload = await request.validateUsing(caseStudyDraftValidator)
    const id = String(params.id ?? '')
    const row = await CaseStudy.find(id)
    if (!row) {
      session.flash('error', 'Case study not found')
      return response.redirect('/case-studies')
    }
    row.merge({
      title: payload.title?.trim() || row.title,
      description: payload.summary ?? row.description,
      solution: payload.storyMarkdown ?? row.solution,
      heroImageUrl: payload.heroImageKey ?? row.heroImageUrl,
      videoEmbedUrl: payload.videos?.[0]?.url ?? row.videoEmbedUrl,
      testimonialQuote: payload.testimonialQuote ?? row.testimonialQuote,
      testimonialAuthor: payload.testimonialName ?? row.testimonialAuthor,
      testimonialTitle: payload.testimonialRole ?? row.testimonialTitle,
      clientId: payload.clientId || row.clientId,
      galleryUrls: payload.galleryKeys ?? row.galleryUrls,
      attachmentUrls: (payload.attachmentKeys ?? row.attachmentUrls) as any,
    })
    await row.save()
    if (payload.metrics) {
      await db.from('case_study_metrics').where('case_study_id', row.id).delete()
      if (payload.metrics.length > 0) {
        await CaseStudyMetric.createMany(
          payload.metrics.map((m, i) => ({
            id: randomUUID(),
            caseStudyId: row.id,
            label: m.label,
            value: m.value,
            unit: m.suffix || null,
            sortOrder: i,
          }))
        )
      }
    }
    await syncPivots(row.id, payload)
    session.flash('success', 'Saved')
    return response.redirect().back()
  }

  async publish({ request, response, session, params }: HttpContext) {
    const payload = await request.validateUsing(caseStudyPublishValidator)
    const id = String(params.id ?? '')
    const row = await CaseStudy.find(id)
    if (!row) {
      session.flash('error', 'Case study not found')
      return response.redirect('/case-studies')
    }
    const slug = await uniqueCaseSlug(slugify(payload.title), row.id)
    row.merge({
      title: payload.title,
      slug,
      description: payload.summary,
      heroImageUrl: payload.heroImageKey,
      clientId: payload.clientId,
      status: 'published',
    })
    await row.save()
    session.flash('success', 'Published')
    return response.redirect().back()
  }
}
