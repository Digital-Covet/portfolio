import { useEffect, useMemo, useState } from 'react'
import { router } from '@inertiajs/react'
import { Dialog } from '@base-ui/react/dialog'
import { Plus, Search } from 'lucide-react'
import { useIsAdmin, visibleGroups } from '~/components/sidebar'

type Entry = { group: string; label: string; href: string; icon: typeof Search }

/**
 * ⌘K palette. Pages and actions only for now; case studies and shares join the
 * list once those resources exist.
 */
export default function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const isAdmin = useIsAdmin()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const entries = useMemo<Entry[]>(
    () => [
      ...visibleGroups(isAdmin).flatMap((g) =>
        g.items.map((i) => ({ group: 'Pages', label: i.label, href: i.href, icon: i.icon }))
      ),
      { group: 'Actions', label: 'New case study', href: '/case-studies/new', icon: Plus },
      { group: 'Actions', label: 'New share', href: '/shares/new', icon: Plus },
    ],
    [isAdmin]
  )

  const results = entries.filter((e) => e.label.toLowerCase().includes(query.trim().toLowerCase()))

  useEffect(() => {
    if (!open) {
      setQuery('')
      setActive(0)
    }
  }, [open])

  const go = (entry?: Entry) => {
    if (!entry) return
    onOpenChange(false)
    router.visit(entry.href)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/50 transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed left-1/2 top-[15svh] z-50 w-[min(560px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-lg border border-[var(--border-raised)] bg-surface-raised shadow-[var(--shadow-raised)] transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0">
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <div className="flex items-center gap-2 border-b border-[var(--border-raised)] px-3">
            <Search size={16} strokeWidth={1.75} className="text-muted-foreground" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActive(0)
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setActive((a) => Math.min(a + 1, results.length - 1))
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setActive((a) => Math.max(a - 1, 0))
                } else if (e.key === 'Enter') {
                  go(results[active])
                }
              }}
              placeholder="Search pages and actions"
              aria-label="Search"
              className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ul role="listbox" aria-label="Results" className="max-h-80 overflow-y-auto p-1">
            {results.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">No results.</li>
            )}
            {results.map((e, i) => (
              <li key={`${e.group}-${e.label}`} role="presentation">
                {(i === 0 || results[i - 1].group !== e.group) && (
                  <p className="px-2 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {e.group}
                  </p>
                )}
                <button
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  onMouseMove={() => setActive(i)}
                  onClick={() => go(e)}
                  className="flex h-9 w-full items-center gap-2 rounded-sm px-2 text-left text-sm aria-selected:bg-secondary"
                >
                  <e.icon size={16} strokeWidth={1.75} aria-hidden />
                  {e.label}
                </button>
              </li>
            ))}
          </ul>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
