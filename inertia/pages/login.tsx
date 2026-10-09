import { Head, usePage } from '@inertiajs/react'
import { CircleX, KeyRound } from 'lucide-react'
import Logo, { LogoMark } from '~/components/logo'
import ThemeToggle from '~/components/theme_toggle'

/** Four L-shaped corner ticks, 16px arms, `--accent` at 70%, offset outside the frame. */
function CropMarks() {
  const tick = 'absolute size-4 border-accent opacity-70'
  return (
    <div aria-hidden className="pointer-events-none absolute -inset-[var(--crop-offset)]">
      <span className={`${tick} left-0 top-0 border-l border-t`} />
      <span className={`${tick} right-0 top-0 border-r border-t`} />
      <span className={`${tick} bottom-0 left-0 border-b border-l`} />
      <span className={`${tick} bottom-0 right-0 border-b border-r`} />
    </div>
  )
}

/** Blank contact sheet: 1.5px line-art frames with one accent detail. Never shows real work. */
function ContactSheetIllustration() {
  const frames = Array.from({ length: 6 }, (_, i) => i)
  return (
    <div className="relative w-full max-w-[420px]">
      <CropMarks />
      <div className="grid grid-cols-3 gap-0.5 rounded-md bg-surface-raised p-0.5">
        {frames.map((i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <svg
              viewBox="0 0 120 90"
              role="presentation"
              aria-hidden
              className="block w-full text-muted-foreground"
            >
              <rect
                x="1"
                y="1"
                width="118"
                height="88"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                opacity="0.55"
              />
              <path
                d="M1 89 L44 48 L68 70 L86 54 L119 86"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
                opacity="0.35"
              />
              {/* the single accent detail */}
              {i === 1 && (
                <rect
                  x="1"
                  y="1"
                  width="118"
                  height="88"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="1.5"
                />
              )}
            </svg>
            <span className="pb-1 text-center font-mono text-[10px] text-muted-foreground">
              {String(i + 1).padStart(2, '0')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Login() {
  const { flash } = usePage()
  const error = flash?.error

  return (
    <>
      <Head title="Sign in" />
      <div className="grid min-h-svh bg-background text-foreground lg:grid-cols-[55fr_45fr]">
        {/* Brand panel */}
        <aside
          aria-hidden
          className="hidden flex-col justify-between border-r border-border bg-sidebar p-12 lg:flex"
        >
          <Logo />
          <div className="flex flex-1 items-center justify-center">
            <ContactSheetIllustration />
          </div>
          <p className="max-w-[var(--prose)] font-display text-xl/7 font-medium text-muted-foreground">
            Every project, catalogued and ready to share.
          </p>
        </aside>

        {/* Sign-in */}
        <main id="main" className="relative flex flex-col px-4 py-6 sm:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 lg:invisible">
              <LogoMark />
              <span className="font-display text-base font-semibold tracking-tight">
                Digital Covet
              </span>
            </div>
            <ThemeToggle />
          </div>

          <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center gap-8 py-12">
            <div className="flex flex-col gap-2">
              <h1 className="font-display text-2xl/8 font-semibold">Sign in to Portfolio</h1>
              <p className="text-sm text-muted-foreground">
                Use your Digital Covet account to continue.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div role="alert">
                {error && (
                  <p className="flex items-start gap-2 rounded-md border border-error/40 bg-error/10 px-3 py-2.5 text-sm">
                    <CircleX
                      size={16}
                      strokeWidth={1.75}
                      className="mt-0.5 shrink-0 text-error"
                      aria-hidden
                    />
                    <span>{error}</span>
                  </p>
                )}
              </div>

              {/* A full navigation: the OAuth (PKCE) flow starts server-side. */}
              <a
                href="/auth/redirect"
                className="flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-[filter] duration-[var(--duration-fast)] hover:brightness-110 active:brightness-95 motion-reduce:transition-none"
              >
                <KeyRound size={16} strokeWidth={1.75} aria-hidden />
                Continue with Digital Covet ID
              </a>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
