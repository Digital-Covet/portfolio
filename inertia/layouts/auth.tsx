import type { ReactNode } from 'react'
import Logo from '~/components/logo'
import CovetGrid from '~/components/covet_grid'
import FlashToasts from '~/components/flash_toasts'
import NavProgress from '~/components/nav_progress'

/**
 * Auth pattern: 400px card on the Covet Grid backdrop.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="dark"
      style={{
        position: 'relative',
        minHeight: '100svh',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--background)',
        color: 'var(--fg-1)',
        padding: 16,
        overflow: 'hidden',
      }}
    >
      <CovetGrid />
      <main style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <Logo size={32} />
        </div>
        <div
          style={{
            position: 'relative',
            background: 'var(--card)',
            border: '1px solid var(--hairline)',
            borderRadius: 'var(--radius-lg)',
            padding: 28,
            overflow: 'hidden',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              translate: '-50% 0',
              width: 24,
              height: 2,
              borderRadius: 2,
              background: 'var(--primary)',
            }}
          />
          {children}
        </div>
      </main>
      <NavProgress />
      <FlashToasts />
      <style>{`.auth__title{font-family:var(--font-heading);font-weight:700;font-size:22px;margin:0 0 4px}.auth__sub{color:var(--fg-2);font-size:14px;margin:0 0 20px}.auth__form{display:grid;gap:14px}.auth__foot{color:var(--fg-2);font-size:13px;margin:16px 0 0}.il{color:var(--primary-text);text-decoration:none}.il:hover{text-decoration:underline}`}</style>
    </div>
  )
}
