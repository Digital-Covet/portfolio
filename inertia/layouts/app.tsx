import { useEffect, useState, type ReactNode } from 'react'
import { router } from '@inertiajs/react'
import { Dialog } from '@base-ui/react/dialog'
import { Tooltip } from '@base-ui/react/tooltip'
import { LazyMotion, domAnimation } from 'motion/react'
import { Menu as MenuIcon } from 'lucide-react'
import CommandPalette from '~/components/command_palette'
import FlashToasts from '~/components/flash_toasts'
import { SidebarContent } from '~/components/sidebar'

const STORAGE_KEY = 'sidebar'

/** True when the key press happened while the user is typing in a field. */
function isTyping(e: KeyboardEvent) {
  const el = e.target as HTMLElement | null
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
}

const GO_ROUTES: Record<string, string> = {
  d: '/dashboard',
  c: '/case-studies',
  s: '/shares',
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)

  // Persisted choice wins; otherwise auto-rail below 1280px.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      setCollapsed(saved ? saved === 'rail' : innerWidth < 1280)
    } catch {
      setCollapsed(innerWidth < 1280)
    }
  }, [])

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'rail' : 'open')
    } catch {}
  }

  // ⌘K palette, `[` collapse, and `G` then D/C/S navigation.
  useEffect(() => {
    let goPending = false
    let timer: ReturnType<typeof setTimeout>

    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e)) return

      const key = e.key.toLowerCase()
      if (goPending) {
        goPending = false
        clearTimeout(timer)
        if (GO_ROUTES[key]) router.visit(GO_ROUTES[key])
        return
      }
      if (key === 'g') {
        goPending = true
        timer = setTimeout(() => (goPending = false), 1000)
      } else if (e.key === '[') {
        toggle()
      }
    }

    addEventListener('keydown', onKey)
    return () => {
      removeEventListener('keydown', onKey)
      clearTimeout(timer)
    }
  })

  return (
    <LazyMotion features={domAnimation}>
      <Tooltip.Provider delay={400}>
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
        >
          Skip to content
        </a>
        <div className="flex min-h-svh bg-background text-foreground">
          <aside
            style={{ width: collapsed ? 'var(--sidebar-rail)' : 'var(--sidebar-width)' }}
            className="sticky top-0 hidden h-svh shrink-0 flex-col gap-4 overflow-x-hidden border-r border-border bg-sidebar pb-4 transition-[width] duration-[180ms] ease-[var(--ease-out)] motion-reduce:transition-none md:flex"
          >
            <SidebarContent
              collapsed={collapsed}
              onToggle={toggle}
              onOpenPalette={() => setPaletteOpen(true)}
            />
          </aside>

          {/* < 768px: navigation drawer */}
          <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
            <Dialog.Trigger
              aria-label="Open navigation"
              className="fixed left-2 top-4 z-10 flex size-11 items-center justify-center rounded-md hover:bg-secondary md:hidden"
            >
              <MenuIcon size={20} strokeWidth={1.75} aria-hidden />
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Backdrop className="fixed inset-0 z-30 bg-black/50 transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
              <Dialog.Popup className="fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col gap-4 overflow-y-auto border-r border-border bg-sidebar pb-4 transition-transform duration-[180ms] ease-[var(--ease-out)] data-[ending-style]:-translate-x-full data-[starting-style]:-translate-x-full motion-reduce:transition-none">
                <Dialog.Title className="sr-only">Navigation</Dialog.Title>
                <SidebarContent
                  collapsed={false}
                  onOpenPalette={() => {
                    setDrawerOpen(false)
                    setPaletteOpen(true)
                  }}
                  onNavigate={() => setDrawerOpen(false)}
                />
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>

          <main id="main" className="min-w-0 flex-1 px-4 pb-16 md:px-8">
            {children}
          </main>
        </div>
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
        <FlashToasts />
      </Tooltip.Provider>
    </LazyMotion>
  )
}
