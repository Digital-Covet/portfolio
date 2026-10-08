import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Dialog, DialogBackdrop, DialogPopup, DialogTitle } from '~/components/ui/dialog'
import {
  AlertDialog,
  AlertBackdrop,
  AlertPopup,
  AlertTitle,
  AlertDescription,
  AlertActions,
} from '~/components/ui/alert_dialog'
import { Tooltip, TooltipPopup } from '~/components/ui/tooltip'
import { Menu, MenuPositioner, MenuPopup, MenuItem } from '~/components/ui/menu'
import { Tabs, PillTab } from '~/components/ui/tabs'
import {
  Briefcase,
  Building2,
  Factory,
  Info,
  Layers,
  MoreHorizontal,
  Network,
  Pencil,
  Plus,
  Tags,
  Trash2,
  Wrench,
} from 'lucide-react'
import AppShell from '~/layouts/app_shell'
import Page from '~/components/page'
import type { InertiaProps } from '~/types'
import type {
  TaxonomiesProps,
  TaxonomyTab,
  TaxonomyType,
  Term,
} from '~/components/taxonomies/types'

type Props = InertiaProps<TaxonomiesProps>

const TABS: Array<{ id: TaxonomyTab; label: string; icon: typeof Layers }> = [
  { id: 'hierarchy', label: 'Hierarchy', icon: Network },
  { id: 'categories', label: 'Work categories', icon: Tags },
  { id: 'services', label: 'Services', icon: Wrench },
  { id: 'models', label: 'Business models', icon: Briefcase },
]

type TaxQuery = {
  tab?: string
  sectorId?: string | null
  industryId?: string | null
}

function goto(query: TaxQuery) {
  router.get('/taxonomies', query as Record<string, string>, {
    preserveState: true,
    preserveScroll: true,
    replace: true,
  })
}

function DisabledHint({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger delay={200} render={<span style={{ display: 'inline-flex' }} />}>
        {children}
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner side="top" sideOffset={8}>
          <TooltipPopup>Only admins can edit taxonomies</TooltipPopup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

function AddRow({
  placeholder,
  disabled,
  onAdd,
}: {
  placeholder: string
  disabled: boolean
  onAdd: (name: string) => void
}) {
  const [value, setValue] = useState('')
  const submit = () => {
    const name = value.trim()
    if (name.length < 2 || disabled) return
    onAdd(name)
    setValue('')
  }
  const input = (
    <input
      className="field__input tx-add__input"
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      aria-label={placeholder}
      maxLength={120}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          submit()
        }
      }}
    />
  )
  const button = (
    <button
      type="button"
      className="btn btn--outline btn--sm"
      disabled={disabled || value.trim().length < 2}
      onClick={submit}
      aria-label={`Add ${placeholder}`}
    >
      <Plus size={14} aria-hidden />
      Add
    </button>
  )
  if (!disabled) {
    return (
      <div className="tx-add">
        {input}
        {button}
      </div>
    )
  }
  return (
    <div className="tx-add">
      <DisabledHint>{input}</DisabledHint>
      <DisabledHint>{button}</DisabledHint>
    </div>
  )
}

function TermRow({
  term,
  active,
  canEdit,
  selectable,
  onSelect,
  onRename,
  onDelete,
}: {
  term: Term
  active?: boolean
  canEdit: boolean
  selectable?: boolean
  onSelect?: () => void
  onRename: (name: string) => void
  onDelete: () => void
}) {
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(term.name)
  const [confirming, setConfirming] = useState(false)

  const row = (
    <div
      className="tx-row"
      data-active={selectable && active ? 'true' : 'false'}
      data-selectable={selectable ? 'true' : 'false'}
    >
      <button
        type="button"
        className="tx-row__main"
        onClick={selectable ? onSelect : undefined}
        aria-current={selectable && active ? 'true' : undefined}
        style={{ cursor: selectable ? 'pointer' : 'default' }}
      >
        <span className="tx-row__name">{term.name}</span>
        <span className="telemetry tx-row__count">{term.count}</span>
      </button>
      {canEdit ? (
        <Menu.Root>
          <Menu.Trigger
            className="iconbtn iconbtn--sm"
            aria-label={`Options for ${term.name}`}
            render={<button type="button" />}
          >
            <MoreHorizontal size={15} aria-hidden />
          </Menu.Trigger>
          <Menu.Portal>
            <MenuPositioner side="bottom" align="end" sideOffset={6}>
              <MenuPopup aria-label={`Options for ${term.name}`}>
                <MenuItem
                  render={<button type="button" />}
                  onClick={() => {
                    setName(term.name)
                    setRenaming(true)
                  }}
                >
                  <Pencil size={14} aria-hidden />
                  Rename
                </MenuItem>
                <MenuItem
                  className="cs-menuitem--danger"
                  render={<button type="button" />}
                  onClick={() => setConfirming(true)}
                >
                  <Trash2 size={14} aria-hidden />
                  Delete
                </MenuItem>
              </MenuPopup>
            </MenuPositioner>
          </Menu.Portal>
        </Menu.Root>
      ) : (
        <DisabledHint>
          <button type="button" className="iconbtn iconbtn--sm" disabled aria-label="No access">
            <MoreHorizontal size={15} aria-hidden />
          </button>
        </DisabledHint>
      )}

      <Dialog.Root open={renaming} onOpenChange={setRenaming}>
        <Dialog.Portal>
          <DialogBackdrop />
          <DialogPopup aria-label={`Rename ${term.name}`}>
            <DialogTitle>Rename “{term.name}”</DialogTitle>
            <div className="field">
              <label className="field__label" htmlFor={`rename-${term.id}`}>
                Name
              </label>
              <input
                id={`rename-${term.id}`}
                className="field__input"
                value={name}
                maxLength={120}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="cs-dialog__actions" style={{ marginTop: 20 }}>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setRenaming(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--primary btn--sm"
                disabled={name.trim().length < 2}
                onClick={() => {
                  onRename(name.trim())
                  setRenaming(false)
                }}
              >
                Save
              </button>
            </div>
          </DialogPopup>
        </Dialog.Portal>
      </Dialog.Root>

      <AlertDialog.Root open={confirming} onOpenChange={setConfirming}>
        <AlertDialog.Portal>
          <AlertBackdrop />
          <AlertPopup aria-label={`Delete ${term.name}`}>
            <AlertTitle>Delete “{term.name}”?</AlertTitle>
            <AlertDescription>
              Child terms delete with their parent. This cannot be undone.
            </AlertDescription>
            <AlertActions>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setConfirming(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--danger btn--sm"
                onClick={() => {
                  onDelete()
                  setConfirming(false)
                }}
              >
                <Trash2 size={14} aria-hidden />
                Delete
              </button>
            </AlertActions>
          </AlertPopup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  )
  return row
}

function TermColumn({
  title,
  icon: Icon,
  terms,
  empty,
  addPlaceholder,
  canEdit,
  activeId,
  selectable,
  onSelect,
  type,
  parentId,
}: {
  title: string
  icon: typeof Layers
  terms: Term[]
  empty: string
  addPlaceholder: string
  canEdit: boolean
  activeId?: string | null
  selectable?: boolean
  onSelect?: (id: string) => void
  type: TaxonomyType
  parentId?: string | null
  parentRequired?: boolean
}) {
  const post = (name: string) => {
    const data: { name: string; sectorId?: string | null; industryId?: string | null } = { name }
    if (type === 'industries') data.sectorId = parentId
    if (type === 'key_businesses') data.industryId = parentId
    router.post(`/taxonomies/${type}`, data, { preserveScroll: true })
  }
  const addDisabled = canEdit
    ? (type === 'industries' && !parentId) || (type === 'key_businesses' && !parentId)
      ? true
      : false
    : true

  return (
    <section className="tx-col" aria-label={title}>
      <header className="tx-col__head">
        <span className="tx-col__title">
          <Icon size={16} aria-hidden />
          {title}
        </span>
        <span className="telemetry tx-col__count">{terms.length}</span>
      </header>
      {terms.length === 0 ? (
        <div className="empty">
          <div className="empty__patch covet-grid covet-grid--auto" aria-hidden>
            <span className="empty__icon">
              <Icon size={24} aria-hidden />
            </span>
          </div>
          <p className="empty__title">{empty}</p>
        </div>
      ) : (
        <ul className="tx-list">
          {terms.map((t) => (
            <li key={t.id}>
              <TermRow
                term={t}
                active={activeId === t.id}
                canEdit={canEdit}
                selectable={selectable}
                onSelect={onSelect ? () => onSelect(t.id) : undefined}
                onRename={(name) =>
                  router.put(`/taxonomies/${type}/${t.id}`, { name }, { preserveScroll: true })
                }
                onDelete={() =>
                  router.delete(`/taxonomies/${type}/${t.id}`, {
                    preserveScroll: true,
                  })
                }
              />
            </li>
          ))}
        </ul>
      )}
      <footer className="tx-col__foot">
        <AddRow placeholder={addPlaceholder} disabled={addDisabled} onAdd={post} />
        {addDisabled && canEdit && (type === 'industries' || type === 'key_businesses') && (
          <p className="tx-hint">Select a parent first.</p>
        )}
      </footer>
    </section>
  )
}

export default function Taxonomies({
  tab,
  canEdit,
  selectedSectorId,
  selectedIndustryId,
  sectors,
  industries,
  keyBusinesses,
  workCategories,
  services,
  businessModels,
}: Props) {
  const total =
    sectors.length +
    industries.length +
    keyBusinesses.length +
    workCategories.length +
    services.length +
    businessModels.length

  const baseQuery = { tab, sectorId: selectedSectorId ?? '', industryId: selectedIndustryId ?? '' }
  const visibleIndustries = industries.filter(
    (i) => selectedSectorId === null || i.sectorId === selectedSectorId
  )
  const visibleKeys = keyBusinesses.filter(
    (k) => selectedIndustryId === null || k.industryId === selectedIndustryId
  )

  return (
    <Page
      title="Taxonomies"
      description={
        <span className="telemetry">{total} terms · Sector → Industry → Key business</span>
      }
    >
      {!canEdit && (
        <div className="alert tx-banner" role="note">
          <Info size={16} aria-hidden style={{ flex: 'none' }} />
          <p>View only. Admins can edit taxonomies.</p>
        </div>
      )}

      <Tabs.Root value={tab} onValueChange={(v) => goto({ ...baseQuery, tab: v })}>
        <Tabs.List className="cs-tabs tx-tabs" aria-label="Taxonomy groups">
          {TABS.map(({ id, label, icon: Icon }) => (
            <PillTab key={id} value={id}>
              <Icon size={15} aria-hidden />
              {label}
            </PillTab>
          ))}
        </Tabs.List>
      </Tabs.Root>

      <p className="visually-hidden" role="status" aria-live="polite">
        {total} terms
      </p>

      {tab === 'hierarchy' && (
        <div className="tx-grid">
          <TermColumn
            title="Sectors"
            icon={Building2}
            terms={sectors}
            empty="No sectors yet"
            addPlaceholder="New sector"
            canEdit={canEdit}
            activeId={selectedSectorId}
            selectable
            onSelect={(id) =>
              goto({ tab, sectorId: id === selectedSectorId ? '' : id, industryId: '' })
            }
            type="sectors"
          />
          <TermColumn
            title="Industries"
            icon={Factory}
            terms={visibleIndustries}
            empty={
              selectedSectorId === null
                ? 'Select a sector to see its industries'
                : 'No industries yet'
            }
            addPlaceholder="New industry"
            canEdit={canEdit}
            activeId={selectedIndustryId}
            selectable
            onSelect={(id) => goto({ tab, sectorId: selectedSectorId ?? '', industryId: id })}
            type="industries"
            parentId={selectedSectorId}
            parentRequired
          />
          <TermColumn
            title="Key businesses"
            icon={Layers}
            terms={visibleKeys}
            empty={
              selectedIndustryId === null
                ? 'Select an industry to see its key businesses'
                : 'No key businesses yet'
            }
            addPlaceholder="New key business"
            canEdit={canEdit}
            type="key_businesses"
            parentId={selectedIndustryId}
            parentRequired
          />
        </div>
      )}

      {tab === 'categories' && (
        <div className="tx-single">
          <TermColumn
            title="Work categories"
            icon={Tags}
            terms={workCategories}
            empty="No work categories yet"
            addPlaceholder="New category"
            canEdit={canEdit}
            type="work_categories"
          />
        </div>
      )}
      {tab === 'services' && (
        <div className="tx-single">
          <TermColumn
            title="Services"
            icon={Wrench}
            terms={services}
            empty="No services yet"
            addPlaceholder="New service"
            canEdit={canEdit}
            type="services"
          />
        </div>
      )}
      {tab === 'models' && (
        <div className="tx-single">
          <TermColumn
            title="Business models"
            icon={Briefcase}
            terms={businessModels}
            empty="No business models yet"
            addPlaceholder="New business model"
            canEdit={canEdit}
            type="business_models"
          />
        </div>
      )}
    </Page>
  )
}

Taxonomies.layout = (page: React.ReactNode) => <AppShell>{page}</AppShell>
