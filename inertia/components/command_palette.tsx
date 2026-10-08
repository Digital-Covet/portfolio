import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Dialog, DialogBackdrop, DialogPopup } from '~/components/ui/dialog'
import { usePage } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import {
  Search,
  LayoutDashboard,
  LibraryBig,
  Link2,
  Building2,
  Network,
  Plus,
  X,
} from 'lucide-react'
import { urlFor } from '~/client'

const RANK = { employee: 0, admin: 1, superadmin: 2 } as const
type Role = keyof typeof RANK

type PaletteAction = {
  label: string
  hint: string
  icon: typeof LayoutDashboard
  minRole?: Role
} & ({ route: 'dashboard' } | { href: string })

const ACTIONS: PaletteAction[] = [
  { label: 'Go to Dashboard', hint: 'Workspace', icon: LayoutDashboard, route: 'dashboard' },
  { label: 'Go to Case studies', hint: 'Workspace', icon: LibraryBig, href: '/case-studies' },
  { label: 'Go to Shares', hint: 'Workspace', icon: Link2, href: '/shares' },
  {
    label: 'Go to Clients',
    hint: 'Library · admin',
    icon: Building2,
    href: '/clients',
    minRole: 'admin',
  },
  {
    label: 'Go to Taxonomies',
    hint: 'Library · admin',
    icon: Network,
    href: '/taxonomies',
    minRole: 'admin',
  },
  { label: 'New case study', hint: 'Create', icon: Plus, href: '/case-studies/new' },
  { label: 'New share', hint: 'Create', icon: Plus, href: '/shares/new' },
]

function actionsForRole(role: Role) {
  return ACTIONS.filter((a) => !a.minRole || RANK[role] >= RANK[a.minRole])
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const onOpen = () => setOpen(true)
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('shell:open-palette', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('shell:open-palette', onOpen)
    }
  }, [])
  return { open, setOpen }
}

export function openPalette() {
  window.dispatchEvent(new Event('shell:open-palette'))
}

export default function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { props } = usePage()
  const role = ((props.user?.role as Role) ?? 'employee') as Role
  const [q, setQ] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const items = useMemo(() => {
    const allowed = actionsForRole(role)
    const query = q.toLowerCase()
    return allowed.filter((a) => a.label.toLowerCase().includes(query))
  }, [q, role])

  const highlightedIndex = items.length === 0 ? 0 : Math.min(activeIndex, items.length - 1)

  const activate = useCallback((index: number) => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-palette-index="${index}"]`)
    el?.click()
  }, [])

  const onListKeyDown = (e: React.KeyboardEvent) => {
    if (items.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % items.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i - 1 + items.length) % items.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      activate(highlightedIndex)
    }
  }

  const rowStyle = (selected: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '9px 10px',
    borderRadius: 'var(--radius)',
    fontSize: 13,
    color: 'var(--fg-1)',
    textDecoration: 'none',
    background: selected ? 'color-mix(in srgb, var(--primary) 10%, transparent)' : 'transparent',
    border: 0,
    cursor: 'pointer',
    textAlign: 'left',
  })

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) {
          setQ('')
          setActiveIndex(0)
        }
      }}
    >
      <Dialog.Portal>
        <DialogBackdrop style={{ zIndex: 90 }} />
        <DialogPopup
          role="dialog"
          aria-label="Command palette"
          style={{
            position: 'fixed',
            top: '12vh',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(560px, calc(100vw - 32px))',
            background: 'var(--popover)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 12px 32px rgb(0 0 0 / .5)',
            zIndex: 95,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 12px 8px',
              borderBottom: '1px solid var(--hairline)',
            }}
          >
            <Search size={16} aria-hidden style={{ color: 'var(--fg-3)', flex: 'none' }} />
            <Dialog.Title
              style={{
                position: 'absolute',
                width: 1,
                height: 1,
                overflow: 'hidden',
                clip: 'rect(0 0 0 0)',
                whiteSpace: 'nowrap',
              }}
            >
              Command palette
            </Dialog.Title>
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setActiveIndex(0)
              }}
              onKeyDown={onListKeyDown}
              placeholder="Type a command or search…"
              autoFocus
              aria-label="Type a command or search"
              aria-controls="shell-command-list"
              aria-activedescendant={
                items.length > 0 ? `shell-command-${highlightedIndex}` : undefined
              }
              style={{
                flex: 1,
                background: 'transparent',
                border: 0,
                outline: 'none',
                fontSize: 14,
                color: 'var(--fg-1)',
              }}
            />
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              className="iconbtn"
              style={{ width: 28, height: 28 }}
            >
              <X size={14} aria-hidden />
            </button>
          </div>
          <div
            ref={listRef}
            id="shell-command-list"
            style={{ maxHeight: 320, overflowY: 'auto', padding: 6 }}
            role="listbox"
            aria-label="Actions"
            onKeyDown={onListKeyDown}
          >
            {items.length === 0 && (
              <p style={{ padding: 16, color: 'var(--fg-3)', fontSize: 13, margin: 0 }}>
                No matching actions.
              </p>
            )}
            {items.map((a, index) => {
              const Icon = a.icon
              const selected = index === highlightedIndex
              const body = (
                <>
                  <Icon size={16} aria-hidden style={{ color: 'var(--fg-3)' }} />
                  <span style={{ flex: 1 }}>{a.label}</span>
                  <span className="telemetry-label">{a.hint}</span>
                </>
              )
              const common = {
                'data-palette-index': index,
                'id': `shell-command-${index}`,
                'role': 'option' as const,
                'aria-selected': selected,
                'style': rowStyle(selected),
                'onMouseEnter': () => setActiveIndex(index),
              }
              return 'route' in a ? (
                <Link
                  key={a.label}
                  href={urlFor(a.route)}
                  {...common}
                  onClick={() => onOpenChange(false)}
                >
                  {body}
                </Link>
              ) : (
                <Link key={a.label} href={a.href} {...common} onClick={() => onOpenChange(false)}>
                  {body}
                </Link>
              )
            })}
          </div>
          <div
            style={{
              borderTop: '1px solid var(--hairline)',
              padding: '8px 12px',
              display: 'flex',
              gap: 12,
            }}
          >
            <span className="telemetry-label">↑↓ navigate</span>
            <span className="telemetry-label">↵ select</span>
            <span className="telemetry-label">esc close</span>
          </div>
        </DialogPopup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export { urlFor }
