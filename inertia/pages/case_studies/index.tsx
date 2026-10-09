import { Link } from '@inertiajs/react'
import { FolderOpen, Plus } from 'lucide-react'
import { Badge, type Tone } from '~/components/badge'
import Page from '~/components/page'
import AppLayout from '~/layouts/app'

type Status = 'draft' | 'published' | 'archived'

type StudyRow = {
  id: string
  title: string
  status: Status
  client: string
  thumbnail: string | null
  updatedAt: string
}

/** Mirrors the props sent by app/controllers/case_studies_controller.ts (index). */
type IndexProps = {
  status: Status | null
  studies: StudyRow[]
}

const TABS: { label: string; value: Status | null }[] = [
  { label: 'Active', value: null },
  { label: 'Drafts', value: 'draft' },
  { label: 'Published', value: 'published' },
  { label: 'Archived', value: 'archived' },
]

const TONE: Record<Status, Tone> = { draft: 'warning', published: 'success', archived: 'neutral' }
const LABEL: Record<Status, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
}

const primaryBtn =
  'inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90'

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export default function CaseStudiesIndex({ status, studies }: IndexProps) {
  return (
    <Page
      title="Case studies"
      wide
      actions={
        <Link href="/case-studies/new" className={primaryBtn}>
          <Plus size={16} strokeWidth={1.75} aria-hidden />
          New case study
        </Link>
      }
    >
      <nav aria-label="Filter by status" className="mb-4 flex flex-wrap gap-1">
        {TABS.map((t) => {
          const active = t.value === status
          return (
            <Link
              key={t.label}
              href={t.value ? `/case-studies?status=${t.value}` : '/case-studies'}
              aria-current={active ? 'page' : undefined}
              className={`inline-flex h-8 items-center rounded-md px-3 text-sm font-medium transition-colors ${
                active
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </Link>
          )
        })}
      </nav>

      {studies.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface px-6 py-16 text-center">
          <FolderOpen size={20} strokeWidth={1.75} className="text-muted-foreground" aria-hidden />
          <h2 className="font-display text-xl/7 font-semibold">No case studies here</h2>
          <Link href="/case-studies/new" className={primaryBtn}>
            <Plus size={16} strokeWidth={1.75} aria-hidden />
            New case study
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {studies.map((s) => (
            <li key={s.id}>
              <Link
                href={s.status === 'draft' ? `/case-studies/${s.id}/edit` : `/case-studies/${s.id}`}
                className="group block overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-border-strong"
              >
                <div className="aspect-[4/3] bg-secondary">
                  {s.thumbnail && (
                    <img
                      src={s.thumbnail}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  )}
                </div>
                <div className="flex flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-display text-base/6 font-semibold">{s.title}</h2>
                    <Badge tone={TONE[s.status]}>{LABEL[s.status]}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {s.client} · Updated {dateFmt.format(new Date(s.updatedAt))}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Page>
  )
}

CaseStudiesIndex.layout = [AppLayout]
