import { type ReactNode } from 'react'
import { Link } from '@inertiajs/react'
import { ArrowRight, FileText, Image as ImageIcon, Link2, Pencil, Play, Quote } from 'lucide-react'
import { Badge, type Tone } from '~/components/badge'
import { Card, CardTitle } from '~/components/card'
import { CropFrame, Folio } from '~/components/decor'
import Page from '~/components/page'
import { fmtSize, parseContent, Prose } from '~/components/prose'
import { embedUrl } from '~/lib/embed'
import AppLayout from '~/layouts/app'

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type ShareState = 'active' | 'expiring' | 'expired' | 'limit'

type Study = {
  id: string
  folio: number
  title: string
  status: 'draft' | 'published' | 'archived'
  client: string
  content: string
  hero: string | null
  createdAt: string
  updatedAt: string
  updatedBy: string | null
  sectors: string[]
  industries: string[]
  keyBusinesses: string[]
  workCategories: string[]
  services: string[]
  businessModels: string[]
  metrics: { id: string; label: string; value: string }[]
  testimonials: { id: string; quote: string; authorName: string; authorTitle: string | null }[]
  videos: { id: string; url: string }[]
  gallery: { id: string; name: string; src: string | null }[]
  attachments: { id: string; name: string; size: number; href: string }[]
}

type ShareRow = { id: string; name: string; state: ShareState; expiresAt: string | null }

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const STUDY_STATUS: Record<Study['status'], { tone: Tone; label: string }> = {
  draft: { tone: 'warning', label: 'Draft' },
  published: { tone: 'success', label: 'Published' },
  archived: { tone: 'info', label: 'Archived' },
}

const SHARE_STATUS: Record<ShareState, { tone: Tone; label: string }> = {
  active: { tone: 'success', label: 'Active' },
  expiring: { tone: 'warning', label: 'Expiring' },
  expired: { tone: 'error', label: 'Expired' },
  limit: { tone: 'error', label: 'Limit reached' },
}

const secondaryBtn =
  'inline-flex h-9 items-center gap-2 rounded-md bg-secondary px-3 text-sm font-medium transition-colors hover:bg-secondary/70'
const primaryBtn =
  'inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90'

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="p-6">
      <CardTitle className="text-xl/7">{title}</CardTitle>
      <div className="mt-3">{children}</div>
    </Card>
  )
}

function Chips({ items, empty = '—' }: { items: string[]; empty?: string }) {
  if (!items.length) return <span className="text-muted-foreground">{empty}</span>
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <li
          key={i}
          className="inline-flex h-6 items-center rounded-full border border-border px-2 text-xs"
        >
          {i}
        </li>
      ))}
    </ul>
  )
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="mb-1 text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Sections                                                                    */
/* -------------------------------------------------------------------------- */

function Hero({ study }: { study: Study }) {
  const draft = study.status === 'draft'
  return (
    <CropFrame tick={16} dashed={draft}>
      {study.hero ? (
        <img
          src={study.hero}
          alt=""
          width={1280}
          height={720}
          fetchPriority="high"
          className="aspect-video w-full rounded-md object-cover"
        />
      ) : (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-md bg-surface-raised text-muted-foreground">
          <ImageIcon size={20} strokeWidth={1.75} aria-hidden />
          <p className="text-sm">No hero image yet</p>
        </div>
      )}
    </CropFrame>
  )
}

function Metrics({ items }: { items: Study['metrics'] }) {
  return (
    <Card className="p-6">
      <h2 className="sr-only">Results</h2>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-4">
        {items.map((m) => (
          <div key={m.id} className="flex min-w-0 flex-col-reverse">
            <dd className="truncate font-mono text-[32px]/10 font-medium">{m.value}</dd>
            <dt className="text-[13px]/[18px] text-muted-foreground">{m.label}</dt>
          </div>
        ))}
      </dl>
    </Card>
  )
}

function Gallery({ items }: { items: Study['gallery'] }) {
  return (
    <Section title="Gallery">
      <ul className="grid grid-cols-2 gap-0.5 overflow-hidden rounded-md bg-surface-raised p-0.5 md:grid-cols-3">
        {items.map((g, i) => (
          <li key={g.id}>
            {g.src ? (
              <img
                src={g.src}
                alt={g.name}
                width={640}
                height={480}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/3] w-full items-center justify-center bg-secondary text-muted-foreground">
                <ImageIcon size={20} strokeWidth={1.75} aria-hidden />
                <span className="sr-only">{g.name} (private)</span>
              </div>
            )}
            <span className="block py-1 text-center font-mono text-[10px] text-muted-foreground">
              {String(i + 1).padStart(2, '0')}
            </span>
          </li>
        ))}
      </ul>
    </Section>
  )
}

function Videos({ items }: { items: Study['videos'] }) {
  return (
    <Section title="Video">
      <ul className="flex flex-col gap-4">
        {items.map((v) => {
          const src = embedUrl(v.url)
          return (
            <li key={v.id}>
              {src ? (
                <iframe
                  src={src}
                  title="Case study video"
                  loading="lazy"
                  allow="fullscreen; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="aspect-video w-full rounded-md border border-border"
                />
              ) : (
                <a
                  href={v.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Play size={16} strokeWidth={1.75} aria-hidden /> Open video
                </a>
              )}
            </li>
          )
        })}
      </ul>
    </Section>
  )
}

function Testimonials({ items }: { items: Study['testimonials'] }) {
  return (
    <Section title="Testimonials">
      <div className="flex flex-col gap-4">
        {items.map((t) => (
          <figure key={t.id} className="rounded-md bg-surface-raised p-4">
            <Quote size={16} strokeWidth={1.75} className="text-accent" aria-hidden />
            <blockquote className="mt-2 max-w-[var(--prose)] text-sm/6">{t.quote}</blockquote>
            <figcaption className="mt-3 text-[13px]/[18px] text-muted-foreground">
              <span className="font-medium text-foreground">{t.authorName}</span>
              {t.authorTitle && <> · {t.authorTitle}</>}
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  )
}

function Attachments({ items }: { items: Study['attachments'] }) {
  return (
    <Section title="Files">
      <ul className="divide-y divide-border">
        {items.map((a) => (
          <li key={a.id} className="flex h-10 items-center gap-3 text-sm">
            <FileText
              size={16}
              strokeWidth={1.75}
              className="shrink-0 text-muted-foreground"
              aria-hidden
            />
            <a href={a.href} download className="min-w-0 flex-1 truncate hover:text-primary">
              {a.name}
            </a>
            <span className="font-mono text-xs text-muted-foreground">{fmtSize(a.size)}</span>
          </li>
        ))}
      </ul>
    </Section>
  )
}

function Classification({ study }: { study: Study }) {
  return (
    <Card className="p-4">
      <CardTitle>Classification</CardTitle>
      <dl className="mt-4 flex flex-col gap-4">
        <Fact label="Sector">
          <Chips items={study.sectors} />
        </Fact>
        <Fact label="Industry">
          <Chips items={study.industries} />
        </Fact>
        <Fact label="Key business">
          <Chips items={study.keyBusinesses} />
        </Fact>
        <Fact label="Work categories">
          <Chips items={study.workCategories} />
        </Fact>
        <Fact label="Services">
          <Chips items={study.services} />
        </Fact>
        <Fact label="Business model">
          <Chips items={study.businessModels} />
        </Fact>
      </dl>
      <p className="mt-5 border-t border-border pt-3 text-xs text-muted-foreground">
        Created {fmtDate(study.createdAt)} · Updated {fmtDate(study.updatedAt)}
        {study.updatedBy && <> by {study.updatedBy}</>}
      </p>
    </Card>
  )
}

function SharedIn({ shares }: { shares: ShareRow[] }) {
  return (
    <Card className="p-4">
      <CardTitle>Shared in</CardTitle>
      {shares.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Not in any share yet.</p>
      ) : (
        <ul className="mt-3 flex flex-col">
          {shares.map((s) => {
            const st = SHARE_STATUS[s.state]
            return (
              <li key={s.id}>
                <Link
                  href={`/shares/${s.id}`}
                  className="group -mx-2 flex min-h-10 items-center gap-2 rounded-md px-2 py-1 hover:bg-secondary"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{s.name}</span>
                  <Badge tone={st.tone}>{st.label}</Badge>
                  <ArrowRight
                    size={16}
                    strokeWidth={1.75}
                    className="shrink-0 text-muted-foreground group-hover:text-foreground"
                    aria-hidden
                  />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function CaseStudyShow({ study, shares }: { study: Study; shares: ShareRow[] }) {
  const { overview, sections } = parseContent(study.content)
  const s = STUDY_STATUS[study.status]

  return (
    <Page
      title={study.title}
      description={study.client}
      eyebrow={
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link href="/case-studies" className="rounded-sm hover:text-foreground">
            Case studies
          </Link>
          <span aria-hidden>/</span>
          <Folio n={study.folio} />
          <Badge tone={s.tone} className="ml-1">
            {s.label}
          </Badge>
        </span>
      }
      actions={
        <>
          <Link
            href={`/shares/new?caseStudy=${study.id}`}
            className={`${secondaryBtn} max-md:hidden`}
          >
            <Link2 size={16} strokeWidth={1.75} aria-hidden /> Add to new share
          </Link>
          <Link href={`/case-studies/${study.id}/edit`} className={primaryBtn}>
            <Pencil size={16} strokeWidth={1.75} aria-hidden /> Edit
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-8 pb-8 lg:grid lg:grid-cols-12 lg:items-start">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-8">
          <Hero study={study} />
          {study.metrics.length > 0 && <Metrics items={study.metrics} />}
          {overview && (
            <Section title="Overview">
              <Prose text={overview} />
            </Section>
          )}
          {sections.map((sec) => (
            <Section key={sec.heading} title={sec.heading}>
              <Prose text={sec.body} />
            </Section>
          ))}
          {!overview && sections.length === 0 && (
            <Section title="Story">
              <p className="text-sm text-muted-foreground">No written content yet.</p>
            </Section>
          )}
          {study.gallery.length > 0 && <Gallery items={study.gallery} />}
          {study.videos.length > 0 && <Videos items={study.videos} />}
          {study.testimonials.length > 0 && <Testimonials items={study.testimonials} />}
          {study.attachments.length > 0 && <Attachments items={study.attachments} />}
        </div>

        <aside className="flex min-w-0 flex-col gap-6 max-lg:order-first lg:sticky lg:top-6 lg:col-span-4">
          <Classification study={study} />
          <SharedIn shares={shares} />
        </aside>
      </div>
    </Page>
  )
}

CaseStudyShow.layout = [AppLayout]
