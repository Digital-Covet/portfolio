export type EditorStatus = 'draft' | 'published' | 'archived'
export type EditorMode = 'new' | 'edit'

export type GalleryItem = { key: string; url: string; uploading?: boolean; failed?: boolean }
export type VideoItem = { url: string; provider: 'youtube' | 'vimeo' | 'other' }
export type MetricItem = { label: string; value: string; suffix: '%' | 'x' | '+' | '' }
export type AttachmentItem = { key: string; name: string; size: string; url: string }

export type EditorForm = {
  title: string
  slug: string
  summary: string
  heroImageKey: string | null
  heroImageUrl: string | null
  gallery: GalleryItem[]
  storyMarkdown: string
  videos: VideoItem[]
  metrics: MetricItem[]
  testimonialQuote: string
  testimonialName: string
  testimonialRole: string
  attachments: AttachmentItem[]
  clientId: string
  sector: string
  industry: string
  keyBusiness: string
  categories: string[]
  services: string[]
  businessModels: string[]
}

export type EditorOptions = {
  sectors: string[]
  industries: string[]
  keyBusinesses: string[]
  categories: string[]
  services: string[]
  businessModels: string[]
  clients: Array<{ id: string; name: string; logoUrl: string | null }>
}

export type CaseStudyEditorProps = {
  mode: EditorMode
  caseStudy: {
    id: string | null
    status: EditorStatus
    updatedAt: string | null
    updatedRelative: string
    form: EditorForm
  }
  options: EditorOptions
  ownership: { ownerName: string; ownerInitials: string; department: string }
  permissions: { editable: boolean; ownerName: string | null; ownerDepartment: string | null }
}

export type SaveState = 'saved' | 'dirty' | 'saving' | 'error'

export const REQUIRED_LABELS: Array<{ key: string; label: string }> = [
  { key: 'title', label: 'Title' },
  { key: 'summary', label: 'Summary' },
  { key: 'heroImageKey', label: 'Hero image' },
  { key: 'clientId', label: 'Client' },
  { key: 'sector', label: 'Sector' },
]

export function missingRequired(form: EditorForm): string[] {
  const missing: string[] = []
  if (!form.title.trim()) missing.push('Title')
  if (!form.summary.trim()) missing.push('Summary')
  if (!form.heroImageKey) missing.push('Hero image')
  if (!form.clientId) missing.push('Client')
  if (!form.sector) missing.push('Sector')
  return missing
}

export function detectProvider(url: string): VideoItem['provider'] {
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube'
  if (/vimeo\.com/i.test(url)) return 'vimeo'
  return 'other'
}
