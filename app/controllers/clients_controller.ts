import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { randomUUID } from 'node:crypto'
import Client from '#models/client'
import { clientValidator } from '#validators/client'

/**
 * Client records (admin+ only, enforced by admin middleware).
 * Key-business links are derived from the client's case studies via
 * case_study_key_businesses — displayed read-only, managed in case studies.
 */
export default class ClientsController {
  async index({ inertia }: HttpContext) {
    const clients = await Client.query().orderBy('name', 'asc')

    const countRows = await db
      .from('case_studies')
      .select('client_id')
      .count('* as count')
      .groupBy('client_id')
    const countByClient = new Map<string, number>(
      countRows.filter((r) => r.client_id).map((r) => [String(r.client_id), Number(r.count)])
    )

    let kbByClient = new Map<string, string[]>()
    try {
      const kbRows = await db
        .from('case_studies')
        .join(
          'case_study_key_businesses',
          'case_study_key_businesses.case_study_id',
          'case_studies.id'
        )
        .join('key_businesses', 'key_businesses.id', 'case_study_key_businesses.key_business_id')
        .whereNotNull('case_studies.client_id')
        .select('case_studies.client_id as client_id', 'key_businesses.name as name')
      const sets = new Map<string, Set<string>>()
      for (const row of kbRows) {
        const cid = String(row.client_id)
        if (!sets.has(cid)) sets.set(cid, new Set())
        sets.get(cid)!.add(String(row.name))
      }
      kbByClient = new Map(
        [...sets.entries()].map(([k, v]) => [k, [...v].sort((a, b) => a.localeCompare(b))])
      )
    } catch {
      kbByClient = new Map()
    }

    return inertia.render('clients', {
      clients: clients.map((c) => ({
        id: c.id,
        name: c.name,
        logoUrl: c.logoUrl,
        caseStudyCount: countByClient.get(c.id) ?? 0,
        keyBusinesses: kbByClient.get(c.id) ?? [],
      })),
    })
  }

  async store({ auth, request, response, session }: HttpContext) {
    const payload = await request.validateUsing(clientValidator)
    await Client.create({
      id: randomUUID(),
      name: payload.name.trim(),
      logoUrl: payload.logoUrl?.trim() || null,
      createdBy: (auth.user as unknown as { id?: string | number })?.id
        ? String((auth.user as unknown as { id: string | number }).id)
        : null,
    })
    session.flash('success', `Client “${payload.name.trim()}” added`)
    return response.redirect().back()
  }

  async update({ request, response, session, params }: HttpContext) {
    const payload = await request.validateUsing(clientValidator)
    const row = await Client.find(String(params.id ?? ''))
    if (!row) {
      session.flash('error', 'Client not found')
      return response.redirect().back()
    }
    row.merge({
      name: payload.name.trim(),
      logoUrl: payload.logoUrl?.trim() || null,
    })
    await row.save()
    session.flash('success', `Client “${row.name}” updated`)
    return response.redirect().back()
  }

  async destroy({ response, session, params }: HttpContext) {
    const id = String(params.id ?? '')
    const row = await Client.find(id)
    if (!row) {
      session.flash('error', 'Client not found')
      return response.redirect().back()
    }
    // Keep case studies; detach them from the deleted client.
    try {
      await db.from('case_studies').where('client_id', id).update({ client_id: null })
    } catch {
      // best-effort
    }
    const name = row.name
    await row.delete()
    session.flash('success', `Client “${name}” deleted`)
    return response.redirect().back()
  }
}
