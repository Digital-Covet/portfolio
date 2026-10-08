import { Link } from '@adonisjs/inertia/react'

/**
 * LogoMark placeholder. The real logo file sits behind a WorkDrive link
 * per the design system — swap this SVG when the asset lands.
 */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: 7,
        background: 'var(--primary)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none',
      }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 16 16" fill="none">
        <path d="M2 2h12v3H5v9H2V2z" fill="#fff" />
        <rect x="11" y="11" width="3" height="3" fill="#fff" opacity="0.7" />
      </svg>
    </span>
  )
}

type LogoHomeRoute = 'home' | 'dashboard'

export default function Logo({
  size = 28,
  withWordmark = true,
  homeRoute = 'home',
}: {
  size?: number
  withWordmark?: boolean
  homeRoute?: LogoHomeRoute
}) {
  const label =
    homeRoute === 'dashboard' ? 'Portfolio workspace home' : 'Digital Covet Portfolio home'

  return (
    <Link
      route={homeRoute}
      aria-label={label}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
    >
      <LogoMark size={size} />
      {withWordmark && (
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: 16,
            color: 'var(--sidebar-fg, var(--fg-1))',
            letterSpacing: '-0.01em',
          }}
        >
          Portfolio
        </span>
      )}
    </Link>
  )
}
