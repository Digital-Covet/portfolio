import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import BusinessModel from '#models/business_model'
import CaseStudy from '#models/case_study'
import Client from '#models/client'
import File from '#models/file'
import KeyBusiness from '#models/key_business'
import Sector from '#models/sector'
import Service from '#models/service'
import WorkCategory from '#models/work_category'
import { caseStudyValidator } from '#validators/case_study'
import { UUID, fileUrl } from '#services/file_urls'

type Payload = Awaited<ReturnType<typeof caseStudyValidator.validate>>

/** Headings the editor has its own field for; anything else is kept in `extra`. */
const KNOWN: Record<string, 'challenge' | 'solution' | 'results'> = {
  challenge: 'challenge',
  solution: 'solution',
  approach: 'solution',
  results: 'results',
  outcome: 'results',
}

function splitContent(md: string | null) {
  const out = { overview: '', challenge: '', solution: '', results: '', extra: '' }
  if (!md) return out
  const [head, ...parts] = md.split(/^##\s+/m)
  out.overview = head.trim()
  const extra: string[] = []
  for (const part of parts) {
    const nl = part.indexOf('\n')
    const heading = (nl === -1 ? part : part.slice(0, nl)).trim()
    const body = nl === -1 ? '' : part.slice(nl + 1).trim()
    const key = KNOWN[heading.toLowerCase()]
    if (key && !out[key]) out[key] = body
    else extra.push(`## ${heading}\n\n${body}`.trim())
  }
  out.extra = extra.join('\n\n')
  return out
}

function joinContent(p: Payload) {
  return [
    p.overview,
    p.challenge && `## Challenge\n\n${p.challenge}`,
    p.solution && `## Solution\n\n${p.solution}`,
    p.results && `## Results\n\n${p.results}`,
    p.extra,
  ]
    .filter(Boolean)
    .join('\n\n')
}

function slugify(title: string) {
  return (
    title
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'case-study'
  )
}

async function uniqueSlug(title: string, trx: TransactionClientContract, ignoreId?: string) {
  const base = slugify(title)
  for (let i = 1; ; i++) {
    const candidate = i === 1 ? base : `${base}-${i}`
    const q = trx.from('case_study').where('slug', candidate).whereNull('deleted_at')
    if (ignoreId) q.whereNot('id', ignoreId)
    if (!(await q.first())) return candidate
  }
}

const uniq = (ids: string[]) => [...new Set(ids)]

export default class CaseStudyEditorController {
  async create(ctx: HttpContext) {
    return ctx.inertia.render('case_studies/edit', {
      study: null,
      options: await this.#options(),
    })
  }

  async edit({ inertia, params, response }: HttpContext) {
    if (!UUID.test(params.id)) return response.notFound()

    const study = await CaseStudy.query()
      .where('id', params.id)
      .apply((s) => s.live())
      .preload('hero')
      .preload('keyBusinesses')
      .preload('workCategories')
      .preload('services')
      .preload('businessModels')
      .preload('images', (q) => q.orderBy('case_study_image.sort_order'))
      .preload('attachments')
      .preload('videos', (q) => q.orderBy('sort_order'))
      .preload('metrics', (q) => q.orderBy('sort_order'))
      .preload('testimonials', (q) => q.orderBy('sort_order'))
      .first()
    if (!study) return response.notFound()

    const seq = await db.rawQuery(
      `SELECT seq FROM (
         SELECT id, row_number() OVER (ORDER BY created_at, id)::int AS seq FROM case_study
       ) c WHERE id = ?`,
      [study.id]
    )

    return inertia.render('case_studies/edit', {
      study: {
        id: study.id,
        folio: seq.rows[0]?.seq as number,
        status: study.status,
        updatedAt: study.updatedAt.toISO()!,
        title: study.title,
        clientId: study.clientId,
        ...splitContent(study.contentMarkdown),
        hero: study.hero
          ? { id: study.hero.id, name: study.hero.originalName, url: fileUrl(study.hero)! }
          : null,
        gallery: study.images.map((f) => ({ id: f.id, name: f.originalName, url: fileUrl(f)! })),
        attachments: study.attachments.map((f) => ({
          id: f.id,
          name: f.originalName,
          size: Number(f.sizeBytes),
        })),
        videoUrls: study.videos.map((v) => v.url),
        metrics: study.metrics.map((m) => ({ label: m.label, value: m.value })),
        testimonials: study.testimonials.map((t) => ({
          quote: t.quote,
          authorName: t.authorName,
          authorTitle: t.authorTitle ?? '',
        })),
        keyBusinessIds: study.keyBusinesses.map((k) => k.id),
        workCategoryIds: study.workCategories.map((w) => w.id),
        serviceIds: study.services.map((s) => s.id),
        businessModelIds: study.businessModels.map((b) => b.id),
      },
      options: await this.#options(),
    })
  }

  async store(ctx: HttpContext) {
    return this.#save(ctx, null)
  }

  async update(ctx: HttpContext) {
    const { params, response } = ctx
    if (!UUID.test(params.id)) return response.notFound()
    const study = await CaseStudy.query()
      .where('id', params.id)
      .apply((s) => s.live())
      .first()
    if (!study) return response.notFound()
    return this.#save(ctx, study)
  }

  async archive({ params, response, auth, session }: HttpContext) {
    if (!UUID.test(params.id)) return response.notFound()
    const study = await CaseStudy.query()
      .where('id', params.id)
      .apply((s) => s.live())
      .first()
    if (!study) return response.notFound()
    study.merge({ status: 'archived', updatedBy: auth.user!.id })
    await study.save()
    session.flash('success', 'Archived')
    return response.redirect().toPath(`/case-studies/${study.id}`)
  }

  /**
   * Copies a study as a new draft: content, classification and media, but not its
   * shares, status or slug history. Files are referenced, not re-uploaded.
   */
  async duplicate({ params, response, auth, session }: HttpContext) {
    if (!UUID.test(params.id)) return response.notFound()
    const source = await CaseStudy.query()
      .where('id', params.id)
      .apply((s) => s.live())
      .preload('keyBusinesses')
      .preload('workCategories')
      .preload('services')
      .preload('businessModels')
      .preload('images')
      .preload('attachments')
      .preload('videos')
      .preload('metrics')
      .preload('testimonials')
      .first()
    if (!source) return response.notFound()

    const copy = await db.transaction(async (trx) => {
      const title = `${source.title} (copy)`.slice(0, 255)
      const row = new CaseStudy()
      row.useTransaction(trx)
      row.merge({
        title,
        slug: await uniqueSlug(title, trx),
        contentMarkdown: source.contentMarkdown,
        status: 'draft',
        clientId: source.clientId,
        departmentId: source.departmentId,
        heroFileId: source.heroFileId,
        createdBy: auth.user!.id,
        updatedBy: auth.user!.id,
      })
      await row.save()

      await row.related('keyBusinesses').sync(source.keyBusinesses.map((r) => r.id))
      await row.related('workCategories').sync(source.workCategories.map((r) => r.id))
      await row.related('services').sync(source.services.map((r) => r.id))
      await row.related('businessModels').sync(source.businessModels.map((r) => r.id))
      await row.related('attachments').sync(source.attachments.map((r) => r.id))
      await row
        .related('images')
        .sync(
          Object.fromEntries(
            [...source.images]
              .sort((a, b) => a.$extras.pivot_sort_order - b.$extras.pivot_sort_order)
              .map((f, i) => [f.id, { sort_order: i }])
          )
        )
      await row
        .related('videos')
        .createMany(source.videos.map((v) => ({ url: v.url, sortOrder: v.sortOrder })))
      await row
        .related('metrics')
        .createMany(
          source.metrics.map((m) => ({ label: m.label, value: m.value, sortOrder: m.sortOrder }))
        )
      await row.related('testimonials').createMany(
        source.testimonials.map((t) => ({
          quote: t.quote,
          authorName: t.authorName,
          authorTitle: t.authorTitle,
          sortOrder: t.sortOrder,
        }))
      )
      return row
    })

    session.flash('success', 'Duplicated as a draft')
    return response.redirect().toPath(`/case-studies/${copy.id}/edit`)
  }

  /* ------------------------------------------------------------------------ */

  async #options() {
    const [clients, sectors, workCategories, services, businessModels] = await Promise.all([
      Client.query()
        .apply((s) => s.live())
        .orderBy('name'),
      Sector.query()
        .orderBy('name')
        .preload('industries', (i) =>
          i.orderBy('name').preload('keyBusinesses', (k) => k.orderBy('name'))
        ),
      WorkCategory.query().orderBy('name'),
      Service.query().orderBy('name'),
      BusinessModel.query().orderBy('name'),
    ])
    const pick = (r: { id: string; name: string }) => ({ id: r.id, name: r.name })
    return {
      clients: clients.map(pick),
      sectors: sectors.map((s) => ({
        ...pick(s),
        industries: s.industries.map((i) => ({
          ...pick(i),
          keyBusinesses: i.keyBusinesses.map(pick),
        })),
      })),
      workCategories: workCategories.map(pick),
      services: services.map(pick),
      businessModels: businessModels.map(pick),
    }
  }

  async #save({ request, response, auth, session }: HttpContext, existing: CaseStudy | null) {
    const p = await request.validateUsing(caseStudyValidator)
    const user = auth.user!

    // Autosave only touches drafts; published work changes on an explicit Update.
    if (p.intent === 'autosave' && existing && existing.status !== 'draft') {
      return response.redirect().back()
    }

    const fail = (errors: Record<string, string>) => {
      session.flash('inputErrorsBag', errors)
      return response.redirect().back()
    }

    const galleryIds = uniq(p.galleryIds)
    const attachmentIds = uniq(p.attachmentIds)
    const keyBusinessIds = uniq(p.keyBusinessIds)
    const workCategoryIds = uniq(p.workCategoryIds)
    const serviceIds = uniq(p.serviceIds)
    const businessModelIds = uniq(p.businessModelIds)
    const fileIds = uniq([...galleryIds, ...attachmentIds, ...(p.heroFileId ? [p.heroFileId] : [])])

    // Foreign keys: report a stale id as a field error instead of a 500.
    const client = await Client.query()
      .where('id', p.clientId)
      .apply((s) => s.live())
      .first()
    if (!client) return fail({ clientId: 'Choose a client from the list.' })

    const count = async (model: { query(): any }, ids: string[]) => {
      if (!ids.length) return 0
      const [row] = await model.query().whereIn('id', ids).count('* as n')
      return Number(row.$extras.n)
    }
    const checks: [string, { query(): any }, string[]][] = [
      ['keyBusinessIds', KeyBusiness, keyBusinessIds],
      ['workCategoryIds', WorkCategory, workCategoryIds],
      ['serviceIds', Service, serviceIds],
      ['businessModelIds', BusinessModel, businessModelIds],
      ['galleryIds', File, fileIds],
    ]
    for (const [field, model, ids] of checks) {
      if ((await count(model, ids)) !== ids.length) {
        return fail({
          [field]: 'One of the selected items no longer exists. Reload and try again.',
        })
      }
    }

    const departmentId = existing?.departmentId ?? user.departmentId
    if (!departmentId) return fail({ title: 'Your account has no department assigned.' })

    if (p.intent === 'publish') {
      const missing: Record<string, string> = {}
      if (!p.heroFileId) missing.heroFileId = 'Add a hero image before publishing.'
      if (!keyBusinessIds.length) missing.keyBusinessIds = 'Pick at least one key business.'
      if (Object.keys(missing).length) return fail(missing)
    }

    const status =
      p.intent === 'publish'
        ? 'published'
        : p.intent === 'restore'
          ? 'draft'
          : (existing?.status ?? 'draft')

    const study = await db.transaction(async (trx) => {
      const row = existing ?? new CaseStudy()
      row.useTransaction(trx)

      const titleChanged = !existing || existing.title !== p.title
      row.merge({
        title: p.title,
        clientId: p.clientId,
        departmentId,
        heroFileId: p.heroFileId ?? null,
        contentMarkdown: joinContent(p) || null,
        status,
        updatedBy: user.id,
      })
      if (!existing) row.createdBy = user.id
      if (titleChanged && (!existing || existing.status === 'draft')) {
        // Published slugs are stable: client links must not break on a rename.
        row.slug = await uniqueSlug(p.title, trx, existing?.id)
      }
      await row.save()

      await row.related('keyBusinesses').sync(keyBusinessIds)
      await row.related('workCategories').sync(workCategoryIds)
      await row.related('services').sync(serviceIds)
      await row.related('businessModels').sync(businessModelIds)
      await row.related('attachments').sync(attachmentIds)
      await row
        .related('images')
        .sync(Object.fromEntries(galleryIds.map((id, i) => [id, { sort_order: i }])))

      await row.related('videos').query().delete()
      await row
        .related('videos')
        .createMany(p.videoUrls.map((url, sortOrder) => ({ url, sortOrder })))
      await row.related('metrics').query().delete()
      await row
        .related('metrics')
        .createMany(p.metrics.map((m, sortOrder) => ({ ...m, sortOrder })))
      await row.related('testimonials').query().delete()
      await row.related('testimonials').createMany(
        p.testimonials.map((t, sortOrder) => ({
          quote: t.quote,
          authorName: t.authorName,
          authorTitle: t.authorTitle || null,
          sortOrder,
        }))
      )
      return row
    })

    if (p.intent === 'autosave') return response.redirect().back()

    if (p.intent === 'publish') {
      const live = await db.rawQuery(
        `SELECT count(*)::int AS n FROM share s
         JOIN share_case_study sc ON sc.share_id = s.id AND sc.case_study_id = ?
         WHERE s.deleted_at IS NULL AND (s.expires_at IS NULL OR s.expires_at > now())`,
        [study.id]
      )
      const n: number = live.rows[0]?.n ?? 0
      session.flash(
        'success',
        n > 0 ? `Published. Now visible in ${n} share${n === 1 ? '' : 's'}.` : 'Published'
      )
    } else {
      session.flash('success', p.intent === 'restore' ? 'Restored to draft' : 'Saved')
    }

    return existing
      ? response.redirect().back()
      : response.redirect().toPath(`/case-studies/${study.id}/edit`)
  }
}
