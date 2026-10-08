import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { randomUUID } from 'node:crypto'
import Sector from '#models/sector'
import Industry from '#models/industry'
import KeyBusiness from '#models/key_business'
import WorkCategory from '#models/work_category'
import ServiceItem from '#models/service_item'
import BusinessModel from '#models/business_model'
import { taxonomyCreateValidator, taxonomyRenameValidator } from '#validators/taxonomy'
import { isAdminSession } from '#services/portfolio_auth'

const TABS = ['hierarchy', 'categories', 'services', 'models'] as const
type Tab = (typeof TABS)[number]

const TYPES = [
  'sectors',
  'industries',
  'key_businesses',
  'work_categories',
  'services',
  'business_models',
] as const
type TaxonomyType = (typeof TYPES)[number]

function canEdit(ctx: Pick<import('@adonisjs/core/http').HttpContext, 'session'>): boolean {
  return isAdminSession(ctx)
}

async function assertEditable(ctx: Pick<import('@adonisjs/core/http').HttpContext, 'session'>) {
  if (!canEdit(ctx)) {
    const error = new Error('Only admins can edit taxonomies') as Error & {
      status?: number
    }
    error.status = 403
    throw error
  }
}

function slugFor(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120) || 'term'
  )
}

/**
 * Taxonomy library backed by live Supabase tables.
 * Live tables use text ids and have no slug column — the `slug` prop sent to
 * the UI is derived from the name so the existing React contract keeps working.
 */
export default class TaxonomiesController {
  async index({ session, inertia, request }: HttpContext) {
    const rawTab = String(request.input('tab', 'hierarchy') ?? 'hierarchy')
    const tab: Tab = (TABS as readonly string[]).includes(rawTab) ? (rawTab as Tab) : 'hierarchy'

    const rawSector = request.input('sectorId', null)
    const rawIndustry = request.input('industryId', null)
    const sectorId = rawSector === null || rawSector === '' ? null : String(rawSector)
    const industryId = rawIndustry === null || rawIndustry === '' ? null : String(rawIndustry)

    const [sectors, industries, keyBusinesses, categories, services, models] = await Promise.all([
      Sector.query().orderBy('name', 'asc'),
      Industry.query().orderBy('name', 'asc'),
      KeyBusiness.query().orderBy('name', 'asc'),
      WorkCategory.query().orderBy('name', 'asc'),
      ServiceItem.query().orderBy('name', 'asc'),
      BusinessModel.query().orderBy('name', 'asc'),
    ])

    const validSector = sectors.some((s) => s.id === sectorId) ? sectorId : null
    const validIndustry = industries.some(
      (i) => i.id === industryId && (validSector === null || i.sectorId === validSector)
    )
      ? industryId
      : null

    const [sectorCounts, industryCounts, keyCounts, catCounts, svcCounts, modelCounts] =
      await Promise.all([
        db
          .from('case_study_key_businesses')
          .join('key_businesses', 'key_businesses.id', 'case_study_key_businesses.key_business_id')
          .join('industries', 'industries.id', 'key_businesses.industry_id')
          .groupBy('industries.sector_id')
          .select('industries.sector_id as id')
          .count('* as count'),
        db
          .from('case_study_key_businesses')
          .join('key_businesses', 'key_businesses.id', 'case_study_key_businesses.key_business_id')
          .groupBy('key_businesses.industry_id')
          .select('key_businesses.industry_id as id')
          .count('* as count'),
        db
          .from('case_study_key_businesses')
          .groupBy('key_business_id')
          .select('key_business_id as id')
          .count('* as count'),
        db
          .from('case_study_categories')
          .groupBy('category_id')
          .select('category_id as id')
          .count('* as count'),
        db
          .from('case_study_services')
          .groupBy('service_id')
          .select('service_id as id')
          .count('* as count'),
        db
          .from('case_study_business_models')
          .groupBy('business_model_id')
          .select('business_model_id as id')
          .count('* as count'),
      ])
    const toMap = (rows: any[]) =>
      new Map<string, number>(rows.map((r) => [String(r.id), Number(r.count)]))
    const sectorCount = toMap(sectorCounts)
    const industryCount = toMap(industryCounts)
    const keyCount = toMap(keyCounts)
    const catCount = toMap(catCounts)
    const svcCount = toMap(svcCounts)
    const modelCount = toMap(modelCounts)

    return inertia.render('taxonomies', {
      tab,
      canEdit: canEdit({ session }),
      selectedSectorId: validSector,
      selectedIndustryId: validIndustry,
      sectors: sectors.map((s) => ({
        id: s.id,
        name: s.name,
        slug: slugFor(s.name),
        count: sectorCount.get(s.id) ?? 0,
      })),
      industries: industries.map((i) => ({
        id: i.id,
        name: i.name,
        slug: slugFor(i.name),
        sectorId: i.sectorId,
        count: industryCount.get(i.id) ?? 0,
      })),
      keyBusinesses: keyBusinesses.map((k) => ({
        id: k.id,
        name: k.name,
        slug: slugFor(k.name),
        industryId: k.industryId,
        count: keyCount.get(k.id) ?? 0,
      })),
      workCategories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: slugFor(c.name),
        count: catCount.get(c.id) ?? 0,
      })),
      services: services.map((s) => ({
        id: s.id,
        name: s.name,
        slug: slugFor(s.name),
        count: svcCount.get(s.id) ?? 0,
      })),
      businessModels: models.map((m) => ({
        id: m.id,
        name: m.name,
        slug: slugFor(m.name),
        count: modelCount.get(m.id) ?? 0,
      })),
    })
  }

  async store({ session, params, request, response }: HttpContext) {
    await assertEditable({ session })
    const type = String(params.type ?? '') as TaxonomyType
    if (!(TYPES as readonly string[]).includes(type)) {
      session.flash('error', 'Unknown taxonomy type')
      return response.redirect().back()
    }
    const payload = await request.validateUsing(taxonomyCreateValidator)

    if (type === 'sectors') {
      await Sector.create({ id: randomUUID(), name: payload.name })
      session.flash('success', `Sector “${payload.name}” added`)
    } else if (type === 'industries') {
      if (!payload.sectorId || !(await Sector.find(payload.sectorId))) {
        session.flash('error', 'Choose a sector first')
        return response.redirect().back()
      }
      await Industry.create({
        id: randomUUID(),
        name: payload.name,
        sectorId: String(payload.sectorId),
      })
      session.flash('success', `Industry “${payload.name}” added`)
    } else if (type === 'key_businesses') {
      if (!payload.industryId || !(await Industry.find(payload.industryId))) {
        session.flash('error', 'Choose an industry first')
        return response.redirect().back()
      }
      await KeyBusiness.create({
        id: randomUUID(),
        name: payload.name,
        industryId: String(payload.industryId),
      })
      session.flash('success', `Key business “${payload.name}” added`)
    } else if (type === 'work_categories') {
      await WorkCategory.create({ id: randomUUID(), name: payload.name })
      session.flash('success', `Category “${payload.name}” added`)
    } else if (type === 'services') {
      await ServiceItem.create({ id: randomUUID(), name: payload.name })
      session.flash('success', `Service “${payload.name}” added`)
    } else {
      await BusinessModel.create({ id: randomUUID(), name: payload.name })
      session.flash('success', `Business model “${payload.name}” added`)
    }
    return response.redirect().back()
  }

  async update({ session, params, request, response }: HttpContext) {
    await assertEditable({ session })
    const type = String(params.type ?? '') as TaxonomyType
    const id = String(params.id ?? '')
    const payload = await request.validateUsing(taxonomyRenameValidator)

    const rename = async (
      find: () => Promise<{ name: string; save: () => Promise<unknown> } | null>
    ) => {
      const row = await find()
      if (!row) {
        session.flash('error', 'Term not found')
        return response.redirect().back()
      }
      row.name = payload.name
      await row.save()
      session.flash('success', `Renamed to “${payload.name}”`)
      return response.redirect().back()
    }

    if (type === 'sectors') return rename(() => Sector.find(id))
    if (type === 'industries') return rename(() => Industry.find(id))
    if (type === 'key_businesses') return rename(() => KeyBusiness.find(id))
    if (type === 'work_categories') return rename(() => WorkCategory.find(id))
    if (type === 'services') return rename(() => ServiceItem.find(id))
    if (type === 'business_models') return rename(() => BusinessModel.find(id))
    session.flash('error', 'Unknown taxonomy type')
    return response.redirect().back()
  }

  async destroy({ session, params, response }: HttpContext) {
    await assertEditable({ session })
    const type = String(params.type ?? '') as TaxonomyType
    const id = String(params.id ?? '')

    const remove = async (
      find: () => Promise<{ name: string; delete: () => Promise<void> } | null>
    ) => {
      const row = await find()
      if (!row) {
        session.flash('error', 'Term not found')
        return response.redirect().back()
      }
      const name = row.name
      await row.delete()
      session.flash('success', `Deleted “${name}”`)
      return response.redirect().back()
    }

    if (type === 'sectors') return remove(() => Sector.find(id))
    if (type === 'industries') return remove(() => Industry.find(id))
    if (type === 'key_businesses') return remove(() => KeyBusiness.find(id))
    if (type === 'work_categories') return remove(() => WorkCategory.find(id))
    if (type === 'services') return remove(() => ServiceItem.find(id))
    if (type === 'business_models') return remove(() => BusinessModel.find(id))
    session.flash('error', 'Unknown taxonomy type')
    return response.redirect().back()
  }
}
