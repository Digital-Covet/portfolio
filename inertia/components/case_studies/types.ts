export type CaseStatus = 'draft' | 'published' | 'archived'
export type CaseView = 'table' | 'grid'

export type CaseStudyFilters = {
  q: string
  status: 'all' | CaseStatus
  sector: string
  industry: string
  keyBusiness: string
  category: string
  service: string
  client: string
  owner: string
  sort: 'updated' | 'title'
  page: number
  perPage: number
  view: CaseView
}

export type CaseStudyRow = {
  id: string
  title: string
  slug: string
  heroThumb: string | null
  clientName: string
  clientLogo: string | null
  sector: string
  industry: string
  status: CaseStatus
  ownerName: string
  ownerInitials: string
  ownerDepartment: string
  editable: boolean
  updatedAt: string
  updatedRelative: string
}

export type CaseStudyCounts = {
  all: number
  published: number
  draft: number
  archived: number
}

export type CaseStudyMeta = {
  total: number
  from: number
  to: number
  page: number
  perPage: number
}

export type CaseStudyFilterOptions = {
  sectors: string[]
  industries: string[]
  keyBusinesses: string[]
  categories: string[]
  services: string[]
  clients: string[]
  owners: string[]
}

export type CaseStudiesProps = {
  filters: CaseStudyFilters
  counts: CaseStudyCounts
  rows: CaseStudyRow[]
  meta: CaseStudyMeta
  filterOptions: CaseStudyFilterOptions
}
