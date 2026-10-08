import type { ShareStatus } from '~/components/dashboard/types'

export type ShareRow = {
  id: string
  recipient: string
  company: string
  token: string
  tokenSuffix: string
  content: { kind: 'selected' | 'rule'; label: string }
  hasPassword: boolean
  expiresAt: string | null
  expiresRelative: string | null
  views: number
  maxViews: number | null
  status: ShareStatus
  createdAt: string
  createdRelative: string
  editable: boolean
  ownerName: string | null
}

export type SharesFilters = {
  q: string
  status: 'all' | ShareStatus
  page: number
  perPage: number
}

export type SharesCounts = {
  all: number
  active: number
  expiring: number
  expired: number
  limit: number
}

export type SharesMeta = {
  total: number
  from: number
  to: number
  page: number
  perPage: number
}

export type SharesProps = {
  filters: SharesFilters
  counts: SharesCounts
  rows: ShareRow[]
  meta: SharesMeta
}

export type BuilderMode = 'selected' | 'rule'

export type ShareBuilderShare = {
  id: string | null
  mode: BuilderMode
  selectedIds: string[]
  rule: {
    sectors: string[]
    industries: string[]
    keyBusinesses: string[]
    categories: string[]
    services: string[]
    clients: string[]
  }
  recipientName: string
  company: string
  email: string
  requirePassword: boolean
  passwordSet: boolean
  expiresAt: string | null
  maxViews: number | null
  link: string | null
  createdAt: string | null
  views: number
  expired: boolean
  expiredAt: string | null
}

export type BuilderOptions = {
  sectors: string[]
  industries: string[]
  keyBusinesses: string[]
  categories: string[]
  services: string[]
  clients: Array<{ id: string; name: string }>
  caseStudies: Array<{
    id: string
    title: string
    slug: string
    heroThumb: string | null
    clientName: string
    sector: string
    status: 'draft' | 'published' | 'archived'
  }>
}

export type ShareBuilderProps = {
  mode: 'new' | 'edit'
  share: ShareBuilderShare
  options: BuilderOptions
  matchPreview: { count: number; thumbs: Array<{ id: string; url: string | null }> }
  permissions: { editable: boolean; ownerName: string | null; canUseFilters?: boolean }
}

export type ShareDetailProps = {
  share: {
    id: string
    recipient: string
    company: string
    token: string
    tokenSuffix: string
    link: string
    status: ShareStatus
    hasPassword: boolean
    expiresAt: string | null
    expiresRelative: string | null
    maxViews: number | null
    createdAt: string
    createdRelative: string
    editable: boolean
    ownerName: string | null
  }
  kpis: {
    totalViews: number
    lastViewedAt: string | null
    lastViewedRelative: string
    viewsRemaining: string
    expiresIn: string
  }
  viewsSeries: { labels: string[]; values: number[]; total: number }
  visits: Array<{
    id: string
    viewedAt: string
    viewedRelative: string
    maskedIp: string
    device: string
  }>
}

export type PortalState = 'gate' | 'viewer' | 'expired' | 'limit' | 'unavailable' | 'locked'

export type PortalItem = {
  id: string
  slug: string
  title: string
  summary: string
  heroImage: string | null
  clientName: string
  sector: string
  industry: string
  keyBusiness: string
  services: string[]
  storyMarkdown: string
  metrics: Array<{ label: string; value: string; suffix: string }>
  videos: Array<{ url: string; provider: string }>
  gallery: Array<{ url: string; caption: string }>
  testimonial: { quote: string; name: string; role: string }
  attachments: Array<{ name: string; size: string; url: string }>
}

export type SharePortalProps = {
  state: PortalState
  token: string
  gate: {
    recipient: string | null
    attemptsRemaining: number | null
    lockedUntil: string | null
    lockCountdown: string | null
  } | null
  portal: {
    recipient: string | null
    company: string | null
    intro: string | null
    count: number
    sectors: string[]
    items: PortalItem[]
  } | null
}
