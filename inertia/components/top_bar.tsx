import { Fragment } from 'react'
import { Link, usePage } from '@inertiajs/react'
import { Search, PanelLeft } from 'lucide-react'
import { openPalette } from '~/components/command_palette'

export type Crumb = { label: string; href?: string }

function crumbsFromUrl(url: string): Crumb[] {
  const path = url.split('?')[0].split('#')[0]
  const segs = path.split('/').filter(Boolean)
  if (segs.length === 0) return [{ label: 'Home' }]
  const labels: Record<string, string> = {
    dashboard: 'Dashboard',
    'case-studies': 'Case studies',
    clients: 'Clients',
    taxonomies: 'Taxonomies',
    shares: 'Shares',
    new: 'New',
    edit: 'Edit',
  }
  return segs.map((s, i) => {
    const href = `/${segs.slice(0, i + 1).join('/')}`
    const label = labels[s] ?? s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    const last = i === segs.length - 1
    return last ? { label } : { label, href }
  })
}

export default function TopBar({
  onMenu,
  crumbs,
}: {
  onMenu?: () => void
  crumbs?: Crumb[]
}) {
  const { url } = usePage()
  const items = crumbs ?? crumbsFromUrl(url)

  return (
    <div
      style={{
        height: 'var(--topbar-h)', position: 'sticky', top: 0, zIndex: 40,
        display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px',
        background: 'var(--background)', borderBottom: '1px solid var(--hairline)',
      }}
    >
      <button
        type="button"
        className="iconbtn"
        onClick={onMenu}
        aria-label="Open navigation"
        style={{ display: 'none' }}
        data-shell-menu-btn
      >
        <PanelLeft size={17} aria-hidden />
      </button>

      <nav aria-label="Breadcrumb" style={{ minWidth: 0, flex: 1 }}>
        <ol style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, padding: 0, listStyle: 'none', minWidth: 0 }}>
          {items.map((c, i) => {
            const last = i === items.length - 1
            return (
              <Fragment key={`${c.label}-${i}`}>
                {i > 0 && (
                  <li aria-hidden="true" style={{ color: 'var(--fg-3)', fontSize: 13 }}>/</li>
                )}
                <li style={{ minWidth: 0 }}>
                  {c.href && !last ? (
                    <Link
                      href={c.href}
                      style={{ color: 'var(--fg-2)', fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap' }}
                    >
                      {c.label}
                    </Link>
                  ) : (
                    <span
                      aria-current={last ? 'page' : undefined}
                      style={{ color: 'var(--fg-1)', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}
                    >
                      {c.label}
                    </span>
                  )}
                </li>
              </Fragment>
            )
          })}
        </ol>
      </nav>

      <button
        type="button"
        onClick={openPalette}
        className="btn btn--outline btn--sm"
        style={{ gap: 8, color: 'var(--fg-2)', minWidth: 180, justifyContent: 'flex-start' }}
        aria-label="Search or run a command"
      >
        <Search size={14} aria-hidden />
        <span style={{ flex: 1, textAlign: 'left' }}>Search…</span>
        <kbd>⌘K</kbd>
      </button>

      <style>{`@media (max-width: 767px){ [data-shell-menu-btn]{ display: inline-flex !important; } }`}</style>
    </div>
  )
}
