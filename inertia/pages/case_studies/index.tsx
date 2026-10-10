import { useEffect, useState } from 'react'
import { Link } from '@inertiajs/react'
import { Toggle } from '@base-ui/react/toggle'
import { ToggleGroup } from '@base-ui/react/toggle-group'
import { FolderOpen, LayoutGrid, Plus, Rows3 } from 'lucide-react'
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

type View = 'details' | 'grid'

const VIEW_KEY = 'case-studies-view'

const VIEWS = [
  { value: 'details', label: 'Details view', icon: Rows3 },
  { value: 'grid', label: 'Grid view', icon: LayoutGrid },
] as const

const studyHref = (s: StudyRow) =>
  s.status === 'draft' ? `/case-studies/${s.id}/edit` : `/case-studies/${s.id}`

function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <ToggleGroup
      value={[view]}
      onValueChange={(next) => {
        const value = next[0] as View | undefined
        if (value) onChange(value)
      }}
      aria-label="View"
      className="flex rounded-md border border-border p-0.5 max-md:hidden"
    >
      {VIEWS.map(({ value, label, icon: Icon }) => (
        <Toggle
          key={value}
          value={value}
          aria-label={label}
          className="flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground data-[pressed]:bg-secondary data-[pressed]:text-foreground"
        >
          <Icon size={16} strokeWidth={1.75} aria-hidden />
        </Toggle>
      ))}
    </ToggleGroup>
  )
}

function StudiesTable({ studies }: { studies: StudyRow[] }) {
  const th = 'h-10 px-4 text-left text-xs font-medium text-muted-foreground'
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface max-md:hidden">
      <table className="w-full min-w-[560px] border-collapse text-[13px]/[18px]">
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className={th}>
              Study
            </th>
            <th scope="col" className={th}>
              Client
            </th>
            <th scope="col" className={th}>
              Status
            </th>
            <th scope="col" className={th}>
              Updated
            </th>
          </tr>
        </thead>
        <tbody>
          {studies.map((s) => (
            <tr
              key={s.id}
              className="h-14 border-b border-border last:border-b-0 hover:bg-secondary/50"
            >
              <td className="px-4">
                <Link
                  href={studyHref(s)}
                  className="flex items-center gap-3 rounded-sm text-sm font-medium hover:underline"
                >
                  <span className="h-9 w-12 shrink-0 overflow-hidden rounded-sm bg-secondary">
                    {s.thumbnail && (
                      <img
                        src={s.thumbnail}
                        alt=""
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    )}
                  </span>
                  {s.title}
                </Link>
              </td>
              <td className="px-4 text-muted-foreground">{s.client}</td>
              <td className="px-4">
                <Badge tone={TONE[s.status]}>{LABEL[s.status]}</Badge>
              </td>
              <td className="px-4 font-mono text-xs text-muted-foreground">
                {dateFmt.format(new Date(s.updatedAt))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function CaseStudiesIndex({ status, studies }: IndexProps) {
  const [view, setView] = useState<View>('grid')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_KEY)
      if (saved === 'details' || saved === 'grid') setView(saved)
    } catch {}
  }, [])

  const changeView = (next: View) => {
    setView(next)
    try {
      localStorage.setItem(VIEW_KEY, next)
    } catch {}
  }

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
      <div className="mb-4 flex items-center justify-between gap-2">
        <nav aria-label="Filter by status" className="flex flex-wrap gap-1">
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
        {studies.length > 0 && <ViewToggle view={view} onChange={changeView} />}
      </div>

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
        <>
          {view === 'details' && <StudiesTable studies={studies} />}
          <ul
            className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 ${view === 'details' ? 'md:hidden' : ''}`}
          >
            {studies.map((s) => (
              <li key={s.id}>
                <Link
                  href={studyHref(s)}
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
        </>
      )}
    </Page>
  )
}

CaseStudiesIndex.layout = [AppLayout]
