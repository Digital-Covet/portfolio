import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { usePage } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import { Tooltip, TooltipPopup } from '~/components/ui/tooltip'
import { Drawer, DrawerBackdrop, NavDrawerPopup } from '~/components/ui/drawer'
import { LayoutDashboard, LibraryBig, Link2, Building2, Network, PanelLeft, X } from 'lucide-react'
import Logo from '~/components/logo'
import TopBar, { type Crumb } from '~/components/top_bar'
import UserMenu, { type ShellUser } from '~/components/user_menu'
import FlashToasts from '~/components/flash_toasts'
import NavProgress from '~/components/nav_progress'
import CommandPalette, { useCommandPalette } from '~/components/command_palette'
import ShellProviders from '~/components/shell_providers'
import { urlFor } from '~/client'

const RANK = { employee: 0, admin: 1, superadmin: 2 } as const
type Role = keyof typeof RANK

const XL_BREAKPOINT = 1280

const NAV: Array<{
  label: string
  items: Array<{
    name: string
    href: string
    route?: 'dashboard'
    icon: typeof LayoutDashboard
    minRole?: Role
  }>
}> = [
  {
    label: 'Workspace',
    items: [
      { name: 'Dashboard', href: '/dashboard', route: 'dashboard', icon: LayoutDashboard },
      { name: 'Case studies', href: '/case-studies', icon: LibraryBig },
      { name: 'Shares', href: '/shares', icon: Link2 },
    ],
  },
  {
    label: 'Library',
    items: [
      { name: 'Clients', href: '/clients', icon: Building2, minRole: 'admin' },
      { name: 'Taxonomies', href: '/taxonomies', icon: Network, minRole: 'admin' },
    ],
  },
]

const SIDEBAR_COOKIE = 'app_sidebar'
const ONE_YEAR = 60 * 60 * 24 * 365

function readSidebarPref(): boolean | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(/(?:^|; )app_sidebar=([^;]*)/)
  if (!m) return null
  return m[1] === 'open'
}

function defaultOpenForWidth(width: number): boolean {
  return width >= XL_BREAKPOINT
}

function useViewportWidth() {
  const [width, setWidth] = useState(() =>
    typeof window === 'undefined' ? XL_BREAKPOINT : window.innerWidth
  )

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return width
}

function navHref(item: { href: string; route?: 'dashboard' }) {
  return item.route ? urlFor(item.route) : item.href
}

function NavList({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { url, props } = usePage()
  const user = props.user
  const role = ((user?.role as Role) ?? 'employee') as Role
  const path = url.split('?')[0].split('#')[0]

  return (
    <>
      {NAV.map((group) => {
        const visible = group.items.filter(
          (i) => !i.minRole || (RANK[role] ?? 0) >= RANK[i.minRole]
        )
        if (visible.length === 0) return null
        return (
          <div key={group.label} style={{ marginBottom: 20 }}>
            {!collapsed && (
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--fg-3)',
                  margin: '0 0 6px',
                  padding: '0 12px',
                }}
              >
                {group.label}
              </p>
            )}
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 2 }}>
              {visible.map((item) => {
                const { name, href, icon: Icon } = item
                const active = path === href || path.startsWith(`${href}/`)
                const target = navHref(item)
                const ariaCurrent = active ? ('page' as const) : undefined

                return (
                  <li key={href}>
                    {collapsed ? (
                      <Tooltip.Root>
                        <Tooltip.Trigger
                          delay={200}
                          render={
                            <Link
                              href={target}
                              className="shell-navitem"
                              data-active={active ? 'true' : 'false'}
                              aria-current={ariaCurrent}
                              onClick={onNavigate}
                            />
                          }
                        >
                          <Icon size={20} aria-hidden style={{ flex: 'none' }} />
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Positioner side="right" sideOffset={8}>
                            <TooltipPopup>{name}</TooltipPopup>
                          </Tooltip.Positioner>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    ) : (
                      <Link
                        href={target}
                        className="shell-navitem"
                        data-active={active ? 'true' : 'false'}
                        aria-current={ariaCurrent}
                        onClick={onNavigate}
                      >
                        <Icon size={18} aria-hidden style={{ flex: 'none' }} />
                        <span style={{ flex: 1 }}>{name}</span>
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </>
  )
}

function SidebarBody({
  collapsed,
  onToggle,
  onNavigate,
}: {
  collapsed: boolean
  onToggle: () => void
  onNavigate?: () => void
}) {
  const { props } = usePage()
  const user = (props.user ?? {}) as ShellUser

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          padding: collapsed ? '0' : '0 8px 0 16px',
          gap: 8,
          justifyContent: collapsed ? 'center' : 'space-between',
        }}
      >
        {collapsed ? (
          <Logo size={28} withWordmark={false} homeRoute="dashboard" />
        ) : (
          <>
            <Logo size={28} homeRoute="dashboard" />
            <button
              type="button"
              className="iconbtn"
              onClick={onToggle}
              aria-label="Collapse sidebar"
              title="Collapse sidebar (⌘B)"
              style={{ width: 32, height: 32, border: 0 }}
            >
              <PanelLeft size={16} aria-hidden />
            </button>
          </>
        )}
      </div>

      <nav
        aria-label="Primary"
        style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '8px' : '8px 12px 8px 16px' }}
      >
        <NavList collapsed={collapsed} onNavigate={onNavigate} />
      </nav>

      <div
        style={{
          borderTop: '1px solid var(--hairline)',
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <UserMenu user={user} compact={collapsed} />
        {collapsed && (
          <button
            type="button"
            className="iconbtn"
            onClick={onToggle}
            aria-label="Expand sidebar"
            title="Expand sidebar (⌘B)"
            style={{ width: '100%', border: 0 }}
          >
            <PanelLeft size={16} aria-hidden />
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Persistent workspace layout (sidebar + top bar). Pages opt in via
 * `Page.layout = (page) => <AppShell crumbs={[...]}>{page}</AppShell>`.
 */
export default function AppShell({ children, crumbs }: { children: ReactNode; crumbs?: Crumb[] }) {
  const viewportWidth = useViewportWidth()
  const narrow = viewportWidth < XL_BREAKPOINT

  const [open, setOpen] = useState<boolean>(() => {
    const pref = readSidebarPref()
    if (pref !== null) return pref
    return defaultOpenForWidth(typeof window === 'undefined' ? XL_BREAKPOINT : window.innerWidth)
  })
  const [drawer, setDrawer] = useState(false)
  const palette = useCommandPalette()

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= XL_BREAKPOINT) {
        const pref = readSidebarPref()
        setOpen(pref ?? true)
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    document.cookie = `${SIDEBAR_COOKIE}=${open ? 'open' : 'closed'}; path=/; max-age=${ONE_YEAR}; samesite=lax`
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const collapsed = useMemo(() => !open, [open])
  const overlayExpanded = narrow && open
  const inFlowWidth = collapsed ? 'var(--sidebar-rail)' : 'var(--sidebar-width)'

  const closeOverlay = () => setOpen(false)

  return (
    <ShellProviders>
      <Tooltip.Provider>
        <div
          className={collapsed ? 'shell-rail' : ''}
          style={{ display: 'flex', minHeight: '100svh', background: 'var(--background)' }}
        >
          <a
            href="#main"
            style={{
              position: 'absolute',
              left: -9999,
              top: 8,
              zIndex: 200,
              background: 'var(--primary)',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: 8,
            }}
            onFocus={(e) => {
              e.currentTarget.style.left = '8px'
            }}
            onBlur={(e) => {
              e.currentTarget.style.left = '-9999px'
            }}
          >
            Skip to content
          </a>

          {overlayExpanded && (
            <button
              type="button"
              className="shell-sidebar-overlay"
              aria-label="Close navigation"
              onClick={closeOverlay}
            />
          )}

          <aside
            aria-label="App navigation"
            data-shell-sidebar
            className={overlayExpanded ? 'shell-sidebar-panel--overlay' : undefined}
            style={{
              width: overlayExpanded ? 'var(--sidebar-width)' : inFlowWidth,
              flex: overlayExpanded ? 'none' : 'none',
              position: overlayExpanded ? undefined : 'sticky',
              top: 0,
              height: '100svh',
              background: 'var(--sidebar)',
              color: 'var(--sidebar-fg)',
              borderRight: '1px solid var(--hairline)',
              transition: overlayExpanded
                ? undefined
                : `width var(--duration-slow) var(--ease-out)`,
              overflow: 'hidden',
            }}
          >
            <SidebarBody
              collapsed={overlayExpanded ? false : collapsed}
              onToggle={() => setOpen((v) => !v)}
            />
          </aside>

          <Drawer.Root open={drawer} onOpenChange={setDrawer}>
            <Drawer.Portal>
              <DrawerBackdrop style={{ zIndex: 80 }} />
              <NavDrawerPopup aria-label="Navigation">
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 8 }}>
                  <button
                    type="button"
                    className="iconbtn"
                    onClick={() => setDrawer(false)}
                    aria-label="Close navigation"
                    style={{ border: 0, color: 'var(--sidebar-fg)' }}
                  >
                    <X size={16} aria-hidden />
                  </button>
                </div>
                <div style={{ height: 'calc(100% - 52px)' }}>
                  <SidebarBody
                    collapsed={false}
                    onToggle={() => setDrawer(false)}
                    onNavigate={() => setDrawer(false)}
                  />
                </div>
              </NavDrawerPopup>
            </Drawer.Portal>
          </Drawer.Root>

          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <TopBar onMenu={() => setDrawer(true)} crumbs={crumbs} />
            <main
              id="main"
              style={{
                width: '100%',
                maxWidth: 'var(--container-max)',
                margin: '0 auto',
                padding: '32px 32px 64px',
                flex: 1,
              }}
              className="shell-main"
            >
              {children}
            </main>
          </div>

          <NavProgress />
          <CommandPalette open={palette.open} onOpenChange={palette.setOpen} />
          <FlashToasts />

          <style>{`
        [data-shell-sidebar]{ display: none; }
        @media (min-width: 768px){ [data-shell-sidebar]{ display: block; } }
        @media (max-width: 767px){ .shell-main{ padding: 20px 16px 48px !important; } }
        .shell-rail .shell-usermeta{ display: none; }
      `}</style>
        </div>
      </Tooltip.Provider>
    </ShellProviders>
  )
}
