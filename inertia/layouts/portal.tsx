import { useEffect, type ReactNode } from 'react'
import { usePage } from '@inertiajs/react'
import { Clock } from 'lucide-react'
import { LogoMark } from '~/components/logo'
import { shortDate } from '~/lib/share'

type PortalProps = { expiresAt: string | null }

/**
 * Recipient frame: no sidebar, no app chrome. Dark by default; with no saved theme
 * choice it follows the visitor's OS setting.
 */
export default function PortalLayout({ children }: { children: ReactNode }) {
  const { expiresAt } = usePage<PortalProps & Record<string, unknown>>().props

  useEffect(() => {
    try {
      if (!/(?:^|; )app_theme=/.test(document.cookie)) {
        const light = matchMedia('(prefers-color-scheme: light)').matches
        document.documentElement.setAttribute('data-theme', light ? 'light' : 'dark')
      }
    } catch {}
  }, [])

  return (
    <div className="min-h-svh overflow-x-clip bg-background text-foreground">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>
      <header className="flex h-16 items-center justify-between px-6 xl:px-12">
        <div className="flex items-center gap-2.5">
          <LogoMark />
          <span className="font-display text-base font-semibold tracking-tight">Digital Covet</span>
        </div>
        {expiresAt && (
          <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground max-sm:hidden">
            <Clock size={16} strokeWidth={1.75} aria-hidden />
            Available until {shortDate(expiresAt)}
          </p>
        )}
      </header>
      <main id="main">{children}</main>
    </div>
  )
}
