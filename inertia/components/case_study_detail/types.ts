export type DetailStatus = 'draft' | 'published' | 'archived'
export type ShareStatus = 'active' | 'expiring' | 'expired' | 'limit'

export type DetailGalleryItem = { key: string; url: string }
export type DetailVideo = { url: string; provider: 'youtube' | 'vimeo' | 'other' }
export type DetailMetric = { label: string; value: string; suffix: '%' | 'x' | '+' | '' }
export type DetailAttachment = { key: string; name: string; size: string; url: string }

export type SharedInShare = {
  id: string
  recipient: string
  company: string
  tokenSuffix: string
  status: ShareStatus
  views: string
  expiresAt: string | null
}

export type CaseStudyDetail = {
  id: string
  title: string
  slug: string
  summary: string
  status: DetailStatus
  heroImageUrl: string | null
  gallery: DetailGalleryItem[]
  storyMarkdown: string
  videos: DetailVideo[]
  metrics: DetailMetric[]
  testimonial: { quote: string; name: string; role: string }
  attachments: DetailAttachment[]
  client: { id: string; name: string; logoUrl: string | null }
  sector: string
  industry: string
  keyBusiness: string
  categories: string[]
  services: string[]
  businessModels: string[]
  ownerName: string
  ownerInitials: string
  department: string
  updatedAt: string | null
  updatedRelative: string
}

export type CaseStudyDetailProps = {
  caseStudy: CaseStudyDetail
  permissions: { editable: boolean; ownerName: string | null; ownerDepartment: string | null }
  sharedIn: SharedInShare[]
}
