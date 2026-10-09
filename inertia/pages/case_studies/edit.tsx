import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, router, usePage } from '@inertiajs/react'
import { AlertDialog } from '@base-ui/react/alert-dialog'
import { Menu } from '@base-ui/react/menu'
import {
  Archive,
  ArrowLeft,
  Circle,
  Copy,
  CircleCheck,
  FileText,
  ImagePlus,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  MoreHorizontal,
  Plus,
  Quote,
  Save,
  Send,
  Tags,
  Trash2,
  Type,
  Video,
  Eye,
  Paperclip,
  BarChart3,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge, type Tone } from '~/components/badge'
import { Card, CardTitle } from '~/components/card'
import { CropFrame, Folio } from '~/components/decor'
import { Dropzone } from '~/components/dropzone'
import { MultiSelect, type Option } from '~/components/multi_select'
import Page from '~/components/page'
import { SortableGallery } from '~/components/sortable_gallery'
import AppLayout from '~/layouts/app'
import { embedUrl } from '~/lib/embed'
import { postJson } from '~/lib/upload'

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type Img = { id: string; name: string; url: string }
type Attachment = { id: string; name: string; size: number }
type Metric = { label: string; value: string }
type Testimonial = { quote: string; authorName: string; authorTitle: string }

type Sector = {
  id: string
  name: string
  industries: { id: string; name: string; keyBusinesses: Option[] }[]
}

type Options = {
  clients: Option[]
  sectors: Sector[]
  workCategories: Option[]
  services: Option[]
  businessModels: Option[]
}

type Status = 'draft' | 'published' | 'archived'

type StudyProp = {
  id: string
  folio: number
  status: Status
  updatedAt: string
  title: string
  clientId: string
  overview: string
  challenge: string
  solution: string
  results: string
  extra: string
  hero: Img | null
  gallery: Img[]
  attachments: Attachment[]
  videoUrls: string[]
  metrics: Metric[]
  testimonials: Testimonial[]
  keyBusinessIds: string[]
  workCategoryIds: string[]
  serviceIds: string[]
  businessModelIds: string[]
} | null

type Form = {
  title: string
  clientId: string
  overview: string
  challenge: string
  solution: string
  results: string
  extra: string
  hero: Img | null
  gallery: Img[]
  attachments: Attachment[]
  videoUrls: string[]
  metrics: Metric[]
  testimonials: Testimonial[]
  keyBusinessIds: string[]
  workCategoryIds: string[]
  serviceIds: string[]
  businessModelIds: string[]
}

type Intent = 'save' | 'autosave' | 'publish' | 'restore'
type SaveState = 'idle' | 'dirty' | 'saving' | 'saved'

const EMPTY: Form = {
  title: '',
  clientId: '',
  overview: '',
  challenge: '',
  solution: '',
  results: '',
  extra: '',
  hero: null,
  gallery: [],
  attachments: [],
  videoUrls: [],
  metrics: [],
  testimonials: [],
  keyBusinessIds: [],
  workCategoryIds: [],
  serviceIds: [],
  businessModelIds: [],
}

const STATUS: Record<Status, { tone: Tone; label: string }> = {
  draft: { tone: 'warning', label: 'Draft' },
  published: { tone: 'success', label: 'Published' },
  archived: { tone: 'info', label: 'Archived' },
}

const SECTIONS = [
  { id: 'basics', label: 'Basics', icon: Type },
  { id: 'hero', label: 'Hero', icon: ImageIcon },
  { id: 'story', label: 'Story', icon: FileText },
  { id: 'gallery', label: 'Gallery', icon: LayoutGrid },
  { id: 'media', label: 'Media', icon: Video },
  { id: 'proof', label: 'Proof', icon: BarChart3 },
  { id: 'files', label: 'Files', icon: Paperclip },
] as const

const AUTOSAVE_MS = 3000

/* -------------------------------------------------------------------------- */
/* Styles & small pieces                                                       */
/* -------------------------------------------------------------------------- */

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary'
const inputCls = `h-9 w-full rounded-md border border-border-strong bg-surface px-3 text-sm placeholder:text-muted-foreground ${focusRing}`
const textareaCls = `w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm/6 placeholder:text-muted-foreground ${focusRing}`
const primaryBtn = `inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`
const secondaryBtn = `inline-flex h-9 items-center justify-center gap-2 rounded-md bg-secondary px-3 text-sm font-medium transition-colors hover:bg-secondary/70 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`
const ghostBtn = `inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[13px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground ${focusRing}`

function FieldShell({
  label,
  htmlFor,
  error,
  hint,
  children,
  counter,
}: {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  counter?: ReactNode
  children: ReactNode
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-[13px]/[18px] font-medium">
          {label}
        </label>
        {counter}
      </div>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p id={`${htmlFor}-error`} data-field-error className="mt-1.5 text-xs text-error">
          {error}
        </p>
      )}
    </div>
  )
}

function SectionCard({
  id,
  title,
  icon: Icon,
  description,
  children,
}: {
  id: string
  title: string
  icon: typeof Type
  description?: string
  children: ReactNode
}) {
  return (
    <Card id={id} className="scroll-mt-28 p-6">
      <h2 className="flex items-center gap-2 font-display text-xl/7 font-semibold">
        <Icon size={16} strokeWidth={1.75} className="text-muted-foreground" aria-hidden />
        {title}
      </h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </Card>
  )
}

function fmtSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function relative(from: Date) {
  const s = Math.round((Date.now() - from.getTime()) / 1000)
  if (s < 10) return 'just now'
  if (s < 60) return `${s}s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  return `${Math.round(m / 60)} h ago`
}

const fromProp = (s: StudyProp): Form =>
  s
    ? {
        title: s.title,
        clientId: s.clientId,
        overview: s.overview,
        challenge: s.challenge,
        solution: s.solution,
        results: s.results,
        extra: s.extra,
        hero: s.hero,
        gallery: s.gallery,
        attachments: s.attachments,
        videoUrls: s.videoUrls,
        metrics: s.metrics,
        testimonials: s.testimonials,
        keyBusinessIds: s.keyBusinessIds,
        workCategoryIds: s.workCategoryIds,
        serviceIds: s.serviceIds,
        businessModelIds: s.businessModelIds,
      }
    : EMPTY

const toPayload = (f: Form, intent: Intent) => ({
  intent,
  title: f.title,
  clientId: f.clientId,
  overview: f.overview,
  challenge: f.challenge,
  solution: f.solution,
  results: f.results,
  extra: f.extra,
  heroFileId: f.hero?.id ?? null,
  galleryIds: f.gallery.map((g) => g.id),
  attachmentIds: f.attachments.map((a) => a.id),
  videoUrls: f.videoUrls.filter((u) => u.trim()),
  metrics: f.metrics.filter((m) => m.label.trim() || m.value.trim()),
  testimonials: f.testimonials
    .filter((t) => t.quote.trim() || t.authorName.trim())
    .map((t) => ({ ...t, authorTitle: t.authorTitle.trim() || null })),
  keyBusinessIds: f.keyBusinessIds,
  workCategoryIds: f.workCategoryIds,
  serviceIds: f.serviceIds,
  businessModelIds: f.businessModelIds,
})

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function CaseStudyEdit({ study, options }: { study: StudyProp; options: Options }) {
  const page = usePage<{ user?: { role: string } }>()
  const errors = (page.props.errors ?? {}) as Record<string, string>
  const canCreateClient =
    page.props.user?.role === 'admin' || page.props.user?.role === 'superadmin'
  const [clients, setClients] = useState(options.clients)
  const [newClient, setNewClient] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [baseline, setBaseline] = useState(() => JSON.stringify(fromProp(study)))
  const [form, setForm] = useState<Form>(() => fromProp(study))
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [savedAt, setSavedAt] = useState<Date | null>(study ? new Date(study.updatedAt) : null)
  const [, tick] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [leaveTo, setLeaveTo] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<string>('basics')
  const allowLeave = useRef(false)
  const busy = useRef(false)

  const status: Status = study?.status ?? 'draft'
  const narrow = useNarrow()
  // Publish draw-in: play once when the status flips to published.
  const [prevStatus, setPrevStatus] = useState(status)
  const [draw, setDraw] = useState(false)
  if (status !== prevStatus) {
    setPrevStatus(status)
    setDraw(status === 'published')
  }
  const isDraft = status === 'draft'
  const dirty = useMemo(() => JSON.stringify(form) !== baseline, [form, baseline])

  const patch = useCallback(<K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setSaveState('dirty')
  }, [])

  /* ---- classification helpers ---------------------------------------- */
  const allKeyBusinesses = useMemo(
    () => options.sectors.flatMap((s) => s.industries.flatMap((i) => i.keyBusinesses)),
    [options.sectors]
  )
  const initialIndustry = useMemo(() => {
    const first = form.keyBusinessIds[0]
    for (const s of options.sectors)
      for (const i of s.industries)
        if (i.keyBusinesses.some((k) => k.id === first)) return { sector: s.id, industry: i.id }
    return { sector: '', industry: '' }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [sectorId, setSectorId] = useState(initialIndustry.sector)
  const [industryId, setIndustryId] = useState(initialIndustry.industry)
  const sector = options.sectors.find((s) => s.id === sectorId)
  const industry = sector?.industries.find((i) => i.id === industryId)

  /** Admin+: creates (or reuses) a client by name and selects it. */
  const addClient = async () => {
    const name = newClient?.trim()
    if (!name || creating) return
    setCreating(true)
    try {
      const created = await postJson<Option>('/clients/quick', { name })
      setClients((list) =>
        list.some((c) => c.id === created.id)
          ? list
          : [...list, created].sort((a, b) => a.name.localeCompare(b.name))
      )
      patch('clientId', created.id)
      setNewClient(null)
      toast.success(`Client “${created.name}” ready`)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setCreating(false)
    }
  }

  /* ---- save -------------------------------------------------------------- */
  const formRef = useRef(form)
  useEffect(() => {
    formRef.current = form
  }, [form])

  const save = useCallback(
    (intent: Intent) => {
      if (busy.current) return
      const current = formRef.current
      const url = study ? `/case-studies/${study.id}` : '/case-studies'
      busy.current = true
      allowLeave.current = true
      setSaveState('saving')
      const snapshot = JSON.stringify(current)
      router.visit(url, {
        method: study ? 'put' : 'post',
        data: toPayload(current, intent) as never,
        preserveScroll: true,
        preserveState: !!study,
        only: intent === 'autosave' ? ['errors'] : undefined,
        onSuccess: () => {
          setBaseline(snapshot)
          setSavedAt(new Date())
          setSaveState(JSON.stringify(formRef.current) === snapshot ? 'saved' : 'dirty')
        },
        onError: () => setSaveState('dirty'),
        onFinish: () => {
          busy.current = false
          allowLeave.current = false
        },
      })
    },
    [study]
  )

  // Autosave: drafts only, 3s after the last edit, once title + client exist.
  useEffect(() => {
    if (!study || !isDraft || !dirty || uploading) return
    if (!form.title.trim() || !form.clientId) return
    const t = setTimeout(() => save('autosave'), AUTOSAVE_MS)
    return () => clearTimeout(t)
  }, [form, study, isDraft, dirty, uploading, save])

  // ⌘S / Ctrl+S saves without publishing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (!uploading) save('save')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [save, uploading])

  // Keep "Saved · 2 min ago" fresh.
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30_000)
    return () => clearInterval(t)
  }, [])

  // Leaving with unsaved changes: AlertDialog for in-app visits, native prompt for the tab.
  useEffect(() => {
    const off = router.on('before', (event) => {
      const { visit } = event.detail
      if (!dirty || allowLeave.current || visit.method !== 'get') return
      if (visit.url.pathname === window.location.pathname) return
      event.preventDefault()
      setLeaveTo(visit.url.href)
    })
    const onUnload = (e: BeforeUnloadEvent) => {
      if (dirty && !allowLeave.current) e.preventDefault()
    }
    window.addEventListener('beforeunload', onUnload)
    return () => {
      off()
      window.removeEventListener('beforeunload', onUnload)
    }
  }, [dirty])

  // Scroll to and focus the first server error.
  useEffect(() => {
    if (!Object.keys(errors).length) return
    const el = document.querySelector<HTMLElement>('[data-field-error]')
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    const field = el?.id.replace(/-error$/, '')
    if (field) document.getElementById(field)?.focus({ preventScroll: true })
    toast.error('Fix the highlighted fields to continue.')
  }, [errors])

  // Section nav: underline the section nearest the top.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length) setActiveSection(visible[0].target.id)
      },
      { rootMargin: '-120px 0px -60% 0px' }
    )
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [])

  /* ---- derived ---------------------------------------------------------- */
  const readiness = [
    { label: 'Title', ok: !!form.title.trim() },
    { label: 'Client', ok: !!form.clientId },
    { label: 'Hero image', ok: !!form.hero },
    { label: 'Key business', ok: form.keyBusinessIds.length > 0 },
  ]
  const st = STATUS[status]
  const shownTitle = study ? study.title : 'New case study'
  const saveLabel =
    saveState === 'saving'
      ? 'Saving…'
      : saveState === 'dirty'
        ? isDraft && study
          ? 'Unsaved changes · autosaves shortly'
          : 'Unsaved changes'
        : savedAt
          ? `Saved · ${relative(savedAt)}`
          : 'Not saved yet'

  const primary =
    status === 'archived'
      ? { label: 'Restore to draft', intent: 'restore' as const, icon: ArrowLeft }
      : status === 'published'
        ? { label: 'Update', intent: 'publish' as const, icon: Send }
        : { label: 'Publish', intent: 'publish' as const, icon: Send }

  const actionButtons = (
    <>
      <button
        type="button"
        className={`${primaryBtn} w-full`}
        disabled={uploading || saveState === 'saving'}
        onClick={() => save(primary.intent)}
      >
        <primary.icon size={16} strokeWidth={1.75} aria-hidden /> {primary.label}
      </button>
      {status === 'draft' && (
        <button
          type="button"
          className={`${secondaryBtn} w-full`}
          disabled={uploading || saveState === 'saving'}
          onClick={() => save('save')}
        >
          <Save size={16} strokeWidth={1.75} aria-hidden /> Save draft
          <kbd className="ml-auto font-mono text-xs text-muted-foreground max-lg:hidden">⌘S</kbd>
        </button>
      )}
    </>
  )

  /* ---- render ------------------------------------------------------------ */
  return (
    <Page
      title={shownTitle}
      eyebrow={
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link href="/case-studies" className="rounded-sm hover:text-foreground">
            Case studies
          </Link>
          <span aria-hidden>/</span>
          <Folio n={study?.folio ?? null} />
        </span>
      }
      actions={
        study && (
          <Menu.Root>
            <Menu.Trigger
              aria-label="More actions"
              className={`inline-flex size-9 items-center justify-center rounded-md bg-secondary hover:bg-secondary/70 ${focusRing}`}
            >
              <MoreHorizontal size={16} strokeWidth={1.75} aria-hidden />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner align="end" sideOffset={6} className="z-50">
                <Menu.Popup className="min-w-48 rounded-lg border border-border-raised bg-surface-raised p-1 shadow-[var(--shadow-raised)]">
                  <Menu.Item
                    render={<Link href={`/case-studies/${study.id}`} />}
                    className="flex h-9 cursor-default items-center gap-2 rounded-md px-2 text-sm data-[highlighted]:bg-secondary"
                  >
                    <Eye size={16} strokeWidth={1.75} aria-hidden /> View read-only
                  </Menu.Item>
                  <Menu.Item
                    onClick={() => router.post(`/case-studies/${study.id}/duplicate`)}
                    className="flex h-9 cursor-default items-center gap-2 rounded-md px-2 text-sm data-[highlighted]:bg-secondary"
                  >
                    <Copy size={16} strokeWidth={1.75} aria-hidden /> Duplicate
                  </Menu.Item>
                  {status !== 'archived' && (
                    <Menu.Item
                      onClick={() => setArchiveOpen(true)}
                      className="flex h-9 cursor-default items-center gap-2 rounded-md px-2 text-sm data-[highlighted]:bg-secondary"
                    >
                      <Archive size={16} strokeWidth={1.75} aria-hidden /> Archive
                    </Menu.Item>
                  )}
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        )
      }
    >
      {/* Section nav */}
      <nav
        aria-label="Sections"
        className="sticky top-0 z-10 -mx-4 mb-6 overflow-x-auto border-b border-border bg-background/90 px-4 backdrop-blur-sm md:-mx-8 md:px-8"
      >
        <ul className="mx-auto flex max-w-[var(--container)] gap-1">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={activeSection === s.id ? 'true' : undefined}
                className={`-mb-px flex h-11 items-center border-b-2 border-transparent px-3 text-sm text-muted-foreground transition-colors hover:text-foreground aria-[current=true]:border-primary aria-[current=true]:text-foreground ${focusRing}`}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex gap-8 pb-24 max-lg:flex-col lg:pb-8">
        {/* ------------------------------ Main ----------------------------- */}
        <form
          className="flex min-w-0 max-w-[var(--form-max)] flex-1 flex-col gap-8"
          onSubmit={(e) => e.preventDefault()}
          noValidate
        >
          <SectionCard id="basics" title="Basics" icon={Type}>
            <FieldShell label="Title" htmlFor="f-title" error={errors.title}>
              <input
                id="f-title"
                className={inputCls}
                value={form.title}
                maxLength={255}
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? 'f-title-error' : undefined}
                onChange={(e) => patch('title', e.target.value)}
              />
            </FieldShell>
            <FieldShell label="Client" htmlFor="f-client" error={errors.clientId}>
              <select
                id="f-client"
                className={inputCls}
                value={form.clientId}
                aria-invalid={!!errors.clientId}
                aria-describedby={errors.clientId ? 'f-client-error' : undefined}
                onChange={(e) => patch('clientId', e.target.value)}
              >
                <option value="">Select a client…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {canCreateClient &&
                (newClient === null ? (
                  <button
                    type="button"
                    className={`${ghostBtn} mt-1.5`}
                    onClick={() => setNewClient('')}
                  >
                    <Plus size={16} strokeWidth={1.75} aria-hidden /> New client
                  </button>
                ) : (
                  <div className="mt-2 flex gap-2">
                    <input
                      aria-label="New client name"
                      className={inputCls}
                      value={newClient}
                      maxLength={255}
                      autoFocus
                      placeholder="Client name"
                      onChange={(e) => setNewClient(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addClient()
                        }
                        if (e.key === 'Escape') setNewClient(null)
                      }}
                    />
                    <button
                      type="button"
                      className={secondaryBtn}
                      disabled={creating || !newClient.trim()}
                      onClick={addClient}
                    >
                      Add
                    </button>
                    <button type="button" className={ghostBtn} onClick={() => setNewClient(null)}>
                      Cancel
                    </button>
                  </div>
                ))}
            </FieldShell>
            <FieldShell
              label="Overview"
              htmlFor="f-overview"
              hint="Shown first on the case study."
              counter={
                <span className="font-mono text-xs text-muted-foreground">
                  {form.overview.length}/2000
                </span>
              }
            >
              <textarea
                id="f-overview"
                rows={3}
                maxLength={2000}
                className={textareaCls}
                value={form.overview}
                onChange={(e) => patch('overview', e.target.value)}
              />
            </FieldShell>
          </SectionCard>

          <SectionCard
            id="hero"
            title="Hero"
            icon={ImageIcon}
            description="16:9 image shown at the top of the study."
          >
            <CropFrame tick={narrow ? 10 : 16} dashed={status !== 'published'} draw={draw}>
              {form.hero ? (
                <div>
                  <img
                    src={form.hero.url}
                    alt={form.hero.name}
                    width={1280}
                    height={720}
                    className="aspect-video w-full rounded-md object-cover"
                  />
                </div>
              ) : (
                <Dropzone
                  kind="image"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  prompt="Drop a hero image here"
                  hint="JPG, PNG, WebP or AVIF · up to 10 MB"
                  onBusyChange={setUploading}
                  onUploaded={(f) => patch('hero', { id: f.id, name: f.name, url: f.url })}
                />
              )}
            </CropFrame>
            {errors.heroFileId && (
              <p id="f-hero-error" data-field-error className="text-xs text-error">
                {errors.heroFileId}
              </p>
            )}
            {form.hero && (
              <div className="flex gap-1" role="toolbar" aria-label="Hero image actions">
                <label className={`${ghostBtn} cursor-pointer`}>
                  <ImagePlus size={16} strokeWidth={1.75} aria-hidden /> Replace
                  <ReplaceInput onPicked={(f) => patch('hero', f)} onBusy={setUploading} />
                </label>
                <button type="button" className={ghostBtn} onClick={() => patch('hero', null)}>
                  <Trash2 size={16} strokeWidth={1.75} aria-hidden /> Remove
                </button>
              </div>
            )}
          </SectionCard>

          <SectionCard
            id="story"
            title="Story"
            icon={FileText}
            description="Markdown is supported."
          >
            {(
              [
                ['challenge', 'Challenge'],
                ['solution', 'Solution'],
                ['results', 'Results'],
              ] as const
            ).map(([key, label]) => (
              <FieldShell key={key} label={label} htmlFor={`f-${key}`} error={errors[key]}>
                <textarea
                  id={`f-${key}`}
                  rows={5}
                  className={textareaCls}
                  value={form[key]}
                  onChange={(e) => patch(key, e.target.value)}
                />
              </FieldShell>
            ))}
            {form.extra && (
              <FieldShell
                label="Other sections"
                htmlFor="f-extra"
                hint="Extra headings from imported content, kept as written."
              >
                <textarea
                  id="f-extra"
                  rows={4}
                  className={`${textareaCls} font-mono text-[13px]`}
                  value={form.extra}
                  onChange={(e) => patch('extra', e.target.value)}
                />
              </FieldShell>
            )}
          </SectionCard>

          <SectionCard id="gallery" title="Gallery" icon={LayoutGrid}>
            {form.gallery.length > 0 && (
              <SortableGallery items={form.gallery} onChange={(next) => patch('gallery', next)} />
            )}
            {errors.galleryIds && (
              <p data-field-error className="text-xs text-error">
                {errors.galleryIds}
              </p>
            )}
            <Dropzone
              kind="image"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              compact
              prompt="Drop images to add them to the gallery"
              hint="Up to 10 MB each"
              onBusyChange={setUploading}
              onUploaded={(f) =>
                setForm((cur) => ({
                  ...cur,
                  gallery: [...cur.gallery, { id: f.id, name: f.name, url: f.url }],
                }))
              }
            />
          </SectionCard>

          <SectionCard
            id="media"
            title="Media"
            icon={Video}
            description="YouTube or Vimeo links (https)."
          >
            {form.videoUrls.map((url, i) => {
              const src = embedUrl(url)
              const err = errors[`videoUrls.${i}`]
              return (
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      id={`f-video-${i}`}
                      aria-label={`Video URL ${i + 1}`}
                      className={inputCls}
                      value={url}
                      inputMode="url"
                      placeholder="https://www.youtube.com/watch?v=…"
                      onChange={(e) =>
                        patch(
                          'videoUrls',
                          form.videoUrls.map((u, j) => (j === i ? e.target.value : u))
                        )
                      }
                    />
                    <IconBtn
                      label={`Remove video ${i + 1}`}
                      onClick={() =>
                        patch(
                          'videoUrls',
                          form.videoUrls.filter((_, j) => j !== i)
                        )
                      }
                    >
                      <Trash2 size={16} strokeWidth={1.75} aria-hidden />
                    </IconBtn>
                  </div>
                  {err && (
                    <p id={`f-video-${i}-error`} data-field-error className="text-xs text-error">
                      {err}
                    </p>
                  )}
                  {url.trim() && !src && !err && (
                    <p className="text-xs text-muted-foreground">
                      No inline preview for this link; it will open as a link.
                    </p>
                  )}
                  {src && (
                    <iframe
                      src={src}
                      title={`Video preview ${i + 1}`}
                      loading="lazy"
                      allow="fullscreen; picture-in-picture"
                      referrerPolicy="strict-origin-when-cross-origin"
                      className="aspect-video w-full rounded-md border border-border"
                    />
                  )}
                </div>
              )
            })}
            <div>
              <button
                type="button"
                className={ghostBtn}
                disabled={form.videoUrls.length >= 10}
                onClick={() => patch('videoUrls', [...form.videoUrls, ''])}
              >
                <Plus size={16} strokeWidth={1.75} aria-hidden /> Add video
              </button>
            </div>
          </SectionCard>

          <SectionCard id="proof" title="Proof" icon={BarChart3}>
            <div>
              <h3 className="mb-2 text-[13px]/[18px] font-medium">Metrics</h3>
              <div className="flex flex-col gap-2">
                {form.metrics.map((m, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      aria-label={`Metric ${i + 1} value`}
                      className={`${inputCls} w-32 shrink-0 font-mono`}
                      placeholder="+45 %"
                      value={m.value}
                      onChange={(e) =>
                        patch('metrics', setAt(form.metrics, i, { value: e.target.value }))
                      }
                    />
                    <input
                      aria-label={`Metric ${i + 1} label`}
                      className={inputCls}
                      placeholder="Organic search"
                      value={m.label}
                      onChange={(e) =>
                        patch('metrics', setAt(form.metrics, i, { label: e.target.value }))
                      }
                    />
                    <IconBtn
                      label={`Remove metric ${i + 1}`}
                      onClick={() =>
                        patch(
                          'metrics',
                          form.metrics.filter((_, j) => j !== i)
                        )
                      }
                    >
                      <Trash2 size={16} strokeWidth={1.75} aria-hidden />
                    </IconBtn>
                  </div>
                ))}
                {Object.keys(errors).some((k) => k.startsWith('metrics.')) && (
                  <p data-field-error className="text-xs text-error">
                    Each metric needs both a value and a label.
                  </p>
                )}
              </div>
              <button
                type="button"
                className={`${ghostBtn} mt-2`}
                disabled={form.metrics.length >= 12}
                onClick={() => patch('metrics', [...form.metrics, { label: '', value: '' }])}
              >
                <Plus size={16} strokeWidth={1.75} aria-hidden /> Add metric
              </button>
            </div>

            <div>
              <h3 className="mb-2 text-[13px]/[18px] font-medium">Testimonials</h3>
              <div className="flex flex-col gap-3">
                {form.testimonials.map((t, i) => (
                  <div key={i} className="rounded-md border border-border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Quote size={14} strokeWidth={1.75} aria-hidden /> Testimonial {i + 1}
                      </span>
                      <IconBtn
                        label={`Remove testimonial ${i + 1}`}
                        onClick={() =>
                          patch(
                            'testimonials',
                            form.testimonials.filter((_, j) => j !== i)
                          )
                        }
                      >
                        <Trash2 size={16} strokeWidth={1.75} aria-hidden />
                      </IconBtn>
                    </div>
                    <textarea
                      aria-label={`Testimonial ${i + 1} quote`}
                      rows={3}
                      className={textareaCls}
                      placeholder="Quote"
                      value={t.quote}
                      onChange={(e) =>
                        patch(
                          'testimonials',
                          setAt(form.testimonials, i, { quote: e.target.value })
                        )
                      }
                    />
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <input
                        aria-label={`Testimonial ${i + 1} name`}
                        className={inputCls}
                        placeholder="Name"
                        value={t.authorName}
                        onChange={(e) =>
                          patch(
                            'testimonials',
                            setAt(form.testimonials, i, { authorName: e.target.value })
                          )
                        }
                      />
                      <input
                        aria-label={`Testimonial ${i + 1} role`}
                        className={inputCls}
                        placeholder="Role"
                        value={t.authorTitle}
                        onChange={(e) =>
                          patch(
                            'testimonials',
                            setAt(form.testimonials, i, { authorTitle: e.target.value })
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
                {Object.keys(errors).some((k) => k.startsWith('testimonials.')) && (
                  <p data-field-error className="text-xs text-error">
                    Each testimonial needs a quote and a name.
                  </p>
                )}
              </div>
              <button
                type="button"
                className={`${ghostBtn} mt-2`}
                disabled={form.testimonials.length >= 10}
                onClick={() =>
                  patch('testimonials', [
                    ...form.testimonials,
                    { quote: '', authorName: '', authorTitle: '' },
                  ])
                }
              >
                <Plus size={16} strokeWidth={1.75} aria-hidden /> Add testimonial
              </button>
            </div>
          </SectionCard>

          <SectionCard id="files" title="Files" icon={Paperclip}>
            {form.attachments.length > 0 && (
              <ul className="divide-y divide-border">
                {form.attachments.map((a) => (
                  <li key={a.id} className="flex h-10 items-center gap-3 text-sm">
                    <FileText
                      size={16}
                      strokeWidth={1.75}
                      className="shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate">{a.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {fmtSize(a.size)}
                    </span>
                    <IconBtn
                      label={`Remove ${a.name}`}
                      onClick={() =>
                        patch(
                          'attachments',
                          form.attachments.filter((x) => x.id !== a.id)
                        )
                      }
                    >
                      <Trash2 size={16} strokeWidth={1.75} aria-hidden />
                    </IconBtn>
                  </li>
                ))}
              </ul>
            )}
            <Dropzone
              kind="attachment"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip"
              multiple
              compact
              prompt="Drop files to attach them"
              hint="PDF, Office files or ZIP · up to 20 MB each"
              onBusyChange={setUploading}
              onUploaded={(f) =>
                setForm((cur) => ({
                  ...cur,
                  attachments: [...cur.attachments, { id: f.id, name: f.name, size: f.size }],
                }))
              }
            />
          </SectionCard>
        </form>

        {/* ------------------------------ Rail ----------------------------- */}
        <aside className="flex w-full shrink-0 flex-col gap-6 lg:sticky lg:top-[120px] lg:h-fit lg:w-[var(--rail-editor)]">
          <Card className="p-4" aria-labelledby="status-title">
            <div className="flex items-center justify-between gap-2">
              <CardTitle id="status-title">Status</CardTitle>
              <Badge tone={st.tone}>{st.label}</Badge>
            </div>
            <p role="status" className="mt-2 text-xs text-muted-foreground">
              {uploading ? 'Uploading…' : saveLabel}
            </p>
            <div className="mt-4 flex flex-col gap-2 max-lg:hidden">{actionButtons}</div>
            <ul
              className="mt-4 flex flex-col gap-1.5 border-t border-border pt-3"
              aria-label="Publish checklist"
            >
              {readiness.map((r) => (
                <li key={r.label} className="flex items-center gap-2 text-[13px]/[18px]">
                  {r.ok ? (
                    <CircleCheck
                      size={16}
                      strokeWidth={1.75}
                      className="text-success"
                      aria-hidden
                    />
                  ) : (
                    <Circle
                      size={16}
                      strokeWidth={1.75}
                      className="text-muted-foreground"
                      aria-hidden
                    />
                  )}
                  <span className={r.ok ? '' : 'text-muted-foreground'}>{r.label}</span>
                  <span className="sr-only">{r.ok ? 'done' : 'missing'}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-4">
            <CardTitle className="flex items-center gap-2">
              <Tags size={16} strokeWidth={1.75} className="text-muted-foreground" aria-hidden />
              Classification
            </CardTitle>
            <div className="mt-4 flex flex-col gap-4">
              <FieldShell label="Sector" htmlFor="f-sector">
                <select
                  id="f-sector"
                  className={inputCls}
                  value={sectorId}
                  onChange={(e) => {
                    setSectorId(e.target.value)
                    setIndustryId('')
                  }}
                >
                  <option value="">All sectors</option>
                  {options.sectors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </FieldShell>
              <FieldShell label="Industry" htmlFor="f-industry">
                <select
                  id="f-industry"
                  className={inputCls}
                  value={industryId}
                  disabled={!sector}
                  onChange={(e) => setIndustryId(e.target.value)}
                >
                  <option value="">{sector ? 'Select an industry…' : 'Pick a sector first'}</option>
                  {sector?.industries.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </FieldShell>
              <MultiSelect
                label="Key business"
                options={industry?.keyBusinesses ?? []}
                allOptions={allKeyBusinesses}
                value={form.keyBusinessIds}
                onChange={(v) => patch('keyBusinessIds', v)}
                disabled={!industry}
                placeholder={industry ? 'Add key business…' : 'Pick an industry first'}
                error={errors.keyBusinessIds}
              />
              <MultiSelect
                label="Work categories"
                options={options.workCategories}
                value={form.workCategoryIds}
                onChange={(v) => patch('workCategoryIds', v)}
                error={errors.workCategoryIds}
              />
              <MultiSelect
                label="Services"
                options={options.services}
                value={form.serviceIds}
                onChange={(v) => patch('serviceIds', v)}
                error={errors.serviceIds}
              />
              <MultiSelect
                label="Business model"
                options={options.businessModels}
                value={form.businessModelIds}
                onChange={(v) => patch('businessModelIds', v)}
                error={errors.businessModelIds}
              />
            </div>
            <p className="mt-5 flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
              <Layers size={14} strokeWidth={1.75} aria-hidden />
              <Folio n={study?.folio ?? null} />
            </p>
          </Card>
        </aside>
      </div>

      {/* Mobile action bar: the rail buttons are hidden below lg, so there is still one trigger. */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t border-border bg-background/95 p-3 backdrop-blur-sm lg:hidden">
        {actionButtons}
      </div>

      {/* Archive confirm */}
      <AlertDialog.Root open={archiveOpen} onOpenChange={setArchiveOpen}>
        <ConfirmDialog
          title="Archive this case study?"
          body="It will disappear from new shares and can be restored to draft later."
          confirmLabel="Archive"
          onConfirm={() => {
            setArchiveOpen(false)
            allowLeave.current = true
            router.post(`/case-studies/${study!.id}/archive`)
          }}
        />
      </AlertDialog.Root>

      {/* Leave confirm */}
      <AlertDialog.Root open={leaveTo !== null} onOpenChange={(o) => !o && setLeaveTo(null)}>
        <ConfirmDialog
          title="Leave without saving?"
          body="You have changes that haven't been saved. They will be lost."
          confirmLabel="Leave"
          onConfirm={() => {
            const to = leaveTo!
            setLeaveTo(null)
            allowLeave.current = true
            router.visit(to)
          }}
        />
      </AlertDialog.Root>
    </Page>
  )
}

CaseStudyEdit.layout = [AppLayout]

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/** True below 768px, where the spec shrinks crop-mark ticks. */
function useNarrow() {
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const on = () => setNarrow(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return narrow
}

function setAt<T>(list: T[], index: number, change: Partial<T>): T[] {
  return list.map((item, i) => (i === index ? { ...item, ...change } : item))
}

function IconBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}
    >
      {children}
    </button>
  )
}

/** Hidden file input for "Replace" on the hero. */
function ReplaceInput({
  onPicked,
  onBusy,
}: {
  onPicked: (img: Img) => void
  onBusy: (busy: boolean) => void
}) {
  const id = useId()
  return (
    <input
      id={id}
      type="file"
      accept="image/jpeg,image/png,image/webp,image/avif"
      className="sr-only"
      onChange={async (e) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return
        const { uploadFile } = await import('~/lib/upload')
        onBusy(true)
        try {
          const done = await uploadFile(file, 'image', () => {})
          onPicked({ id: done.id, name: done.name, url: done.url })
        } catch (err) {
          toast.error((err as Error).message)
        } finally {
          onBusy(false)
        }
      }}
    />
  )
}

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onConfirm,
}: {
  title: string
  body: string
  confirmLabel: string
  onConfirm: () => void
}) {
  const cancel = useRef<HTMLButtonElement>(null)
  return (
    <AlertDialog.Portal>
      <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/50" />
      <AlertDialog.Popup
        initialFocus={cancel}
        className="fixed left-1/2 top-1/2 z-50 w-[min(420px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border-raised bg-surface-raised p-6 shadow-[var(--shadow-raised)]"
      >
        <AlertDialog.Title className="font-display text-xl/7 font-semibold">
          {title}
        </AlertDialog.Title>
        <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
          {body}
        </AlertDialog.Description>
        <div className="mt-6 flex justify-end gap-2">
          <AlertDialog.Close ref={cancel} className={secondaryBtn}>
            Cancel
          </AlertDialog.Close>
          <button type="button" onClick={onConfirm} className={primaryBtn}>
            {confirmLabel}
          </button>
        </div>
      </AlertDialog.Popup>
    </AlertDialog.Portal>
  )
}
