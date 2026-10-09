import { useMemo, useRef, useState, type FormEvent } from 'react'
import { useForm } from '@inertiajs/react'
import { Dialog } from '@base-ui/react/dialog'
import { Drawer } from '@base-ui/react/drawer'
import { Field } from '@base-ui/react/field'
import { Input } from '@base-ui/react/input'
import { Building2, ImagePlus, Plus, Search, Trash2, X } from 'lucide-react'
import { Card } from '~/components/card'
import Page from '~/components/page'
import AppLayout from '~/layouts/app'

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type KeyBusiness = { id: string; name: string }

type ClientRow = {
  id: string
  name: string
  logo: string | null
  logoFileId: string | null
  studies: number
  keyBusinesses: KeyBusiness[]
  updatedAt: string
}

type KeyBusinessOption = KeyBusiness & { industry: string; sector: string }

/** Mirrors the props sent by app/controllers/clients_controller.ts. */
type ClientsProps = {
  clients: ClientRow[]
  keyBusinessOptions: KeyBusinessOption[]
}

type FormData = {
  name: string
  logoFileId: string | null
  keyBusinessIds: string[]
}

const MAX_CHIPS = 3

const secondaryBtn =
  'inline-flex h-9 items-center gap-2 rounded-md bg-secondary px-3 text-sm font-medium transition-colors hover:bg-secondary/70'
const primaryBtn =
  'inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50'
const inputCls =
  'h-9 w-full rounded-md border border-border-strong bg-surface px-3 text-sm placeholder:text-muted-foreground'

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const rtf = new Intl.RelativeTimeFormat('en-GB', { numeric: 'auto' })

function relativeTime(iso: string) {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ]
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit)
  }
  return 'just now'
}

function cookie(name: string) {
  const hit = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`))
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : ''
}

/* -------------------------------------------------------------------------- */
/* Logo tile: a 4:3 contact-sheet frame                                        */
/* -------------------------------------------------------------------------- */

function LogoTile({ src, size = 40 }: { src: string | null; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-sm bg-surface-raised ring-1 ring-border"
      style={{ width: size, height: (size * 3) / 4 }}
    >
      {src ? (
        <img src={src} alt="" className="size-full object-contain" loading="lazy" />
      ) : (
        <Building2 size={16} strokeWidth={1.75} className="text-muted-foreground" aria-hidden />
      )}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/* Form (shared by the New dialog and the edit drawer)                          */
/* -------------------------------------------------------------------------- */

function KeyBusinessPicker({
  options,
  value,
  onChange,
}: {
  options: KeyBusinessOption[]
  value: string[]
  onChange: (ids: string[]) => void
}) {
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const groups = useMemo(() => {
    const filtered = options.filter(
      (o) => !needle || `${o.name} ${o.industry} ${o.sector}`.toLowerCase().includes(needle)
    )
    const map = new Map<string, KeyBusinessOption[]>()
    for (const o of filtered) {
      const key = `${o.sector} › ${o.industry}`
      map.set(key, [...(map.get(key) ?? []), o])
    }
    return [...map.entries()]
  }, [options, needle])

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 flex w-full items-center justify-between text-[13px]/[18px] font-medium">
        Key businesses
        <span className="font-mono text-xs font-normal text-muted-foreground">
          {value.length} selected
        </span>
      </legend>
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
          placeholder="Filter key businesses"
          aria-label="Filter key businesses"
          className={`${inputCls} pl-8`}
        />
      </div>
      <div className="max-h-56 overflow-y-auto rounded-md border border-border p-1">
        {groups.length === 0 && (
          <p className="px-2 py-3 text-sm text-muted-foreground">No key businesses match.</p>
        )}
        {groups.map(([label, items]) => (
          <div key={label} className="py-1">
            <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {label}
            </p>
            {items.map((o) => (
              <label
                key={o.id}
                className="flex min-h-8 cursor-pointer items-center gap-2 rounded-sm px-2 text-sm hover:bg-secondary"
              >
                <input
                  type="checkbox"
                  checked={value.includes(o.id)}
                  onChange={() => toggle(o.id)}
                  className="size-4 accent-[var(--primary)]"
                />
                {o.name}
              </label>
            ))}
          </div>
        ))}
      </div>
    </fieldset>
  )
}

function ClientForm({
  client,
  options,
  onDone,
  submitLabel,
}: {
  client: ClientRow | null
  options: KeyBusinessOption[]
  onDone: () => void
  submitLabel: string
}) {
  const form = useForm<FormData>({
    name: client?.name ?? '',
    logoFileId: client?.logoFileId ?? null,
    keyBusinessIds: client?.keyBusinesses.map((k) => k.id) ?? [],
  })
  const [logo, setLogo] = useState<string | null>(client?.logo ?? null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const upload = async (file: File) => {
    setUploading(true)
    setUploadError(null)
    try {
      const body = new FormData()
      body.set('kind', 'image')
      body.set('file', file)
      const res = await fetch('/uploads', {
        method: 'POST',
        body,
        headers: { 'X-XSRF-TOKEN': cookie('XSRF-TOKEN'), 'Accept': 'application/json' },
        credentials: 'same-origin',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Upload failed. Try again.')
      form.setData('logoFileId', json.id)
      setLogo(json.url)
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed. Try again.')
    } finally {
      setUploading(false)
    }
  }

  const removeLogo = () => {
    form.setData('logoFileId', null)
    setLogo(null)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const opts = { preserveScroll: true, onSuccess: onDone }
    if (client) form.put(`/clients/${client.id}`, opts)
    else form.post('/clients', opts)
  }

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col gap-5">
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pr-1">
        <Field.Root name="name" invalid={!!form.errors.name} className="flex flex-col gap-1.5">
          <Field.Label className="text-[13px]/[18px] font-medium">Name</Field.Label>
          <Input
            required
            maxLength={255}
            value={form.data.name}
            onChange={(e) => form.setData('name', e.target.value)}
            className={inputCls}
          />
          <Field.Error match={!!form.errors.name} className="text-xs text-error">
            {form.errors.name}
          </Field.Error>
        </Field.Root>

        <div className="flex flex-col gap-1.5">
          <p className="text-[13px]/[18px] font-medium">Logo</p>
          <div className="flex items-center gap-3">
            <LogoTile src={logo} size={80} />
            <div className="flex flex-col items-start gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                className="sr-only"
                aria-label="Upload logo"
                tabIndex={-1}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void upload(f)
                  e.target.value = ''
                }}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className={secondaryBtn}
              >
                <ImagePlus size={16} strokeWidth={1.75} aria-hidden />
                {uploading ? 'Uploading…' : logo ? 'Replace logo' : 'Upload logo'}
              </button>
              {logo && (
                <button
                  type="button"
                  onClick={removeLogo}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[13px] text-muted-foreground hover:text-foreground"
                >
                  <Trash2 size={16} strokeWidth={1.75} aria-hidden /> Remove
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">PNG, JPG, WebP or AVIF, up to 10 MB.</p>
          {(uploadError || form.errors.logoFileId) && (
            <p role="alert" className="text-xs text-error">
              {uploadError ?? 'That logo could not be used. Upload it again.'}
            </p>
          )}
        </div>

        <KeyBusinessPicker
          options={options}
          value={form.data.keyBusinessIds}
          onChange={(ids) => form.setData('keyBusinessIds', ids)}
        />
      </div>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <button type="button" onClick={onDone} className={secondaryBtn}>
          Cancel
        </button>
        <button type="submit" disabled={form.processing || uploading} className={primaryBtn}>
          {form.processing ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}

/* -------------------------------------------------------------------------- */
/* Dialog + Drawer shells                                                       */
/* -------------------------------------------------------------------------- */

function NewClientDialog({
  open,
  onOpenChange,
  options,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  options: KeyBusinessOption[]
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/50 transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 flex max-h-[min(90svh,720px)] w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-lg border border-border-raised bg-surface-raised p-6 shadow-[var(--shadow-raised)] transition-[opacity,transform] duration-[180ms] data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 motion-reduce:transition-none">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-xl/7 font-semibold">
                New client
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Clients are attached to case studies and can be reused across shares.
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Close"
              className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X size={16} strokeWidth={1.75} aria-hidden />
            </Dialog.Close>
          </div>
          {/* Mounted only while open so the form resets every time. */}
          <ClientForm
            client={null}
            options={options}
            submitLabel="Add client"
            onDone={() => onOpenChange(false)}
          />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function EditClientDrawer({
  client,
  onClose,
  options,
}: {
  client: ClientRow | null
  onClose: () => void
  options: KeyBusinessOption[]
}) {
  // Keep the last client rendered while the exit transition runs.
  const last = useRef<ClientRow | null>(null)
  if (client) last.current = client
  const shown = client ?? last.current

  return (
    <Drawer.Root open={!!client} onOpenChange={(open) => !open && onClose()} swipeDirection="right">
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-40 bg-black/50 transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Drawer.Viewport className="fixed inset-0 z-50 flex justify-end">
          <Drawer.Popup className="flex h-full w-[min(100vw,440px)] flex-col gap-4 border-l border-border-raised bg-surface-raised p-6 shadow-[var(--shadow-raised)] transition-transform duration-[180ms] ease-[var(--ease-out)] data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full motion-reduce:transition-none">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <Drawer.Title className="truncate font-display text-xl/7 font-semibold">
                  {shown?.name ?? 'Edit client'}
                </Drawer.Title>
                <Drawer.Description className="mt-1 text-sm text-muted-foreground">
                  {shown
                    ? `${shown.studies} case ${shown.studies === 1 ? 'study' : 'studies'} · edited ${relativeTime(shown.updatedAt)}`
                    : ''}
                </Drawer.Description>
              </div>
              <Drawer.Close
                aria-label="Close"
                className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X size={16} strokeWidth={1.75} aria-hidden />
              </Drawer.Close>
            </div>
            {shown && (
              <ClientForm
                key={shown.id}
                client={shown}
                options={options}
                submitLabel="Save changes"
                onDone={onClose}
              />
            )}
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

/* -------------------------------------------------------------------------- */
/* Table                                                                        */
/* -------------------------------------------------------------------------- */

function Chips({ items }: { items: KeyBusiness[] }) {
  if (items.length === 0) return <span className="text-muted-foreground">—</span>
  const rest = items.slice(MAX_CHIPS)
  return (
    <ul className="flex flex-wrap gap-1">
      {items.slice(0, MAX_CHIPS).map((k) => (
        <li
          key={k.id}
          className="inline-flex h-6 items-center rounded-full bg-secondary px-2 text-xs"
        >
          {k.name}
        </li>
      ))}
      {rest.length > 0 && (
        <li
          title={rest.map((k) => k.name).join(', ')}
          className="inline-flex h-6 items-center rounded-full border border-border px-2 font-mono text-xs text-muted-foreground"
        >
          +{rest.length}
          <span className="sr-only"> more: {rest.map((k) => k.name).join(', ')}</span>
        </li>
      )}
    </ul>
  )
}

function ClientsTable({ rows, onEdit }: { rows: ClientRow[]; onEdit: (c: ClientRow) => void }) {
  const th = 'h-10 px-4 text-left text-xs font-medium text-muted-foreground'
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-[13px]/[18px]">
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className={th}>
              Client
            </th>
            <th scope="col" className={`${th} w-28`}>
              Studies
            </th>
            <th scope="col" className={`${th} max-md:hidden`}>
              Key businesses
            </th>
            <th scope="col" className={`${th} w-36 max-lg:hidden`}>
              Updated
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr
              key={c.id}
              onClick={() => onEdit(c)}
              className="h-14 cursor-pointer border-b border-border last:border-b-0 hover:bg-secondary/50"
            >
              <td className="px-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(c)
                  }}
                  className="flex items-center gap-3 rounded-sm text-left"
                >
                  <LogoTile src={c.logo} />
                  <span className="font-medium">{c.name}</span>
                </button>
              </td>
              <td className="px-4 font-mono text-xs text-muted-foreground">{c.studies}</td>
              <td className="px-4 max-md:hidden">
                <Chips items={c.keyBusinesses} />
              </td>
              <td className="px-4 text-muted-foreground max-lg:hidden">
                {relativeTime(c.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Blank contact-sheet frames with one accent detail (the kit's empty-state art). */
function EmptyIllustration() {
  return (
    <svg width={96} height={43} viewBox="0 0 120 54" fill="none" aria-hidden>
      {[0, 42, 84].map((x, i) => (
        <rect
          key={x}
          x={x + 1}
          y={1}
          width={34}
          height={26}
          rx={2}
          stroke={i === 1 ? 'var(--accent)' : 'var(--muted-foreground)'}
          strokeWidth={1.5}
        />
      ))}
      {[0, 42, 84].map((x) => (
        <rect
          key={x}
          x={x + 1}
          y={29}
          width={34}
          height={24}
          rx={2}
          stroke="var(--muted-foreground)"
          strokeWidth={1.5}
          opacity={0.6}
        />
      ))}
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/* Page                                                                         */
/* -------------------------------------------------------------------------- */

export default function Clients({ clients, keyBusinessOptions }: ClientsProps) {
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const needle = query.trim().toLowerCase()
  const rows = useMemo(
    () =>
      needle
        ? clients.filter(
            (c) =>
              c.name.toLowerCase().includes(needle) ||
              c.keyBusinesses.some((k) => k.name.toLowerCase().includes(needle))
          )
        : clients,
    [clients, needle]
  )
  // Looked up by id so the drawer reflects fresh props after a save.
  const editing = clients.find((c) => c.id === editingId) ?? null

  return (
    <Page
      title="Clients"
      description={`${clients.length} ${clients.length === 1 ? 'client' : 'clients'}`}
      wide
      actions={
        <button type="button" onClick={() => setCreating(true)} className={primaryBtn}>
          <Plus size={16} strokeWidth={1.75} aria-hidden /> New client
        </button>
      }
    >
      {clients.length > 0 && (
        <div className="mb-4 flex h-12 items-center">
          <div className="relative w-full sm:w-72">
            <Search
              size={16}
              strokeWidth={1.75}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or key business"
              aria-label="Search clients"
              className={`${inputCls} pl-8`}
            />
          </div>
        </div>
      )}

      <Card className="p-0">
        {clients.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <EmptyIllustration />
            <p className="font-display text-base/6 font-semibold">Add your first client.</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <EmptyIllustration />
            <p className="font-display text-base/6 font-semibold">No clients match “{query}”.</p>
            <button type="button" onClick={() => setQuery('')} className={secondaryBtn}>
              Clear search
            </button>
          </div>
        ) : (
          <ClientsTable rows={rows} onEdit={(c) => setEditingId(c.id)} />
        )}
      </Card>

      <NewClientDialog open={creating} onOpenChange={setCreating} options={keyBusinessOptions} />
      <EditClientDrawer
        client={editing}
        onClose={() => setEditingId(null)}
        options={keyBusinessOptions}
      />
    </Page>
  )
}

Clients.layout = [AppLayout]
