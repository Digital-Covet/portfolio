import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, router, useForm } from '@inertiajs/react'
import { Field } from '@base-ui/react/field'
import { Input } from '@base-ui/react/input'
import { NumberField } from '@base-ui/react/number-field'
import { Radio } from '@base-ui/react/radio'
import { RadioGroup } from '@base-ui/react/radio-group'
import { Switch } from '@base-ui/react/switch'
import { Toggle } from '@base-ui/react/toggle'
import { ToggleGroup } from '@base-ui/react/toggle-group'
import {
  Dices,
  Eye,
  EyeOff,
  Info,
  Link2,
  ListChecks,
  Minus,
  Plus,
  Search,
  SquareCheck,
  Trash2,
  TriangleAlert,
  WandSparkles,
} from 'lucide-react'
import { Card, CardTitle } from '~/components/card'
import { ContactSheet, Folio, ShareTicket } from '~/components/decor'
import { MultiSelect } from '~/components/multi_select'
import Page from '~/components/page'
import AppLayout from '~/layouts/app'
import { generatePassword, passwordHandoff, shortDate, type RuleField } from '~/lib/share'

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type Study = { id: string; title: string; folio: number; client: string; thumbnail: string | null }
type Rule = { field: RuleField; ids: string[] }
type Mode = 'pick' | 'rule'

type ShareData = {
  id: string
  name: string
  token: string
  mode: Mode
  caseStudyIds: string[]
  rules: Rule[]
  protected: boolean
  expiresAt: string | null
  expired: boolean
  maxViews: number | null
  viewCount: number
}

/** Mirrors the props sent by app/controllers/shares_controller.ts. */
type FormProps = {
  share: ShareData | null
  options: {
    studies: Study[]
    rule: Record<RuleField, { id: string; name: string }[]>
  }
  matchPreview: { count: number; items: Study[] }
}

type FormData = {
  name: string
  mode: Mode
  caseStudyIds: string[]
  rules: Rule[]
  passwordAction: 'keep' | 'set' | 'remove'
  password: string
  expiresAt: string | null
  maxViews: number | null
}

type Preset = '7' | '14' | '30' | 'custom'

const FIELD_LABEL: Record<RuleField, string> = {
  sector: 'Sector',
  industry: 'Industry',
  keyBusiness: 'Key business',
  workCategory: 'Work category',
  service: 'Service',
  client: 'Client',
}
const FIELDS = Object.keys(FIELD_LABEL) as RuleField[]

const primaryBtn =
  'inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'
const ghostBtn =
  'inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[13px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground'
const iconBtn =
  'flex size-9 shrink-0 items-center justify-center rounded-md border border-border-strong bg-surface text-muted-foreground transition-colors hover:text-foreground'
const inputCls =
  'h-9 w-full rounded-md border border-border-strong bg-surface px-3 text-sm placeholder:text-muted-foreground'
const labelCls = 'text-[13px]/[18px] font-medium'

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/** Calendar day `n` days from now, as the `YYYY-MM-DD` the server stores (UTC). */
function inDays(n: number) {
  return new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10)
}

function initialPreset(expiresAt: string | null): Preset {
  if (!expiresAt) return '14'
  const match = (['7', '14', '30'] as const).find((p) => inDays(Number(p)) === expiresAt)
  return match ?? 'custom'
}

/* -------------------------------------------------------------------------- */
/* Small controls                                                              */
/* -------------------------------------------------------------------------- */

function Toggler({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
}) {
  return (
    <Switch.Root
      checked={checked}
      onCheckedChange={onChange}
      aria-label={label}
      className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-border-strong px-0.5 transition-colors data-[checked]:bg-primary"
    >
      <Switch.Thumb className="size-4 rounded-full bg-white shadow-sm transition-transform duration-[120ms] data-[checked]:translate-x-4 motion-reduce:transition-none" />
    </Switch.Root>
  )
}

function Callout({ tone, children }: { tone: 'info' | 'warning'; children: ReactNode }) {
  const Icon = tone === 'info' ? Info : TriangleAlert
  return (
    <div
      className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${tone === 'info' ? 'border-info/40 bg-info/10' : 'border-warning/40 bg-warning/10'}`}
    >
      <Icon
        size={16}
        strokeWidth={1.75}
        className={`mt-0.5 shrink-0 ${tone === 'info' ? 'text-info' : 'text-warning'}`}
        aria-hidden
      />
      <div>{children}</div>
    </div>
  )
}

function Thumb({ src }: { src: string | null }) {
  return (
    <span className="inline-flex h-[30px] w-10 shrink-0 overflow-hidden rounded-sm bg-secondary ring-1 ring-border">
      {src && <img src={src} alt="" loading="lazy" className="size-full object-cover" />}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/* Contents: pick mode                                                         */
/* -------------------------------------------------------------------------- */

function StudyPicker({
  studies,
  value,
  onChange,
}: {
  studies: Study[]
  value: string[]
  onChange: (ids: string[]) => void
}) {
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const shown = useMemo(
    () =>
      studies.filter(
        (s) =>
          !needle ||
          `${s.title} ${s.client} ${String(s.folio).padStart(4, '0')}`
            .toLowerCase()
            .includes(needle)
      ),
    [studies, needle]
  )
  const selected = new Set(value)
  const allShown = shown.length > 0 && shown.every((s) => selected.has(s.id))

  const toggle = (id: string) =>
    onChange(selected.has(id) ? value.filter((v) => v !== id) : [...value, id])
  const toggleAll = () =>
    onChange(
      allShown
        ? value.filter((v) => !shown.some((s) => s.id === v))
        : [...value, ...shown.filter((s) => !selected.has(s.id)).map((s) => s.id)]
    )

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search
          size={16}
          strokeWidth={1.75}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title, client or Nº"
          aria-label="Search published case studies"
          className={`${inputCls} pl-8`}
        />
      </div>

      {studies.length === 0 ? (
        <p className="rounded-md border border-dashed border-border-strong px-4 py-8 text-center text-sm text-muted-foreground">
          No case studies are published yet. Publish one first, then share it.
        </p>
      ) : (
        <div className="max-h-[420px] overflow-auto rounded-md border border-border">
          <table className="w-full border-collapse text-[13px]/[18px]">
            <thead className="sticky top-0 z-10 bg-surface">
              <tr className="border-b border-border">
                <th scope="col" className="h-9 w-10 pl-3 text-left">
                  <input
                    type="checkbox"
                    checked={allShown}
                    onChange={toggleAll}
                    aria-label="Select all shown"
                    className="size-4 accent-[var(--primary)]"
                  />
                </th>
                <th
                  scope="col"
                  className="h-9 px-2 text-left text-xs font-medium text-muted-foreground"
                >
                  Study
                </th>
                <th
                  scope="col"
                  className="h-9 px-2 text-left text-xs font-medium text-muted-foreground max-sm:hidden"
                >
                  Client
                </th>
                <th
                  scope="col"
                  className="h-9 px-3 text-left text-xs font-medium text-muted-foreground"
                >
                  Nº
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                    No case studies match “{q}”.
                  </td>
                </tr>
              )}
              {shown.map((s) => (
                <tr
                  key={s.id}
                  className="h-[46px] cursor-pointer border-b border-border last:border-b-0 hover:bg-secondary/50"
                  onClick={() => toggle(s.id)}
                >
                  <td className="pl-3">
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      onChange={() => toggle(s.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select ${s.title}`}
                      className="size-4 accent-[var(--primary)]"
                    />
                  </td>
                  <td className="px-2">
                    <span className="flex items-center gap-3">
                      <Thumb src={s.thumbnail} />
                      <span className="font-medium">{s.title}</span>
                    </span>
                  </td>
                  <td className="px-2 text-muted-foreground max-sm:hidden">{s.client}</td>
                  <td className="px-3">
                    <Folio n={s.folio} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Contents: rule mode                                                         */
/* -------------------------------------------------------------------------- */

function RuleBuilder({
  rules,
  onChange,
  options,
  preview,
}: {
  rules: Rule[]
  onChange: (rules: Rule[]) => void
  options: FormProps['options']['rule']
  preview: FormProps['matchPreview']
}) {
  const used = new Set(rules.map((r) => r.field))
  const free = FIELDS.filter((f) => !used.has(f))
  const active = rules.some((r) => r.ids.length > 0)

  const update = (i: number, next: Rule) => onChange(rules.map((r, j) => (j === i ? next : r)))

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {rules.map((r, i) => (
          <li key={r.field} className="flex flex-col gap-3 rounded-md border border-border p-3">
            <div className="flex items-end gap-2">
              <div className="flex flex-1 flex-col gap-1.5">
                <label htmlFor={`rule-field-${i}`} className={labelCls}>
                  Condition {i + 1}
                </label>
                <select
                  id={`rule-field-${i}`}
                  value={r.field}
                  onChange={(e) => update(i, { field: e.target.value as RuleField, ids: [] })}
                  className={inputCls}
                >
                  {FIELDS.filter((f) => f === r.field || !used.has(f)).map((f) => (
                    <option key={f} value={f}>
                      {FIELD_LABEL[f]}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => onChange(rules.filter((_, j) => j !== i))}
                aria-label={`Remove condition ${i + 1}`}
                className={iconBtn}
              >
                <Trash2 size={16} strokeWidth={1.75} aria-hidden />
              </button>
            </div>
            <MultiSelect
              label={`${FIELD_LABEL[r.field]} is any of`}
              options={options[r.field]}
              value={r.ids}
              onChange={(ids) => update(i, { ...r, ids })}
              placeholder={`Add ${FIELD_LABEL[r.field].toLowerCase()}…`}
            />
          </li>
        ))}
      </ul>

      {free.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([...rules, { field: free[0], ids: [] }])}
          className={`${ghostBtn} self-start`}
        >
          <Plus size={16} strokeWidth={1.75} aria-hidden /> Add condition
        </button>
      )}

      <Callout tone="info">
        <strong className="font-medium">Live rule</strong> — case studies published later that match
        will appear automatically.
      </Callout>

      <div aria-live="polite" className="flex flex-col gap-3">
        {!active ? (
          <p className="text-sm text-muted-foreground">
            Add a value to a condition to preview what it admits.
          </p>
        ) : preview.count === 0 ? (
          <Callout tone="warning">
            No published case study matches these conditions yet. A link created now would be empty
            until one does.
          </Callout>
        ) : (
          <>
            <p className="text-sm">
              <span className="font-mono font-medium">{preview.count}</span> published case{' '}
              {preview.count === 1 ? 'study matches' : 'studies match'} now
            </p>
            <ul className="flex flex-col gap-2">
              {preview.items.map((s) => (
                <li key={s.id} className="flex items-center gap-3">
                  <Thumb src={s.thumbnail} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{s.title}</span>
                  <Folio n={s.folio} />
                </li>
              ))}
            </ul>
            {preview.count > preview.items.length && (
              <p className="text-xs text-muted-foreground">
                + {preview.count - preview.items.length} more
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Page                                                                         */
/* -------------------------------------------------------------------------- */

export default function ShareForm({ share, options, matchPreview }: FormProps) {
  const editing = !!share
  const form = useForm<FormData>({
    name: share?.name ?? '',
    mode: share?.mode ?? 'pick',
    caseStudyIds: share?.caseStudyIds ?? [],
    rules: share?.rules ?? [],
    passwordAction: 'remove',
    password: '',
    expiresAt: share ? share.expiresAt : inDays(14),
    maxViews: share?.maxViews ?? 25,
  })
  const { data, setData } = form

  const [passwordOn, setPasswordOn] = useState(share?.protected ?? false)
  const [reveal, setReveal] = useState(false)
  const [limitOn, setLimitOn] = useState(share !== null && share.maxViews !== null)
  const [preset, setPreset] = useState<Preset>(initialPreset(share?.expiresAt ?? null))

  const studiesById = useMemo(
    () => new Map(options.studies.map((s) => [s.id, s])),
    [options.studies]
  )
  const activeRules = data.rules.filter((r) => r.ids.length > 0)
  const rulesKey = JSON.stringify(activeRules)

  // Debounced partial reload: only the server-computed preview is refetched.
  const firstRun = useRef(true)
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    if (data.mode !== 'rule') return
    const t = setTimeout(
      () =>
        router.get(
          location.pathname,
          { rules: rulesKey },
          { only: ['matchPreview'], preserveState: true, preserveScroll: true, replace: true }
        ),
      300
    )
    return () => clearTimeout(t)
  }, [rulesKey, data.mode])

  const selectedStudies = data.caseStudyIds
    .map((id) => studiesById.get(id))
    .filter((s): s is Study => !!s)

  /** Why "Create link" is unavailable, in the order the user would fix it. */
  const blocker = !data.name.trim()
    ? 'Name the share to continue.'
    : data.mode === 'pick' && data.caseStudyIds.length === 0
      ? 'Select at least one case study.'
      : data.mode === 'rule' && activeRules.length === 0
        ? 'Add a condition to define the rule.'
        : data.mode === 'rule' && matchPreview.count === 0
          ? 'No published case study matches this rule yet.'
          : passwordOn && !data.password && !share?.protected
            ? 'Enter a password or turn protection off.'
            : !data.expiresAt
              ? 'Choose an expiry date.'
              : limitOn && !data.maxViews
                ? 'Enter a view limit or turn it off.'
                : null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (blocker) return
    const passwordAction = !passwordOn ? 'remove' : data.password ? 'set' : 'keep'
    form.transform((d) => ({
      ...d,
      caseStudyIds: d.mode === 'pick' ? d.caseStudyIds : [],
      rules: d.mode === 'rule' ? d.rules.filter((r) => r.ids.length > 0) : [],
      passwordAction,
      password: passwordAction === 'set' ? d.password : null,
      maxViews: limitOn ? d.maxViews : null,
    }))
    if (share) {
      form.put(`/shares/${share.id}`, { preserveScroll: true })
    } else {
      passwordHandoff.set(passwordAction === 'set' ? data.password : null)
      form.post('/shares', { preserveScroll: true })
    }
  }

  const pickPreset = (next: Preset) => {
    setPreset(next)
    if (next !== 'custom') setData('expiresAt', inDays(Number(next)))
  }

  const stubExpiry = data.expiresAt ? `${data.expiresAt}T23:59:59Z` : null
  const typeLine =
    data.mode === 'pick'
      ? `${data.caseStudyIds.length} ${data.caseStudyIds.length === 1 ? 'study' : 'studies'}`
      : `Live rule${activeRules.length ? ` · ${matchPreview.count} now` : ''}`

  const action = (className: string) => (
    <button type="submit" disabled={!!blocker || form.processing} className={className}>
      <Link2 size={16} strokeWidth={1.75} aria-hidden />
      {form.processing ? 'Saving…' : editing ? 'Save changes' : 'Create link'}
    </button>
  )

  return (
    <Page
      title={share?.name ?? 'New share'}
      eyebrow={
        <>
          <Link href="/shares" className="hover:text-foreground hover:underline">
            Shares
          </Link>{' '}
          / {editing ? 'Edit' : 'New'}
        </>
      }
      description={
        editing ? undefined : 'Package a set of case studies behind one protected, expiring link.'
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-6 pb-24 lg:flex-row lg:pb-0">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          {share?.expired && (
            <Callout tone="warning">
              This share expired. Choose a later expiry date to reactivate the link.
            </Callout>
          )}

          <Card className="flex flex-col gap-5 p-6">
            <CardTitle className="text-xl/7">Contents</CardTitle>

            <Field.Root name="name" invalid={!!form.errors.name} className="flex flex-col gap-1.5">
              <Field.Label className={labelCls}>Share name</Field.Label>
              <Input
                required
                maxLength={255}
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                className={inputCls}
              />
              <Field.Description className="text-xs text-muted-foreground">
                Recipients see this as the page title.
              </Field.Description>
              <Field.Error match={!!form.errors.name} className="text-xs text-error">
                {form.errors.name}
              </Field.Error>
            </Field.Root>

            <div className="flex flex-col gap-1.5">
              <span id="mode-label" className={labelCls}>
                What this link admits
              </span>
              <RadioGroup
                aria-labelledby="mode-label"
                value={data.mode}
                onValueChange={(v) => setData('mode', v as Mode)}
                className="grid gap-3 sm:grid-cols-2"
              >
                {(
                  [
                    ['pick', 'Pick case studies', 'A fixed list you choose by hand.', SquareCheck],
                    [
                      'rule',
                      'Live rule',
                      'Everything published that matches your conditions, now and later.',
                      WandSparkles,
                    ],
                  ] as const
                ).map(([value, title, hint, Icon]) => (
                  <Radio.Root
                    key={value}
                    value={value}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-border-strong p-3 text-left transition-colors hover:bg-secondary/50 data-[checked]:border-primary data-[checked]:bg-primary/10"
                  >
                    <Icon size={20} strokeWidth={1.75} className="mt-0.5 shrink-0" aria-hidden />
                    <span>
                      <span className="block text-sm font-medium">{title}</span>
                      <span className="block text-xs text-muted-foreground">{hint}</span>
                    </span>
                  </Radio.Root>
                ))}
              </RadioGroup>
            </div>

            {data.mode === 'pick' ? (
              <StudyPicker
                studies={options.studies}
                value={data.caseStudyIds}
                onChange={(ids) => setData('caseStudyIds', ids)}
              />
            ) : (
              <RuleBuilder
                rules={data.rules}
                onChange={(rules) => setData('rules', rules)}
                options={options.rule}
                preview={matchPreview}
              />
            )}
            {(form.errors.caseStudyIds || form.errors.rules) && (
              <p role="alert" className="text-xs text-error">
                {form.errors.caseStudyIds ?? form.errors.rules}
              </p>
            )}
          </Card>

          {data.mode === 'pick' && (
            <Card className="flex flex-col gap-3 p-6">
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2 text-xl/7">
                  <ListChecks size={16} strokeWidth={1.75} aria-hidden /> Selection
                </CardTitle>
                <span className="font-mono text-xs text-muted-foreground" aria-live="polite">
                  {selectedStudies.length} selected
                </span>
              </div>
              <ContactSheet
                frames={selectedStudies.map((s) => ({
                  id: s.id,
                  src: s.thumbnail,
                  label: s.title,
                }))}
                onRemove={(id) =>
                  setData(
                    'caseStudyIds',
                    data.caseStudyIds.filter((v) => v !== id)
                  )
                }
                empty="Select case studies to add them here."
              />
            </Card>
          )}
        </div>

        {/* Rail: access settings sit beside the create action. */}
        <aside className="lg:sticky lg:top-6 lg:w-[var(--rail-share)] lg:shrink-0 lg:self-start">
          <Card className="flex flex-col gap-5 p-6">
            <CardTitle className="text-xl/7">Access</CardTitle>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="share-password" className={labelCls}>
                  Password
                </label>
                <Toggler checked={passwordOn} onChange={setPasswordOn} label="Require a password" />
              </div>
              {passwordOn && (
                <>
                  <div className="flex gap-2">
                    <input
                      id="share-password"
                      type={reveal ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={data.password}
                      onChange={(e) => setData('password', e.target.value)}
                      minLength={6}
                      maxLength={128}
                      placeholder={share?.protected ? 'Leave blank to keep the current one' : ''}
                      aria-invalid={!!form.errors.password}
                      className={`${inputCls} font-mono`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setData('password', generatePassword())
                        setReveal(true)
                      }}
                      aria-label="Generate password"
                      title="Generate password"
                      className={iconBtn}
                    >
                      <Dices size={16} strokeWidth={1.75} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setReveal((r) => !r)}
                      aria-label={reveal ? 'Hide password' : 'Show password'}
                      aria-pressed={reveal}
                      className={iconBtn}
                    >
                      {reveal ? (
                        <EyeOff size={16} strokeWidth={1.75} aria-hidden />
                      ) : (
                        <Eye size={16} strokeWidth={1.75} aria-hidden />
                      )}
                    </button>
                  </div>
                  {form.errors.password ? (
                    <p role="alert" className="text-xs text-error">
                      {form.errors.password}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      At least 6 characters. You’ll see it once after the link is created.
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <span id="expiry-label" className={labelCls}>
                Expires
              </span>
              <ToggleGroup
                aria-labelledby="expiry-label"
                value={[preset]}
                onValueChange={(next) => next[0] && pickPreset(next[0] as Preset)}
                className="grid grid-cols-4 gap-1 rounded-md border border-border p-0.5"
              >
                {(
                  [
                    ['7', '7 days'],
                    ['14', '14 days'],
                    ['30', '30 days'],
                    ['custom', 'Custom'],
                  ] as const
                ).map(([value, label]) => (
                  <Toggle
                    key={value}
                    value={value}
                    className="h-8 rounded-sm text-[13px] text-muted-foreground transition-colors hover:text-foreground data-[pressed]:bg-secondary data-[pressed]:text-foreground"
                  >
                    {label}
                  </Toggle>
                ))}
              </ToggleGroup>
              {preset === 'custom' ? (
                <input
                  type="date"
                  value={data.expiresAt ?? ''}
                  min={inDays(0)}
                  onChange={(e) => setData('expiresAt', e.target.value || null)}
                  aria-labelledby="expiry-label"
                  aria-invalid={!!form.errors.expiresAt}
                  className={`${inputCls} font-mono`}
                />
              ) : (
                data.expiresAt && (
                  <p className="text-xs text-muted-foreground">
                    Works through {shortDate(`${data.expiresAt}T12:00:00Z`)}, end of day UTC.
                  </p>
                )
              )}
              {form.errors.expiresAt && (
                <p role="alert" className="text-xs text-error">
                  {form.errors.expiresAt}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <span id="limit-label" className={labelCls}>
                  View limit
                </span>
                <Toggler
                  checked={limitOn}
                  onChange={setLimitOn}
                  label="Limit the number of views"
                />
              </div>
              {limitOn && (
                <NumberField.Root
                  value={data.maxViews}
                  onValueChange={(v) => setData('maxViews', v)}
                  min={1}
                  max={1_000_000}
                  step={1}
                  smallStep={1}
                >
                  <NumberField.Group className="flex h-9 overflow-hidden rounded-md border border-border-strong bg-surface">
                    <NumberField.Decrement
                      aria-label="Fewer views"
                      className="flex w-9 items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <Minus size={16} strokeWidth={1.75} aria-hidden />
                    </NumberField.Decrement>
                    <NumberField.Input
                      aria-labelledby="limit-label"
                      className="w-full min-w-0 bg-transparent px-2 text-center font-mono text-sm"
                    />
                    <NumberField.Increment
                      aria-label="More views"
                      className="flex w-9 items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <Plus size={16} strokeWidth={1.75} aria-hidden />
                    </NumberField.Increment>
                  </NumberField.Group>
                </NumberField.Root>
              )}
              {form.errors.maxViews && (
                <p role="alert" className="text-xs text-error">
                  {form.errors.maxViews}
                </p>
              )}
            </div>

            {/* The admission stub previews exactly what this link will admit. */}
            <ShareTicket
              used={share?.viewCount ?? 0}
              cap={limitOn ? data.maxViews : null}
              expiresAt={stubExpiry}
              locked={passwordOn}
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Admits
              </p>
              <p className="mt-1 truncate font-display text-base/6 font-semibold">
                {data.name.trim() || 'Untitled share'}
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{typeLine}</p>
            </ShareTicket>

            <div className="flex flex-col gap-2 max-lg:hidden">
              {action(`${primaryBtn} w-full`)}
              {blocker && (
                <p id="blocker" className="text-xs text-muted-foreground">
                  {blocker}
                </p>
              )}
            </div>
          </Card>
        </aside>

        {/* < 1024px: the rail stacks under Contents and this bar holds the single create trigger. */}
        <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-3 border-t border-border bg-background/95 px-4 py-3 md:left-[var(--sidebar-rail)] lg:hidden">
          <p className="min-w-0 flex-1 text-xs text-muted-foreground">{blocker}</p>
          {action(`${primaryBtn} shrink-0`)}
        </div>
      </form>
    </Page>
  )
}

ShareForm.layout = [AppLayout]
