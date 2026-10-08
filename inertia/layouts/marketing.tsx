import type { ReactNode } from 'react'
import { Link } from '@adonisjs/inertia/react'
import Logo from '~/components/logo'
import FlashToasts from '~/components/flash_toasts'
import NavProgress from '~/components/nav_progress'

/**
 * Public marketing layout: dark sticky header + content + near-black footer.
 * Keeps SSR-friendly static markup; expressive bands land with the
 * marketing page build (Section 6 spec).
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div data-surface="dark" style={{ minHeight: '100svh', background: 'var(--background)', color: 'var(--fg-1)' }}>
      <header
        style={{
          position: 'sticky', top: 0, zIndex: 50, height: 72,
          borderBottom: '1px solid var(--hairline)', background: 'var(--background)',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--portal-max)', margin: '0 auto', height: '100%',
            display: 'flex', alignItems: 'center', gap: 24, padding: '0 24px',
          }}
        >
          <Logo size={30} />
          <nav aria-label="Marketing" style={{ display: 'flex', gap: 20, flex: 1 }}>
            <a href="#services" style={{ color: 'var(--fg-2)', fontSize: 14, textDecoration: 'none' }}>Services</a>
            <a href="#work" style={{ color: 'var(--fg-2)', fontSize: 14, textDecoration: 'none' }}>Work</a>
          </nav>
          <Link route="session.create" className="btn btn--ghost btn--sm">
            Team login
          </Link>
          <a href="#contact" className="btn btn--primary btn--sm">
            Talk to us
          </a>
        </div>
      </header>

      <main>{children}</main>

      <footer style={{ borderTop: '1px solid var(--hairline)', background: '#0F0D0E' }}>
        <div
          style={{
            maxWidth: 'var(--portal-max)', margin: '0 auto', padding: '32px 24px',
            display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
          }}
        >
          <Logo size={24} />
          <span style={{ color: 'var(--fg-3)', fontSize: 13 }}>© Digital Covet · Mumbai</span>
          <span style={{ flex: 1 }} />
          <a href="/privacy" style={{ color: 'var(--fg-3)', fontSize: 13, textDecoration: 'none' }}>Privacy Policy</a>
          <a href="/cookies" style={{ color: 'var(--fg-3)', fontSize: 13, textDecoration: 'none' }}>Cookie Policy</a>
          <Link route="session.create" style={{ color: 'var(--fg-3)', fontSize: 13, textDecoration: 'none' }}>
            Team login
          </Link>
        </div>
      </footer>

      <NavProgress />
      <FlashToasts />
    </div>
  )
}
