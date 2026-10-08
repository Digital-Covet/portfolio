export type ShareStatus = 'active' | 'expiring' | 'expired' | 'limit'
export type CaseStatus = 'draft' | 'published' | 'archived'

export type DashboardFilters = {
  range: '7' | '30' | '90'
  sector: string
}

export type DashboardStats = {
  published: number
  publishedDelta: number
  drafts: number
  activeShares: number
  expiringSoon: number
  views: number
}

export type ViewsSeries = {
  labels: string[]
  values: number[]
  total: number
}

export type TopShare = {
  id: string
  recipient: string
  company: string
  tokenSuffix: string
  views: number
  status: ShareStatus
}

export type SectorRow = {
  name: string
  count: number
}

export type RecentCaseStudy = {
  id: string
  title: string
  slug: string
  status: CaseStatus
  ownerName: string
  ownerInitials: string
  updatedAt: string
  updatedRelative: string
}

export type DashboardProps = {
  filters: DashboardFilters
  sectors: string[]
  stats: DashboardStats
  viewsSeries: ViewsSeries
  topShares: TopShare[]
  bySector: SectorRow[]
  recent: RecentCaseStudy[]
}
