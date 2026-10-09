import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import CaseStudy from '#models/case_study'
import { SHARE_STATE_SQL } from '#services/dashboard_service'
import { UUID, fileUrl, proxyUrl } from '#services/file_urls'

const STATUSES = ['draft', 'published', 'archived'] as const
type Status = (typeof STATUSES)[number]

export default class CaseStudiesController {
  /**
   * Library list. `?status=` narrows to one status; anything else shows every
   * non-archived study, plus archived ones only when asked for.
   */
  async index({ inertia, request }: HttpContext) {
    const requested = request.input('status')
    const status: Status | null = STATUSES.includes(requested) ? requested : null

    const studies = await CaseStudy.query()
      .apply((s) => s.live())
      .if(status, (q) => q.where('status', status!))
      .if(!status, (q) => q.whereNot('status', 'archived'))
      .preload('client')
      .preload('hero')
      .orderBy('updatedAt', 'desc')

    return inertia.render('case_studies/index', {
      status,
      studies: studies.map((s) => ({
        id: s.id,
        title: s.title,
        status: s.status,
        client: s.client.name,
        thumbnail: fileUrl(s.hero),
        updatedAt: s.updatedAt.toISO()!,
      })),
    })
  }

  /**
   * Read-only detail page. `shares` is deferred to a closure so a partial reload
   * can refresh it alone.
   */
  async show({ inertia, params, response }: HttpContext) {
    if (!UUID.test(params.id)) return response.notFound()

    const study = await CaseStudy.query()
      .where('id', params.id)
      .apply((s) => s.live())
      .preload('client')
      .preload('hero')
      .preload('editor')
      .preload('creator')
      .preload('keyBusinesses', (q) => q.preload('industry', (i) => i.preload('sector')))
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

    // Folio Nº: position in creation order, soft-deleted rows included so it never shifts.
    const seqResult = await db.rawQuery(
      `SELECT seq FROM (
         SELECT id, row_number() OVER (ORDER BY created_at, id)::int AS seq FROM case_study
       ) c WHERE id = ?`,
      [study.id]
    )

    const sectorNames = new Set<string>()
    const industryNames = new Set<string>()
    for (const kb of study.keyBusinesses) {
      if (kb.industry) {
        industryNames.add(kb.industry.name)
        if (kb.industry.sector) sectorNames.add(kb.industry.sector.name)
      }
    }

    return inertia.render('case_studies/show', {
      study: {
        id: study.id,
        folio: seqResult.rows[0]?.seq as number,
        title: study.title,
        status: study.status,
        client: study.client.name,
        content: study.contentMarkdown ?? '',
        hero: fileUrl(study.hero),
        createdAt: study.createdAt.toISO()!,
        updatedAt: study.updatedAt.toISO()!,
        updatedBy: (study.editor ?? study.creator)?.name ?? null,
        sectors: [...sectorNames],
        industries: [...industryNames],
        keyBusinesses: study.keyBusinesses.map((k) => k.name),
        workCategories: study.workCategories.map((w) => w.name),
        services: study.services.map((s) => s.name),
        businessModels: study.businessModels.map((b) => b.name),
        metrics: study.metrics.map((m) => ({ id: m.id, label: m.label, value: m.value })),
        testimonials: study.testimonials.map((t) => ({
          id: t.id,
          quote: t.quote,
          authorName: t.authorName,
          authorTitle: t.authorTitle,
        })),
        videos: study.videos.map((v) => ({ id: v.id, url: v.url })),
        gallery: study.images.map((f) => ({
          id: f.id,
          name: f.originalName,
          src: fileUrl(f),
        })),
        attachments: study.attachments.map((f) => ({
          id: f.id,
          name: f.originalName,
          size: Number(f.sizeBytes),
          href: `${proxyUrl(f.id)}?download=1`,
        })),
      },
      shares: async () => {
        const { rows } = await db.rawQuery(
          `SELECT id, name, state, expires_at FROM (
             SELECT s.id, s.name, s.expires_at, ${SHARE_STATE_SQL} AS state
             FROM share s
             JOIN share_case_study sc ON sc.share_id = s.id AND sc.case_study_id = ?
             WHERE s.deleted_at IS NULL
           ) t ORDER BY expires_at NULLS LAST, name`,
          [study.id]
        )
        return rows.map(
          (r: { id: string; name: string; state: string; expires_at: Date | null }) => ({
            id: r.id,
            name: r.name,
            state: r.state as 'active' | 'expiring' | 'expired' | 'limit',
            expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : null,
          })
        )
      },
    })
  }
}
