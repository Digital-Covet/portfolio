import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import hash from '@adonisjs/core/services/hash'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import CaseStudy from '#models/case_study'
import File from '#models/file'
import Share from '#models/share'
import { publicThumbnail } from '#services/dashboard_service'
import { UUID } from '#services/file_urls'
import ShareService from '#services/share_service'
import StorageService from '#services/storage_service'
import UnlockLimiter from '#services/unlock_limiter'

const service = new ShareService()
const limiter = new UnlockLimiter()

/** Tokens are generated from an uppercase alphabet; anything else cannot exist. */
const TOKEN = /^[A-Z0-9]{8,32}$/
const SLUG = /^[a-z0-9-]{1,100}$/

type FileRef = { id: string; bucket: string; storagePath: string; visibility: string }

/** Public-bucket files link straight to storage; the rest go through the share's file proxy. */
const portalFile = (token: string, f: FileRef | null) =>
  f
    ? (publicThumbnail({
        bucket: f.bucket,
        storage_path: f.storagePath,
        visibility: f.visibility,
      }) ?? `/s/${token}/files/${f.id}`)
    : null

type Resolved =
  | { state: 'ok'; share: Share; studyIds: string[] }
  | { state: 'gate' | 'expired' | 'limit' | 'unavailable'; share: Share }

export default class PortalController {
  /** Password gate, gallery, or one of the dead-end states. */
  async show(ctx: HttpContext) {
    const share = await this.#find(ctx)
    if (!share) return ctx.response.notFound()
    const r = await this.#resolve(ctx, share)
    const owner = await this.#owner(share)
    const frame = {
      token: share.token,
      expiresAt: share.expiresAt ? share.expiresAt.toUTC().toISO() : null,
      owner,
    }

    if (r.state !== 'ok') {
      return ctx.inertia.render('portal/index', {
        ...frame,
        state: r.state,
        // The native-form fallback for the gate needs the token; never rendered otherwise.
        csrf: r.state === 'gate' ? ctx.request.csrfToken : '',
        name: '',
        studies: [],
      })
    }

    const studies = await this.#cards(share.token, r.studyIds)
    return ctx.inertia.render('portal/index', {
      ...frame,
      state: 'gallery',
      csrf: '',
      name: share.name,
      studies,
    })
  }

  async unlock(ctx: HttpContext) {
    const { request, response, session } = ctx
    const share = await this.#find(ctx)
    if (!share) return response.notFound()
    const back = `/s/${share.token}`

    if (!share.passwordHash) return response.redirect().toPath(back)

    const key = `${request.ip()}:${share.id}`
    const fail = (message: string) => {
      session.flash('inputErrorsBag', { password: message })
      return response.redirect().toPath(back)
    }
    // Consume the attempt before checking, so racing guesses all count against the limit.
    if (!(await limiter.consume(key))) {
      return fail('Too many attempts. Try again in a few minutes.')
    }

    const password = String(request.input('password') ?? '')
    const ok =
      password.length > 0 &&
      password.length <= 128 &&
      (await hash.verify(share.passwordHash, password))
    if (!ok) return fail('That password isn’t right.')

    await limiter.clear(key)
    const unlocked: string[] = session.get('share_unlocked', [])
    if (!unlocked.includes(share.id)) session.put('share_unlocked', [...unlocked, share.id])
    return response.redirect().toPath(back)
  }

  async study(ctx: HttpContext) {
    const { inertia, params, response } = ctx
    if (!SLUG.test(params.slug)) return response.notFound()
    const share = await this.#find(ctx)
    if (!share) return response.notFound()

    const r = await this.#resolve(ctx, share)
    // Not unlocked or no longer available: the gallery URL explains why.
    if (r.state !== 'ok') return response.redirect().toPath(`/s/${share.token}`)

    const study = await CaseStudy.query()
      .where('slug', params.slug)
      .whereIn('id', r.studyIds)
      .preload('client')
      .preload('hero')
      .preload('workCategories')
      .preload('services')
      .preload('images', (q) => q.orderBy('case_study_image.sort_order'))
      .preload('attachments')
      .preload('videos', (q) => q.orderBy('sort_order'))
      .preload('metrics', (q) => q.orderBy('sort_order'))
      .preload('testimonials', (q) => q.orderBy('sort_order'))
      .first()
    if (!study) return response.notFound()

    const order = r.studyIds
    const at = order.indexOf(study.id)
    const sibling = async (id: string | undefined) => {
      if (!id) return null
      const row = await db.from('case_study').where('id', id).select('slug', 'title').first()
      return row ? { slug: row.slug as string, title: row.title as string } : null
    }
    const seq = await db.rawQuery(
      `SELECT seq FROM (
         SELECT id, row_number() OVER (ORDER BY created_at, id)::int AS seq FROM case_study
       ) c WHERE id = ?`,
      [study.id]
    )

    return inertia.render('portal/study', {
      token: share.token,
      expiresAt: share.expiresAt ? share.expiresAt.toUTC().toISO() : null,
      owner: await this.#owner(share),
      study: {
        slug: study.slug,
        folio: seq.rows[0]?.seq as number,
        title: study.title,
        client: study.client.name,
        content: study.contentMarkdown ?? '',
        hero: portalFile(share.token, study.hero),
        categories: study.workCategories.map((c) => c.name),
        services: study.services.map((s) => s.name),
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
          src: portalFile(share.token, f),
        })),
        attachments: study.attachments.map((f) => ({
          id: f.id,
          name: f.originalName,
          size: Number(f.sizeBytes),
          href: `/s/${share.token}/files/${f.id}?download=1`,
        })),
      },
      prev: await sibling(order[at - 1]),
      next: await sibling(order[at + 1]),
    })
  }

  /**
   * File proxy for recipients. Only files that belong to a study the share currently
   * admits are served, and only to a session that has passed the gate.
   */
  async file(ctx: HttpContext) {
    const { params, request, response } = ctx
    if (!UUID.test(params.fileId)) return response.notFound()
    const share = await this.#find(ctx)
    if (!share) return response.notFound()
    const r = await this.#resolve(ctx, share, false)
    if (r.state !== 'ok') return response.notFound()

    const { rows } = await db.rawQuery(
      `SELECT 1 FROM case_study cs
       WHERE cs.id = ANY(?::uuid[]) AND (
         cs.hero_file_id = ?
         OR EXISTS (SELECT 1 FROM case_study_image i WHERE i.case_study_id = cs.id AND i.file_id = ?)
         OR EXISTS (SELECT 1 FROM case_study_attachment a WHERE a.case_study_id = cs.id AND a.file_id = ?)
       ) LIMIT 1`,
      [`{${r.studyIds.join(',')}}`, params.fileId, params.fileId, params.fileId]
    )
    if (!rows.length) return response.notFound()

    const file = await File.find(params.fileId)
    if (!file) return response.notFound()
    try {
      let url = await new StorageService().signedUrl(file.bucket, file.storagePath, 60)
      if (request.input('download')) {
        url += `${url.includes('?') ? '&' : '?'}download=${encodeURIComponent(file.originalName)}`
      }
      response.header('Cache-Control', 'private, no-store')
      return response.redirect().toPath(url)
    } catch (error) {
      logger.error({ err: error, fileId: file.id }, 'portal file proxy failed to sign url')
      return response.status(502).send('File is temporarily unavailable')
    }
  }

  /* ------------------------------------------------------------------------ */

  /** A live (not revoked) share by token, or null. */
  async #find({ params }: HttpContext) {
    if (!TOKEN.test(params.token)) return null
    return Share.query()
      .where('token', params.token)
      .apply((s) => s.live())
      .preload('creator')
      .first()
  }

  async #owner(share: Share) {
    return { name: share.creator?.name ?? null, email: share.creator?.email ?? null }
  }

  /**
   * Decides what the recipient sees. Expiry wins over everything, then the view cap for
   * sessions that haven't been counted yet, then the password gate. A view is recorded
   * once per session, when the gallery (or a study) is first served; the gate never counts.
   */
  async #resolve(ctx: HttpContext, share: Share, record = true): Promise<Resolved> {
    const { session, request } = ctx
    if (share.expiresAt && share.expiresAt <= DateTime.now()) return { state: 'expired', share }

    const viewed: string[] = session.get('share_viewed', [])
    const counted = viewed.includes(share.id)
    if (!counted && share.maxViews !== null && share.viewCount >= share.maxViews) {
      return { state: 'limit', share }
    }

    if (share.passwordHash) {
      const unlocked: string[] = session.get('share_unlocked', [])
      if (!unlocked.includes(share.id)) return { state: 'gate', share }
    }

    const studyIds = await service.studyIdsFor(share.id)
    if (studyIds.length === 0) return { state: 'unavailable', share }

    if (!counted && record) {
      // Atomic against the cap so concurrent first visits can't overshoot it.
      const { rowCount } = await db.rawQuery(
        `UPDATE share SET view_count = view_count + 1
         WHERE id = ? AND (max_views IS NULL OR view_count < max_views)`,
        [share.id]
      )
      if (!rowCount) return { state: 'limit', share }
      await db.table('share_view').insert({
        share_id: share.id,
        ip_address: request.ip(),
        user_agent: request.header('user-agent')?.slice(0, 512) ?? null,
      })
      session.put('share_viewed', [...viewed, share.id])
    }

    return { state: 'ok', share, studyIds }
  }

  async #cards(token: string, ids: string[]) {
    const [rows, cats] = await Promise.all([
      db
        .from('case_study as cs')
        .join('client as cl', 'cl.id', 'cs.client_id')
        .leftJoin('file as f', 'f.id', 'cs.hero_file_id')
        .whereIn('cs.id', ids)
        .select(
          'cs.id',
          'cs.slug',
          'cs.title',
          'cl.name as client',
          'f.id as file_id',
          'f.bucket',
          'f.storage_path',
          'f.visibility',
          db.raw(
            `(SELECT count(*)::int FROM case_study c2
               WHERE (c2.created_at, c2.id) <= (cs.created_at, cs.id)) AS seq`
          )
        ),
      db
        .from('case_study_work_category as x')
        .join('work_category as w', 'w.id', 'x.work_category_id')
        .whereIn('x.case_study_id', ids)
        .select('x.case_study_id', 'w.name')
        .orderBy('w.name'),
    ])

    const byStudy = new Map<string, string[]>()
    for (const c of cats as { case_study_id: string; name: string }[]) {
      byStudy.set(c.case_study_id, [...(byStudy.get(c.case_study_id) ?? []), c.name])
    }
    const byId = new Map((rows as Record<string, any>[]).map((r) => [r.id as string, r]))

    return ids.flatMap((id) => {
      const r = byId.get(id)
      if (!r) return []
      return [
        {
          slug: r.slug as string,
          title: r.title as string,
          client: r.client as string,
          folio: r.seq as number,
          categories: byStudy.get(id) ?? [],
          cover: portalFile(
            token,
            r.file_id
              ? {
                  id: r.file_id,
                  bucket: r.bucket,
                  storagePath: r.storage_path,
                  visibility: r.visibility,
                }
              : null
          ),
        },
      ]
    })
  }
}
