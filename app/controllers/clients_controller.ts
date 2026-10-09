import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import Client from '#models/client'
import File from '#models/file'
import { UUID, fileUrl } from '#services/file_urls'
import { clientValidator, quickClientValidator } from '#validators/client'

type Payload = Awaited<ReturnType<typeof clientValidator.validate>>

export default class ClientsController {
  /**
   * The whole library in one payload: it is small and bounded, so search and the
   * key-business chips are handled client-side. `keyBusinessOptions` feeds the
   * form's picker, grouped by sector › industry.
   */
  async index({ inertia }: HttpContext) {
    return inertia.render('clients/index', {
      clients: async () => {
        const clients = await Client.query()
          .apply((c) => c.live())
          .preload('logo')
          .preload('keyBusinesses', (q) => q.orderBy('name'))
          .orderBy('name')

        const { rows } = await db.rawQuery(
          `SELECT client_id AS id, count(*)::int AS n
           FROM case_study WHERE deleted_at IS NULL GROUP BY 1`
        )
        const studies = new Map<string, number>(
          rows.map((r: { id: string; n: number }) => [r.id, r.n])
        )

        return clients.map((c) => ({
          id: c.id,
          name: c.name,
          logo: fileUrl(c.logo),
          logoFileId: c.logoFileId,
          studies: studies.get(c.id) ?? 0,
          keyBusinesses: c.keyBusinesses.map((k) => ({ id: k.id, name: k.name })),
          updatedAt: c.updatedAt.toISO()!,
        }))
      },
      keyBusinessOptions: async () => {
        const { rows } = await db.rawQuery(
          `SELECT kb.id, kb.name, i.name AS industry, s.name AS sector
           FROM key_business kb
           JOIN industry i ON i.id = kb.industry_id
           JOIN sector s ON s.id = i.sector_id
           ORDER BY s.name, i.name, kb.name`
        )
        return rows as { id: string; name: string; industry: string; sector: string }[]
      },
    })
  }

  async store({ request, response, session, auth }: HttpContext) {
    const payload = await request.validateUsing(clientValidator)
    if (payload.logoFileId && !(await File.find(payload.logoFileId))) {
      return response.unprocessableEntity({ errors: [{ field: 'logoFileId' }] })
    }

    const client = await db.transaction(async (trx) => {
      const created = await Client.create(
        {
          name: payload.name,
          logoFileId: payload.logoFileId ?? null,
          createdBy: auth.user!.id,
        },
        { client: trx }
      )
      await this.#syncKeyBusinesses(created, payload, trx)
      return created
    })

    session.flash('success', `Client “${client.name}” added.`)
    return response.redirect().back()
  }

  /**
   * Inline create for the case-study editor. Returns JSON so the editor can select the new
   * client without leaving the page; an existing client with the same name is reused.
   */
  async quickStore({ request, auth }: HttpContext) {
    const { name } = await request.validateUsing(quickClientValidator)
    const existing = await Client.query()
      .apply((c) => c.live())
      .whereRaw('lower(name) = lower(?)', [name])
      .first()
    if (existing) return { id: existing.id, name: existing.name }

    const created = await Client.create({ name, createdBy: auth.user!.id })
    return { id: created.id, name: created.name }
  }

  async update({ params, request, response, session, auth }: HttpContext) {
    if (!UUID.test(params.id)) return response.notFound()
    const payload = await request.validateUsing(clientValidator)

    const client = await Client.query()
      .where('id', params.id)
      .apply((c) => c.live())
      .first()
    if (!client) return response.notFound()
    if (payload.logoFileId && !(await File.find(payload.logoFileId))) {
      return response.unprocessableEntity({ errors: [{ field: 'logoFileId' }] })
    }

    await db.transaction(async (trx) => {
      client.useTransaction(trx)
      client.merge({
        name: payload.name,
        // `undefined` keeps the current logo; an explicit null removes it.
        ...(payload.logoFileId !== undefined && { logoFileId: payload.logoFileId }),
        updatedBy: auth.user!.id,
      })
      await client.save()
      await this.#syncKeyBusinesses(client, payload, trx)
    })

    session.flash('success', `Client “${client.name}” saved.`)
    return response.redirect().back()
  }

  async #syncKeyBusinesses(client: Client, payload: Payload, trx: TransactionClientContract) {
    client.useTransaction(trx)
    await client.related('keyBusinesses').sync([...new Set(payload.keyBusinessIds)])
  }
}
