export type TaxonomyTab = 'hierarchy' | 'categories' | 'services' | 'models'

export type TaxonomyType =
  'sectors' | 'industries' | 'key_businesses' | 'work_categories' | 'services' | 'business_models'

export type Term = {
  id: string
  name: string
  slug: string
  count: number
}

export type ChildTerm = Term & { sectorId?: string | null; industryId?: string | null }

export type TaxonomiesProps = {
  tab: TaxonomyTab
  canEdit: boolean
  selectedSectorId: string | null
  selectedIndustryId: string | null
  sectors: Term[]
  industries: ChildTerm[]
  keyBusinesses: ChildTerm[]
  workCategories: Term[]
  services: Term[]
  businessModels: Term[]
}
