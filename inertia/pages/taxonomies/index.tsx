import { useId, useState, type ReactNode } from 'react'
import { router } from '@inertiajs/react'
import { Accordion } from '@base-ui/react/accordion'
import { AlertDialog } from '@base-ui/react/alert-dialog'
import { Tabs } from '@base-ui/react/tabs'
import { Check, ChevronRight, Pencil, Plus, Trash2, TriangleAlert, X } from 'lucide-react'
import { Card } from '~/components/card'
import Page from '~/components/page'
import AppLayout from '~/layouts/app'

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type Usage = { caseStudies: number; shares: number }
type Leaf = { id: string; name: string } & Usage
type KeyBusiness = Leaf & { clients: number }
type Industry = Leaf & { keyBusinesses: KeyBusiness[] }
type Sector = Leaf & { industries: Industry[] }

type Kind = 'sector' | 'industry' | 'key-business' | 'work-category' | 'service' | 'business-model'

type TaxonomiesProps = {
  sectors: Sector[]
  workCategories: Leaf[]
  services: Leaf[]
  businessModels: Leaf[]
}

/** Everything the delete dialog needs about the row being removed. */
type DeleteTarget = {
  kind: Kind
  node: Leaf & { clients?: number }
  /** Direct children that must be removed first, e.g. "3 industries". */
  children: string | null
}

const LABEL: Record<Kind, string> = {
  'sector': 'sector',
  'industry': 'industry',
  'key-business': 'key business',
  'work-category': 'work category',
  'service': 'service',
  'business-model': 'business model',
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

const iconBtn =
  'inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground'
const ghostBtn =
  'inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground'
const secondaryBtn =
  'inline-flex h-9 items-center gap-2 rounded-md bg-secondary px-3 text-sm font-medium transition-colors hover:bg-secondary/70'

const base = (kind: Kind) => `/taxonomies/${kind}`

/** Inertia visit that keeps scroll and component state (open panels, tab). */
function mutate(
  method: 'post' | 'put',
  url: string,
  data: Record<string, string>,
  done: { onSuccess: () => void; onError: (message: string) => void; onFinish: () => void }
) {
  router[method](url, data, {
    preserveScroll: true,
    preserveState: true,
    onSuccess: done.onSuccess,
    onError: (errors) => done.onError(errors.name ?? 'Something went wrong. Try again.'),
    onFinish: done.onFinish,
  })
}

/* -------------------------------------------------------------------------- */
/* Pieces                                                                      */
/* -------------------------------------------------------------------------- */

/** Usage meta: mono 12 muted, only non-zero parts. */
function UsageMeta({ node }: { node: Leaf & { clients?: number } }) {
  const parts = [
    plural(node.caseStudies, 'study', 'studies'),
    ...(node.shares ? [plural(node.shares, 'rule', 'rules')] : []),
    ...(node.clients ? [plural(node.clients, 'client', 'clients')] : []),
  ]
  return (
    <span className="shrink-0 font-mono text-xs text-muted-foreground max-sm:hidden">
      {parts.join(' · ')}
    </span>
  )
}

/** Name input with Save / Cancel. Enter saves, Escape cancels. */
function NameForm({
  initial = '',
  label,
  submitLabel,
  onSubmit,
  onCancel,
  className = '',
}: {
  initial?: string
  label: string
  submitLabel: string
  onSubmit: (
    name: string,
    done: { onSuccess: () => void; onError: (m: string) => void; onFinish: () => void }
  ) => void
  onCancel: () => void
  className?: string
}) {
  const [name, setName] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const errId = useId()

  const submit = () => {
    const value = name.trim()
    if (!value) return setError('Enter a name.')
    if (value === initial) return onCancel()
    setBusy(true)
    setError(null)
    onSubmit(value, { onSuccess: onCancel, onError: setError, onFinish: () => setBusy(false) })
  }

  return (
    <form
      className={`flex min-w-0 flex-1 flex-col gap-1 ${className}`}
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation()
          onCancel()
        }
      }}
    >
      <div className="flex items-center gap-1">
        <input
          autoFocus
          value={name}
          maxLength={120}
          onChange={(e) => setName(e.target.value)}
          aria-label={label}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errId : undefined}
          className="h-8 min-w-0 flex-1 rounded-md border border-border-strong bg-surface px-2 text-sm aria-[invalid=true]:border-error"
        />
        <button
          type="submit"
          disabled={busy}
          aria-label={submitLabel}
          className={`${iconBtn} text-primary disabled:opacity-50`}
        >
          <Check size={16} strokeWidth={1.75} aria-hidden />
        </button>
        <button type="button" onClick={onCancel} aria-label="Cancel" className={iconBtn}>
          <X size={16} strokeWidth={1.75} aria-hidden />
        </button>
      </div>
      {error && (
        <p id={errId} role="alert" className="text-xs text-error">
          {error}
        </p>
      )}
    </form>
  )
}

/** Rename + delete buttons for one row. */
function RowActions({
  name,
  onRename,
  onDelete,
}: {
  name: string
  onRename: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex shrink-0 items-center">
      <button type="button" onClick={onRename} aria-label={`Rename ${name}`} className={iconBtn}>
        <Pencil size={16} strokeWidth={1.75} aria-hidden />
      </button>
      <button type="button" onClick={onDelete} aria-label={`Delete ${name}`} className={iconBtn}>
        <Trash2 size={16} strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  )
}

/** Controls which row is being renamed and which "Add" form is open (one at a time). */
type Editor = {
  editing: string | null
  setEditing: (id: string | null) => void
  adding: string | null
  setAdding: (key: string | null) => void
  askDelete: (t: DeleteTarget) => void
}

/** "Add {thing}" ghost button that swaps into a NameForm. */
function AddRow({
  editor,
  slot,
  kind,
  parentId,
  className = '',
}: {
  editor: Editor
  /** Unique key for this add slot, e.g. `industry:<sectorId>`. */
  slot: string
  kind: Kind
  parentId?: string
  className?: string
}) {
  const label = LABEL[kind]
  if (editor.adding !== slot) {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={() => {
            editor.setEditing(null)
            editor.setAdding(slot)
          }}
          className={ghostBtn}
        >
          <Plus size={16} strokeWidth={1.75} aria-hidden /> Add {label}
        </button>
      </div>
    )
  }
  return (
    <div className={`flex ${className}`}>
      <NameForm
        label={`New ${label} name`}
        submitLabel={`Add ${label}`}
        onCancel={() => editor.setAdding(null)}
        onSubmit={(name, done) =>
          mutate('post', base(kind), { name, ...(parentId ? { parentId } : {}) }, done)
        }
      />
    </div>
  )
}

/** Blank contact-sheet frames: line art with one accent frame (empty-state illustration). */
function BlankFrames() {
  return (
    <svg
      width="120"
      height="80"
      viewBox="0 0 120 80"
      fill="none"
      strokeWidth="1.5"
      aria-hidden
      className="text-muted-foreground"
    >
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={4 + (i % 2) * 58}
          y={4 + Math.floor(i / 2) * 38}
          width="54"
          height="34"
          rx="3"
          stroke={i === 3 ? 'var(--accent)' : 'currentColor'}
        />
      ))}
    </svg>
  )
}

function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <BlankFrames />
      <h3 className="font-display text-base/6 font-semibold">{title}</h3>
      <div className="flex w-full max-w-sm justify-center">{children}</div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Flat lists                                                                  */
/* -------------------------------------------------------------------------- */

function FlatList({
  kind,
  items,
  editor,
}: {
  kind: Exclude<Kind, 'sector' | 'industry' | 'key-business'>
  items: Leaf[]
  editor: Editor
}) {
  const label = LABEL[kind]
  return (
    <Card className="overflow-hidden p-0">
      {items.length === 0 ? (
        <EmptyState title={`No ${label}s yet.`}>
          <AddRow editor={editor} slot={kind} kind={kind} />
        </EmptyState>
      ) : (
        <>
          <ul className="divide-y divide-border">
            {items.map((n) => (
              <li key={n.id} className="flex min-h-11 items-center gap-3 px-4 py-1">
                {editor.editing === n.id ? (
                  <NameForm
                    initial={n.name}
                    label={`Rename ${n.name}`}
                    submitLabel="Save name"
                    onCancel={() => editor.setEditing(null)}
                    onSubmit={(name, done) =>
                      mutate('put', `${base(kind)}/${n.id}`, { name }, done)
                    }
                  />
                ) : (
                  <>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{n.name}</span>
                    <UsageMeta node={n} />
                    <RowActions
                      name={n.name}
                      onRename={() => {
                        editor.setAdding(null)
                        editor.setEditing(n.id)
                      }}
                      onDelete={() => editor.askDelete({ kind, node: n, children: null })}
                    />
                  </>
                )}
              </li>
            ))}
          </ul>
          <AddRow
            editor={editor}
            slot={kind}
            kind={kind}
            className="border-t border-border px-2 py-2"
          />
        </>
      )}
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/* Sector tree                                                                 */
/* -------------------------------------------------------------------------- */

const chevron =
  'shrink-0 text-muted-foreground transition-transform duration-[120ms] group-data-[panel-open]:rotate-90 motion-reduce:transition-none'

const triggerCls =
  'group flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-md py-1 text-left hover:text-primary'

/** Header row shared by sector and industry items: trigger on the left, actions on the right. */
function BranchHeader({
  kind,
  node,
  editor,
  childLabel,
  childCount,
  nameClass,
}: {
  kind: 'sector' | 'industry'
  node: Leaf
  editor: Editor
  childLabel: string
  childCount: number
  nameClass: string
}) {
  return (
    <Accordion.Header className="flex items-center gap-3">
      {editor.editing === node.id ? (
        <NameForm
          initial={node.name}
          label={`Rename ${node.name}`}
          submitLabel="Save name"
          className="py-1.5"
          onCancel={() => editor.setEditing(null)}
          onSubmit={(name, done) => mutate('put', `${base(kind)}/${node.id}`, { name }, done)}
        />
      ) : (
        <>
          <Accordion.Trigger className={triggerCls}>
            <ChevronRight size={16} strokeWidth={1.75} className={chevron} aria-hidden />
            <span className={`min-w-0 truncate ${nameClass}`}>{node.name}</span>
            <span className="shrink-0 font-mono text-xs text-muted-foreground">{childCount}</span>
            <span className="sr-only">{childLabel}</span>
          </Accordion.Trigger>
          <UsageMeta node={node} />
          <RowActions
            name={node.name}
            onRename={() => {
              editor.setAdding(null)
              editor.setEditing(node.id)
            }}
            onDelete={() =>
              editor.askDelete({
                kind,
                node,
                children: childCount
                  ? plural(
                      childCount,
                      childLabel,
                      kind === 'sector' ? 'industries' : 'key businesses'
                    )
                  : null,
              })
            }
          />
        </>
      )}
    </Accordion.Header>
  )
}

const panelCls =
  'h-[var(--accordion-panel-height)] overflow-hidden transition-[height] duration-[180ms] ease-[var(--ease-out)] data-[ending-style]:h-0 data-[starting-style]:h-0 motion-reduce:transition-none'

function KeyBusinessRow({ kb, editor }: { kb: KeyBusiness; editor: Editor }) {
  return (
    <li className="flex min-h-10 items-center gap-3 border-t border-border/60 py-0.5">
      {editor.editing === kb.id ? (
        <NameForm
          initial={kb.name}
          label={`Rename ${kb.name}`}
          submitLabel="Save name"
          className="py-1"
          onCancel={() => editor.setEditing(null)}
          onSubmit={(name, done) =>
            mutate('put', `${base('key-business')}/${kb.id}`, { name }, done)
          }
        />
      ) : (
        <>
          <span className="min-w-0 flex-1 truncate pl-6 text-sm">{kb.name}</span>
          <UsageMeta node={kb} />
          <RowActions
            name={kb.name}
            onRename={() => {
              editor.setAdding(null)
              editor.setEditing(kb.id)
            }}
            onDelete={() => editor.askDelete({ kind: 'key-business', node: kb, children: null })}
          />
        </>
      )}
    </li>
  )
}

function IndustryItem({ industry, editor }: { industry: Industry; editor: Editor }) {
  return (
    <Accordion.Item value={industry.id} className="border-t border-border/60">
      <BranchHeader
        kind="industry"
        node={industry}
        editor={editor}
        childLabel="key business"
        childCount={industry.keyBusinesses.length}
        nameClass="text-sm font-medium"
      />
      <Accordion.Panel className={panelCls}>
        <ul className="pb-1 pl-6">
          {industry.keyBusinesses.map((kb) => (
            <KeyBusinessRow key={kb.id} kb={kb} editor={editor} />
          ))}
        </ul>
        <AddRow
          editor={editor}
          slot={`key-business:${industry.id}`}
          kind="key-business"
          parentId={industry.id}
          className="mb-1 pl-12"
        />
      </Accordion.Panel>
    </Accordion.Item>
  )
}

function SectorItem({ sector, editor }: { sector: Sector; editor: Editor }) {
  return (
    <Accordion.Item value={sector.id} className="border-t border-border first:border-t-0">
      <div className="px-4">
        <BranchHeader
          kind="sector"
          node={sector}
          editor={editor}
          childLabel="industry"
          childCount={sector.industries.length}
          nameClass="font-display text-base/6 font-semibold"
        />
      </div>
      <Accordion.Panel className={panelCls}>
        <div className="pb-2 pl-10 pr-4">
          <Accordion.Root multiple>
            {sector.industries.map((i) => (
              <IndustryItem key={i.id} industry={i} editor={editor} />
            ))}
          </Accordion.Root>
          <AddRow
            editor={editor}
            slot={`industry:${sector.id}`}
            kind="industry"
            parentId={sector.id}
            className="mt-1"
          />
        </div>
      </Accordion.Panel>
    </Accordion.Item>
  )
}

function SectorTree({ sectors, editor }: { sectors: Sector[]; editor: Editor }) {
  return (
    <Card className="overflow-hidden p-0">
      {sectors.length === 0 ? (
        <EmptyState title="No sectors yet.">
          <AddRow editor={editor} slot="sector" kind="sector" />
        </EmptyState>
      ) : (
        <>
          <Accordion.Root multiple>
            {sectors.map((s) => (
              <SectorItem key={s.id} sector={s} editor={editor} />
            ))}
          </Accordion.Root>
          <AddRow
            editor={editor}
            slot="sector"
            kind="sector"
            className="border-t border-border px-2 py-2"
          />
        </>
      )}
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/* Delete dialog                                                               */
/* -------------------------------------------------------------------------- */

function DeleteDialog({ target, onClose }: { target: DeleteTarget | null; onClose: () => void }) {
  const [busy, setBusy] = useState(false)
  // Keep the last target mounted while the dialog animates out.
  const [last, setLast] = useState<DeleteTarget | null>(null)
  if (target && target !== last) setLast(target)
  const t = target ?? last

  const uses = t
    ? [
        t.node.caseStudies ? plural(t.node.caseStudies, 'case study', 'case studies') : null,
        t.node.shares ? plural(t.node.shares, 'share rule', 'share rules') : null,
        t.node.clients ? plural(t.node.clients, 'client', 'clients') : null,
      ].filter(Boolean)
    : []
  const blocked = uses.length > 0 || !!t?.children

  const confirm = () => {
    if (!t || blocked) return
    setBusy(true)
    router.delete(`${base(t.kind)}/${t.node.id}`, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: onClose,
      onFinish: () => setBusy(false),
    })
  }

  return (
    <AlertDialog.Root open={!!target} onOpenChange={(open) => !open && onClose()}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/50 transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-50 flex w-[min(440px,92vw)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-lg border border-border-raised bg-surface-raised p-6 shadow-[var(--shadow-raised)] transition-[opacity,scale] duration-[160ms] data-[ending-style]:scale-[0.98] data-[starting-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none">
          <div className="flex flex-col gap-2">
            <AlertDialog.Title className="font-display text-xl/7 font-semibold">
              Delete {t ? `“${t.node.name}”` : ''}?
            </AlertDialog.Title>
            <AlertDialog.Description className="text-sm text-muted-foreground">
              {blocked ? (
                <span className="flex items-start gap-2 text-foreground">
                  <TriangleAlert
                    size={16}
                    strokeWidth={1.75}
                    className="mt-0.5 shrink-0 text-warning"
                    aria-hidden
                  />
                  <span>
                    {uses.length > 0 && (
                      <>Used by {uses.join(', ').replace(/, ([^,]*)$/, ' and $1')}. </>
                    )}
                    {t?.children && <>Contains {t.children}. </>}
                    Reassign or remove {uses.length > 0 ? 'them' : 'those'} before deleting this{' '}
                    {t ? LABEL[t.kind] : 'item'}.
                  </span>
                </span>
              ) : (
                <>
                  This {t ? LABEL[t.kind] : 'item'} isn’t used anywhere. Deleting it can’t be
                  undone.
                </>
              )}
            </AlertDialog.Description>
          </div>
          <div className="flex justify-end gap-2">
            {/* Cancel first in the DOM so it takes initial focus. */}
            <AlertDialog.Close className={secondaryBtn}>Cancel</AlertDialog.Close>
            <button
              type="button"
              onClick={confirm}
              disabled={blocked || busy}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-error px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={16} strokeWidth={1.75} aria-hidden /> Delete
            </button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

const tabCls =
  'relative inline-flex h-10 items-center gap-2 px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[selected]:text-foreground'

export default function Taxonomies({
  sectors,
  workCategories,
  services,
  businessModels,
}: TaxonomiesProps) {
  const [editing, setEditing] = useState<string | null>(null)
  const [adding, setAdding] = useState<string | null>(null)
  const [target, setTarget] = useState<DeleteTarget | null>(null)

  const editor: Editor = {
    editing,
    setEditing,
    adding,
    setAdding,
    askDelete: (t) => {
      setEditing(null)
      setAdding(null)
      setTarget(t)
    },
  }

  const tabs = [
    { value: 'sectors', label: 'Sectors', count: sectors.length },
    { value: 'work-categories', label: 'Work categories', count: workCategories.length },
    { value: 'services', label: 'Services', count: services.length },
    { value: 'business-models', label: 'Business models', count: businessModels.length },
  ]

  return (
    <Page
      title="Taxonomies"
      description="The controlled vocabulary behind case-study classification and share rules."
    >
      <Tabs.Root
        defaultValue="sectors"
        onValueChange={() => {
          setEditing(null)
          setAdding(null)
        }}
        className="pb-8"
      >
        <Tabs.List className="relative mb-4 flex gap-1 overflow-x-auto border-b border-border">
          {tabs.map((t) => (
            <Tabs.Tab key={t.value} value={t.value} className={tabCls}>
              {t.label}
              <span className="font-mono text-xs text-muted-foreground">{t.count}</span>
            </Tabs.Tab>
          ))}
          <Tabs.Indicator className="absolute bottom-0 left-[var(--active-tab-left)] h-0.5 w-[var(--active-tab-width)] rounded-full bg-primary transition-[left,width] duration-[180ms] ease-[var(--ease-out)] motion-reduce:transition-none" />
        </Tabs.List>

        <Tabs.Panel value="sectors">
          <SectorTree sectors={sectors} editor={editor} />
        </Tabs.Panel>
        <Tabs.Panel value="work-categories">
          <FlatList kind="work-category" items={workCategories} editor={editor} />
        </Tabs.Panel>
        <Tabs.Panel value="services">
          <FlatList kind="service" items={services} editor={editor} />
        </Tabs.Panel>
        <Tabs.Panel value="business-models">
          <FlatList kind="business-model" items={businessModels} editor={editor} />
        </Tabs.Panel>
      </Tabs.Root>

      <DeleteDialog target={target} onClose={() => setTarget(null)} />
    </Page>
  )
}

Taxonomies.layout = [AppLayout]
