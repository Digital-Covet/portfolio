import { Link, router, usePage } from '@inertiajs/react'
import { Menu } from '@base-ui/react/menu'
import { Tooltip } from '@base-ui/react/tooltip'
import { m, useReducedMotion } from 'motion/react'
import {
  Building2,
  ExternalLink,
  FolderOpen,
  LayoutDashboard,
  Link2,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Tags,
} from 'lucide-react'
import Logo from '~/components/logo'
import ThemeToggle from '~/components/theme_toggle'

export type NavItem = {
  href: string
  label: string
  icon: typeof LayoutDashboard
  /** Rendered only for admin+. Hidden, never disabled. */
  admin?: boolean
}

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Workspace',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/case-studies', label: 'Case studies', icon: FolderOpen },
      { href: '/shares', label: 'Shares', icon: Link2 },
    ],
  },
  {
    label: 'Library',
    items: [
      { href: '/clients', label: 'Clients', icon: Building2, admin: true },
      { href: '/taxonomies', label: 'Taxonomies', icon: Tags, admin: true },
    ],
  },
]

export function useIsAdmin() {
  const { user } = usePage().props
  return user?.role === 'admin' || user?.role === 'superadmin'
}

export function visibleGroups(isAdmin: boolean) {
  return NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => !i.admin || isAdmin),
  })).filter((g) => g.items.length > 0)
}

export function Nav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { url } = usePage()
  const reduce = useReducedMotion()
  const isAdmin = useIsAdmin()

  return (
    <nav aria-label="Main" className="flex flex-col gap-6 px-3">
      {visibleGroups(isAdmin).map((g) => (
        <div key={g.label}>
          {!collapsed && (
            <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">{g.label}</p>
          )}
          <ul className="flex flex-col gap-0.5">
            {g.items.map(({ href, label, icon: Icon }) => {
              const active =
                url === href || url.startsWith(`${href}/`) || url.startsWith(`${href}?`)
              const link = (
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className="relative flex h-9 items-center gap-3 rounded-md px-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground aria-[current=page]:text-foreground"
                >
                  {active && (
                    <m.span
                      layoutId={reduce ? undefined : 'nav-active'}
                      transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
                      className="absolute inset-0 rounded-md bg-primary/10 before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary"
                    />
                  )}
                  <Icon
                    size={18}
                    strokeWidth={1.75}
                    className={`relative shrink-0 ${active ? 'text-primary' : ''}`}
                    aria-hidden
                  />
                  <span
                    className={`relative whitespace-nowrap transition-opacity duration-[120ms] ${
                      collapsed ? 'sr-only' : ''
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              )
              return (
                <li key={href}>
                  {collapsed ? (
                    <Tooltip.Root>
                      <Tooltip.Trigger render={link} />
                      <Tooltip.Portal>
                        <Tooltip.Positioner side="right" sideOffset={8}>
                          <Tooltip.Popup className="rounded-md border border-[var(--border-raised)] bg-surface-raised px-2 py-1 text-xs shadow-[var(--shadow-raised)]">
                            {label}
                          </Tooltip.Popup>
                        </Tooltip.Positioner>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  ) : (
                    link
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function UserMenu({ collapsed }: { collapsed: boolean }) {
  const { user } = usePage().props
  const accountUrl = import.meta.env.VITE_IAM_ACCOUNT_URL as string | undefined
  if (!user) return null

  const itemClass =
    'flex h-9 cursor-default items-center gap-2 rounded-sm px-2 text-sm outline-none data-[highlighted]:bg-secondary'

  return (
    <Menu.Root>
      <Menu.Trigger className="flex w-full items-center gap-2 rounded-md p-1.5 text-left hover:bg-secondary">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-[11px] font-medium">
          {user.initials}
        </span>
        {!collapsed && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm">{user.name ?? user.email}</span>
            <span className="block text-xs capitalize text-muted-foreground">{user.role}</span>
          </span>
        )}
        {collapsed && <span className="sr-only">Account menu</span>}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side={collapsed ? 'right' : 'top'} align="start" sideOffset={8}>
          <Menu.Popup className="min-w-52 rounded-lg border border-[var(--border-raised)] bg-surface-raised p-1 shadow-[var(--shadow-raised)]">
            {accountUrl && (
              <Menu.Item
                className={itemClass}
                render={<a href={accountUrl} target="_blank" rel="noreferrer" />}
              >
                <ExternalLink size={16} strokeWidth={1.75} aria-hidden /> Manage account
              </Menu.Item>
            )}
            <Menu.Item className={itemClass} onClick={() => router.post('/logout')}>
              <LogOut size={16} strokeWidth={1.75} aria-hidden /> Sign out
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}

type SidebarProps = {
  collapsed: boolean
  onToggle?: () => void
  onOpenPalette: () => void
  onNavigate?: () => void
}

function SidebarToggle({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const label = collapsed ? 'Expand sidebar' : 'Collapse sidebar'
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        onClick={onToggle}
        aria-label={label}
        className={`flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground ${
          collapsed ? 'mb-2' : ''
        }`}
      >
        {collapsed ? (
          <PanelLeftOpen size={18} strokeWidth={1.75} />
        ) : (
          <PanelLeftClose size={18} strokeWidth={1.75} />
        )}
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner side="right" sideOffset={8}>
          <Tooltip.Popup className="rounded-md border border-[var(--border-raised)] bg-surface-raised px-2 py-1 text-xs shadow-[var(--shadow-raised)]">
            {label} <kbd className="font-mono">[</kbd>
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

export function SidebarContent({ collapsed, onToggle, onOpenPalette, onNavigate }: SidebarProps) {
  return (
    <>
      <div className={collapsed ? 'flex flex-col items-center' : 'flex items-center pr-3'}>
        <div className="min-w-0 flex-1">
          <Logo collapsed={collapsed} />
        </div>
        {onToggle && <SidebarToggle collapsed={collapsed} onToggle={onToggle} />}
      </div>
      <button
        type="button"
        onClick={onOpenPalette}
        className="mx-3 flex h-9 items-center gap-2 rounded-md border border-border px-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <Search size={16} strokeWidth={1.75} aria-hidden />
        {collapsed ? (
          <span className="sr-only">Search</span>
        ) : (
          <>
            Search <kbd className="ml-auto font-mono text-xs">⌘K</kbd>
          </>
        )}
      </button>
      <Nav collapsed={collapsed} onNavigate={onNavigate} />
      <div className="mt-auto flex flex-col gap-2 border-t border-border px-3 pt-3">
        {!collapsed && <ThemeToggle />}
        <UserMenu collapsed={collapsed} />
      </div>
    </>
  )
}
