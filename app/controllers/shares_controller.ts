import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Share from '#models/share'
import { SHARE_STATE_SQL } from '#services/dashboard_service'
import { UUID } from '#services/file_urls'
import ShareService, {
  generateToken,
  parseAgent,
  parseRules,
  RULE_TABLES,
  type Rule,
} from '#services/share_service'
import { RULE_FIELDS, shareValidator } from '#validators/share'

type Payload = Awaited<ReturnType<typeof shareValidator.validate>>

const service = new ShareService()

const VISITS_PER_PAGE = 10

/** The six targeting junctions, as relation names on the Share model. */
const RELATIONS = {
  sector: 'sectors',
  industry: 'industries',
  keyBusiness: 'keyBusinesses',
  workCategory: 'workCategories',
  service: 'services',
  client: 'clients',
} as const

/** A date-only expiry means "through the end of that day", UTC like the rest of the app. */
function endOfDay(date: string) {
  return DateTime.fromISO(date, { zone: 'utc' }).endOf('day')
}

export default class SharesController {
  /** Lifecycle control room: every live share with its derived state. */
  async index({ inertia, request }: HttpContext) {
    return inertia.render('shares/index', {
      shares: async () => {
        const { rows } = await db.rawQuery(
          `SELECT s.id, s.name, s.token, s.expires_at, s.max_views, s.view_count,
                  s.password_hash IS NOT NULL AS protected,
                  ${SHARE_STATE_SQL} AS state,
                  coalesce(u.name, u.email) AS owner,
                  (SELECT count(*)::int FROM share_case_study x WHERE x.share_id = s.id) AS pinned,
                  ${Object.values(RULE_TABLES)
                    .map((t) => `(SELECT count(*)::int FROM ${t.table} x WHERE x.share_id = s.id)`)
                    .join(' + ')} AS conditions
           FROM share s
           JOIN app_user u ON u.id = s.created_by
           WHERE s.deleted_at IS NULL
           ORDER BY s.created_at DESC`
        )
        return rows.map((r: Record<string, any>) => ({
          id: r.id as string,
          name: r.name as string,
          token: r.token as string,
          state: r.state as 'active' | 'expiring' | 'expired' | 'limit',
          protected: r.protected as boolean,
          type: r.conditions > 0 ? ('rule' as const) : ('pinned' as const),
          studies: r.pinned as number,
          views: r.view_count as number,
          maxViews: r.max_views as number | null,
          expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : null,
          owner: r.owner as string,
        }))
      },
      // Set by `store` after a redirect so the list can open the "Link ready" dialog.
      created: async () => {
        const id = request.input('created')
        if (typeof id !== 'string' || !UUID.test(id)) return null
        const share = await Share.query()
          .where('id', id)
          .apply((s) => s.live())
          .first()
        return share
          ? { id: share.id, name: share.name, token: share.token, protected: !!share.passwordHash }
          : null
      },
    })
  }

  /** Engagement and controls for one share: access summary, visits, devices and contents. */
  async show({ inertia, params, request, response }: HttpContext) {
    if (!UUID.test(params.id)) return response.notFound()
    const share = await this.#find(params.id, true)
    if (!share) return response.notFound()

    const page = Math.max(1, Number.parseInt(request.input('page', '1'), 10) || 1)
    const rules = RULE_FIELDS.map((field) => ({
      field,
      ids: share[RELATIONS[field]].map((r) => r.id),
    })).filter((r) => r.ids.length > 0)

    return inertia.render('shares/show', {
      share: async () => {
        const { rows } = await db.rawQuery(
          `SELECT ${SHARE_STATE_SQL} AS state, coalesce(u.name, u.email) AS owner
           FROM share s JOIN app_user u ON u.id = s.created_by WHERE s.id = ?`,
          [share.id]
        )
        return {
          id: share.id,
          name: share.name,
          token: share.token,
          state: rows[0].state as 'active' | 'expiring' | 'expired' | 'limit',
          protected: !!share.passwordHash,
          expiresAt: share.expiresAt ? share.expiresAt.toUTC().toISO() : null,
          maxViews: share.maxViews,
          viewCount: share.viewCount,
          owner: rows[0].owner as string,
          createdAt: share.createdAt.toISO()!,
        }
      },
      stats: async () => {
        const { rows } = await db.rawQuery(
          `SELECT count(*)::int AS views,
                  count(DISTINCT ip_address)::int AS visitors,
                  max(viewed_at) AS last_visit
           FROM share_view WHERE share_id = ?`,
          [share.id]
        )
        const r = rows[0]
        return {
          views: r.views as number,
          visitors: r.visitors as number,
          lastVisit: r.last_visit ? new Date(r.last_visit).toISOString() : null,
        }
      },
      series: () => service.series(share.id, 30),
      devices: async () => {
        const { rows } = await db.rawQuery(
          `SELECT user_agent, count(*)::int AS n FROM share_view WHERE share_id = ? GROUP BY 1`,
          [share.id]
        )
        const totals: Record<string, number> = { Desktop: 0, Mobile: 0, Tablet: 0 }
        for (const r of rows) totals[parseAgent(r.user_agent).device] += r.n
        return Object.entries(totals).map(([device, count]) => ({ device, count }))
      },
      visits: async () => {
        const [rows, total] = await Promise.all([
          db
            .from('share_view')
            .where('share_id', share.id)
            .orderBy('viewed_at', 'desc')
            .limit(VISITS_PER_PAGE)
            .offset((page - 1) * VISITS_PER_PAGE)
            .select('id', 'viewed_at', 'user_agent'),
          db.from('share_view').where('share_id', share.id).count('* as n'),
        ])
        return {
          page,
          perPage: VISITS_PER_PAGE,
          total: Number(total[0].n),
          rows: rows.map((r: { id: string; viewed_at: Date; user_agent: string | null }) => ({
            id: r.id,
            at: new Date(r.viewed_at).toISOString(),
            ...parseAgent(r.user_agent),
          })),
        }
      },
      contents: async () =>
        rules.length > 0
          ? {
              kind: 'rule' as const,
              rules: await service.ruleNames(rules),
              ...(await service.matchPreview(rules)),
            }
          : {
              kind: 'pinned' as const,
              items: await service.studiesByIds(share.caseStudies.map((c) => c.id)),
            },
    })
  }

  /** Pushes the expiry out by a week from whichever is later: the current expiry or now. */
  async extend({ params, response, session, auth }: HttpContext) {
    if (!UUID.test(params.id)) return response.notFound()
    const share = await this.#find(params.id)
    if (!share) return response.notFound()

    const base =
      share.expiresAt && share.expiresAt > DateTime.now() ? share.expiresAt : DateTime.now()
    share.merge({
      expiresAt: base.toUTC().plus({ days: 7 }).endOf('day'),
      updatedBy: auth.user!.id,
    })
    await share.save()

    session.flash('success', `Extended “${share.name}” by 7 days.`)
    return response.redirect().back()
  }

  async create({ inertia, request }: HttpContext) {
    return inertia.render('shares/form', {
      share: null,
      options: () => this.#options(),
      matchPreview: () => service.matchPreview(parseRules(request.input('rules'))),
    })
  }

  async edit({ inertia, params, request, response }: HttpContext) {
    if (!UUID.test(params.id)) return response.notFound()
    const share = await this.#find(params.id, true)
    if (!share) return response.notFound()

    const rules = RULE_FIELDS.map((field) => ({
      field,
      ids: share[RELATIONS[field]].map((r) => r.id),
    })).filter((r) => r.ids.length > 0)

    return inertia.render('shares/form', {
      share: {
        id: share.id,
        name: share.name,
        token: share.token,
        mode: rules.length > 0 ? 'rule' : 'pick',
        caseStudyIds: share.caseStudies.map((c) => c.id),
        rules,
        protected: !!share.passwordHash,
        expiresAt: share.expiresAt ? share.expiresAt.toUTC().toISODate() : null,
        expired: !!share.expiresAt && share.expiresAt <= DateTime.now(),
        maxViews: share.maxViews,
        viewCount: share.viewCount,
      },
      options: () => this.#options(),
      matchPreview: () =>
        service.matchPreview(request.input('rules') ? parseRules(request.input('rules')) : rules),
    })
  }

  async store({ request, response, session, auth }: HttpContext) {
    const payload = await request.validateUsing(shareValidator)
    const failed = await this.#check(payload, null)
    if (failed) {
      session.flash('inputErrorsBag', failed)
      return response.redirect().back()
    }

    const share = await db.transaction(async (trx) => {
      const row = new Share()
      row.useTransaction(trx)
      row.merge({
        name: payload.name,
        token: generateToken(),
        passwordHash: payload.passwordAction === 'set' ? await hash.make(payload.password!) : null,
        expiresAt: payload.expiresAt ? endOfDay(payload.expiresAt) : null,
        maxViews: payload.maxViews ?? null,
        createdBy: auth.user!.id,
        updatedBy: auth.user!.id,
      })
      await row.save()
      await this.#syncTargets(row, payload)
      return row
    })

    session.flash('success', `Share “${share.name}” created.`)
    return response.redirect().toPath(`/shares?created=${share.id}`)
  }

  async update({ params, request, response, session, auth }: HttpContext) {
    if (!UUID.test(params.id)) return response.notFound()
    const share = await this.#find(params.id)
    if (!share) return response.notFound()

    const payload = await request.validateUsing(shareValidator)
    const failed = await this.#check(payload, share)
    if (failed) {
      session.flash('inputErrorsBag', failed)
      return response.redirect().back()
    }

    await db.transaction(async (trx) => {
      share.useTransaction(trx)
      share.merge({
        name: payload.name,
        expiresAt: payload.expiresAt ? endOfDay(payload.expiresAt) : null,
        maxViews: payload.maxViews ?? null,
        updatedBy: auth.user!.id,
        ...(payload.passwordAction === 'set' && {
          passwordHash: await hash.make(payload.password!),
        }),
        ...(payload.passwordAction === 'remove' && { passwordHash: null }),
      })
      await share.save()
      await this.#syncTargets(share, payload)
    })

    session.flash('success', `Share “${share.name}” saved.`)
    return response.redirect().toPath('/shares')
  }

  /** Revoking soft-deletes the share, which is what makes the public token stop resolving. */
  async destroy({ params, response, session, auth }: HttpContext) {
    if (!UUID.test(params.id)) return response.notFound()
    const share = await this.#find(params.id)
    if (!share) return response.notFound()

    share.merge({ deletedAt: DateTime.now(), updatedBy: auth.user!.id })
    await share.save()

    session.flash('success', `Link “${share.name}” revoked.`)
    // Not `back()`: when revoked from the detail page that URL no longer exists.
    return response.redirect().toPath('/shares')
  }

  /* ------------------------------------------------------------------------ */

  async #find(id: string, withTargets = false) {
    const q = Share.query()
      .where('id', id)
      .apply((s) => s.live())
    if (withTargets) {
      for (const relation of ['caseStudies', ...Object.values(RELATIONS)] as const) {
        q.preload(relation, (r) => r.select('id'))
      }
    }
    return q.first()
  }

  /**
   * Checks the parts the validator cannot: that the selection is non-empty, still exists
   * and is published, that the date is in the future, and that a password was supplied.
   * Returns field errors, or null when the payload is good.
   */
  async #check(p: Payload, existing: Share | null): Promise<Record<string, string> | null> {
    const errors: Record<string, string> = {}

    if (p.mode === 'pick') {
      const ids = [...new Set(p.caseStudyIds)]
      if (!ids.length) errors.caseStudyIds = 'Select at least one case study.'
      else if ((await service.publishedCount(ids)) !== ids.length) {
        errors.caseStudyIds = 'A selected case study is no longer published. Reload and try again.'
      }
    } else {
      if (!p.rules.length) errors.rules = 'Add at least one condition.'
      else {
        for (const rule of p.rules) {
          const ids = [...new Set(rule.ids)]
          if ((await service.existingCount(rule.field, ids)) !== ids.length) {
            errors.rules = 'A selected value no longer exists. Reload and try again.'
          }
        }
        if (!errors.rules && (await service.matchCount(p.rules as Rule[])) === 0) {
          errors.rules = 'No published case study matches these conditions yet.'
        }
      }
    }

    if (p.passwordAction === 'set' && !p.password) errors.password = 'Enter a password.'
    if (p.passwordAction === 'keep' && !existing?.passwordHash) {
      errors.password = 'Enter a password.'
    }

    if (p.expiresAt) {
      const end = endOfDay(p.expiresAt)
      if (!end.isValid) errors.expiresAt = 'Choose a valid date.'
      else if (end <= DateTime.now()) errors.expiresAt = 'Choose a date in the future.'
    }

    return Object.keys(errors).length ? errors : null
  }

  /** One mode wins: switching from a live rule to a pinned list clears the rule, and vice versa. */
  async #syncTargets(share: Share, p: Payload) {
    const pinned = p.mode === 'pick' ? [...new Set(p.caseStudyIds)] : []
    await share.related('caseStudies').sync(pinned)

    for (const field of RULE_FIELDS) {
      const ids =
        p.mode === 'rule' ? [...new Set(p.rules.find((r) => r.field === field)?.ids ?? [])] : []
      await share.related(RELATIONS[field]).sync(ids)
    }
  }

  async #options() {
    const [sectors, industries, keyBusinesses, workCategories, services, clients] =
      await Promise.all([
        db.rawQuery('SELECT id, name FROM sector ORDER BY name'),
        db.rawQuery(
          `SELECT i.id, s.name || ' › ' || i.name AS name
           FROM industry i JOIN sector s ON s.id = i.sector_id ORDER BY s.name, i.name`
        ),
        db.rawQuery(
          `SELECT kb.id, i.name || ' › ' || kb.name AS name
           FROM key_business kb JOIN industry i ON i.id = kb.industry_id ORDER BY i.name, kb.name`
        ),
        db.rawQuery('SELECT id, name FROM work_category ORDER BY name'),
        db.rawQuery('SELECT id, name FROM service ORDER BY name'),
        db.rawQuery('SELECT id, name FROM client WHERE deleted_at IS NULL ORDER BY name'),
      ])
    const rows = (r: { rows: { id: string; name: string }[] }) => r.rows

    return {
      studies: await service.publishedStudies(),
      rule: {
        sector: rows(sectors),
        industry: rows(industries),
        keyBusiness: rows(keyBusinesses),
        workCategory: rows(workCategories),
        service: rows(services),
        client: rows(clients),
      },
    }
  }
}
