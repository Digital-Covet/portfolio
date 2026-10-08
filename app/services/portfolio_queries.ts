import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import type CaseStudy from '#models/case_study'
import Client from '#models/client'
import DirectoryUser from '#models/directory_user'

export type EnrichedCaseStudy = {
  id: string
  title: string
  slug: string
  status: 'draft' | 'published' | 'archived'
  heroThumb: string | null
  clientId: string | null
  clientName: string
  clientLogo: string | null
  sector: string
  sectorId: string | null
  industry: string
  industryId: string | null
  keyBusiness: string
  keyBusinessId: string | null
  categories: string[]
  services: string[]
  businessModels: string[]
  ownerName: string
  ownerInitials: string
  ownerDepartment: string
  updatedAt: string
  updatedRelative: string
  updatedMillis: number
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function relativeFromISO(iso: string): string {
  const dt = DateTime.fromISO(iso)
  if (!dt.isValid) return iso
  const rel = dt.toRelative({ base: DateTime.now() })
  return rel ?? iso
}

/**
 * Resolve taxonomy names for a batch of case-study ids via pivot tables.
 * Live schema has no direct sector FK on case_studies — sector/industry/key
 * business resolve through case_study_key_businesses → key_businesses →
 * industries → sectors.
 */
export async function taxonomyMaps(caseStudyIds: string[]) {
  const empty = {
    categoriesByCase: new Map<string, { id: string; name: string }[]>(),
    servicesByCase: new Map<string, { id: string; name: string }[]>(),
    modelsByCase: new Map<string, { id: string; name: string }[]>(),
    keyByCase: new Map<string, { id: string; name: string; industryId: string | null }[]>(),
  }
  if (caseStudyIds.length === 0) return empty

  const [catRows, svcRows, modelRows, keyRows] = await Promise.all([
    db
      .from('case_study_categories')
      .join('work_categories', 'work_categories.id', 'case_study_categories.category_id')
      .whereIn('case_study_categories.case_study_id', caseStudyIds)
      .select(
        'case_study_categories.case_study_id as caseStudyId',
        'work_categories.id as id',
        'work_categories.name as name'
      ),
    db
      .from('case_study_services')
      .join('services', 'services.id', 'case_study_services.service_id')
      .whereIn('case_study_services.case_study_id', caseStudyIds)
      .select(
        'case_study_services.case_study_id as caseStudyId',
        'services.id as id',
        'services.name as name'
      ),
    db
      .from('case_study_business_models')
      .join('business_models', 'business_models.id', 'case_study_business_models.business_model_id')
      .whereIn('case_study_business_models.case_study_id', caseStudyIds)
      .select(
        'case_study_business_models.case_study_id as caseStudyId',
        'business_models.id as id',
        'business_models.name as name'
      ),
    db
      .from('case_study_key_businesses')
      .join('key_businesses', 'key_businesses.id', 'case_study_key_businesses.key_business_id')
      .whereIn('case_study_key_businesses.case_study_id', caseStudyIds)
      .select(
        'case_study_key_businesses.case_study_id as caseStudyId',
        'key_businesses.id as id',
        'key_businesses.name as name',
        'key_businesses.industry_id as industryId'
      ),
  ])

  const push = (map: Map<string, any[]>, row: any) => {
    const list = map.get(row.caseStudyId) ?? []
    list.push(row)
    map.set(row.caseStudyId, list)
  }
  catRows.forEach((r) => push(empty.categoriesByCase, r))
  svcRows.forEach((r) => push(empty.servicesByCase, r))
  modelRows.forEach((r) => push(empty.modelsByCase, r))
  keyRows.forEach((r) => push(empty.keyByCase, r))
  return empty
}

async function industrySectorMaps(industryIds: string[]) {
  const industryName = new Map<string, string>()
  const industrySectorId = new Map<string, string | null>()
  const sectorName = new Map<string, string>()
  if (industryIds.length === 0) return { industryName, industrySectorId, sectorName }
  const industries = await db
    .from('industries')
    .whereIn('id', industryIds)
    .select('id', 'name', 'sector_id as sectorId')
  const sectorIds = [...new Set(industries.map((i) => i.sectorId).filter(Boolean))] as string[]
  if (sectorIds.length > 0) {
    const sectors = await db.from('sectors').whereIn('id', sectorIds).select('id', 'name')
    sectors.forEach((s) => sectorName.set(s.id, s.name))
  }
  industries.forEach((i) => {
    industryName.set(i.id, i.name)
    industrySectorId.set(i.id, i.sectorId ?? null)
  })
  return { industryName, industrySectorId, sectorName }
}

export async function enrichCaseStudies(rows: CaseStudy[]): Promise<EnrichedCaseStudy[]> {
  const ids = rows.map((r) => r.id)
  const clientIds = [...new Set(rows.map((r) => r.clientId).filter(Boolean))] as string[]
  const ownerIds = [...new Set(rows.map((r) => r.createdBy).filter(Boolean))] as string[]

  const [clients, owners, maps] = await Promise.all([
    clientIds.length > 0
      ? Client.query().whereIn('id', clientIds)
      : Promise.resolve([] as Client[]),
    ownerIds.length > 0
      ? DirectoryUser.query().whereIn('id', ownerIds)
      : Promise.resolve([] as DirectoryUser[]),
    taxonomyMaps(ids),
  ])

  const clientById = new Map(clients.map((c) => [c.id, c]))
  const ownerById = new Map(owners.map((o) => [o.id, o]))

  const industryIds = [
    ...new Set(
      [...maps.keyByCase.values()]
        .flat()
        .map((k) => k.industryId)
        .filter(Boolean)
    ),
  ] as string[]
  const { industryName, industrySectorId, sectorName } = await industrySectorMaps(industryIds)

  return rows.map((r) => {
    const client = r.clientId ? clientById.get(r.clientId) : undefined
    const owner = r.createdBy ? ownerById.get(r.createdBy) : undefined
    const ownerName = owner?.name ?? 'Studio'
    const keys = maps.keyByCase.get(r.id) ?? []
    const firstKey = keys[0]
    const indId = firstKey?.industryId ?? null
    const secId = indId ? (industrySectorId.get(indId) ?? null) : null
    const updatedISO = r.updatedAt ? r.updatedAt.toISO()! : new Date().toISOString()
    return {
      id: r.id,
      title: r.title,
      slug: r.slug,
      status: r.status,
      heroThumb: r.heroImageUrl,
      clientId: r.clientId,
      clientName: client?.name ?? '—',
      clientLogo: client?.logoUrl ?? null,
      sector: secId ? (sectorName.get(secId) ?? '') : '',
      sectorId: secId,
      industry: indId ? (industryName.get(indId) ?? '') : '',
      industryId: indId,
      keyBusiness: firstKey?.name ?? '',
      keyBusinessId: firstKey?.id ?? null,
      categories: (maps.categoriesByCase.get(r.id) ?? []).map((c) => c.name),
      services: (maps.servicesByCase.get(r.id) ?? []).map((s) => s.name),
      businessModels: (maps.modelsByCase.get(r.id) ?? []).map((m) => m.name),
      ownerName,
      ownerInitials: initials(ownerName),
      ownerDepartment: owner?.departmentId ?? 'Studio',
      updatedAt: updatedISO,
      updatedRelative: relativeFromISO(updatedISO),
      updatedMillis: r.updatedAt ? r.updatedAt.toMillis() : 0,
    }
  })
}

export function shareStatus(
  expiresAt: DateTime | null,
  maxViews: number | null,
  views: number
): 'active' | 'expiring' | 'expired' | 'limit' {
  const now = DateTime.now()
  if (expiresAt && expiresAt < now) return 'expired'
  if (maxViews !== null && views >= maxViews) return 'limit'
  if (expiresAt && expiresAt.diff(now, 'days').days <= 7) return 'expiring'
  return 'active'
}
