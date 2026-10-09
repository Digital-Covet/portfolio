import { Head } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { LogoMark } from '~/components/logo'
import ThemeToggle from '~/components/theme_toggle'

/** Four L-shaped corner ticks, 12px arms, `--accent` at 70%, offset outside the frame. */
function CropMarks() {
  const tick = 'absolute size-3 border-accent opacity-70'
  return (
    <div aria-hidden className="pointer-events-none absolute -inset-[var(--crop-offset)]">
      <span className={`${tick} left-0 top-0 border-l border-t`} />
      <span className={`${tick} right-0 top-0 border-r border-t`} />
      <span className={`${tick} bottom-0 left-0 border-b border-l`} />
      <span className={`${tick} bottom-0 right-0 border-b border-r`} />
    </div>
  )
}

/** Crop-marked empty frame (403, 404): 1.5px line art, one accent detail, 144px wide. */
export function EmptyFrameIllustration() {
  return (
    <div aria-hidden className="relative w-36 text-muted-foreground">
      <CropMarks />
      <svg viewBox="0 0 120 90" role="presentation" className="block w-full">
        <rect
          x="1"
          y="1"
          width="118"
          height="88"
          rx="2"
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
        <circle cx="90" cy="24" r="8" fill="none" stroke="var(--accent)" strokeWidth="1.5" />
      </svg>
    </div>
  )
}

/** Admission stub torn along its perforation (5xx): 1.5px line art, one accent detail. */
export function TornStubIllustration() {
  return (
    <svg
      viewBox="0 0 160 80"
      role="presentation"
      aria-hidden
      className="block w-40 text-muted-foreground"
    >
      {/* main body */}
      <path
        d="M2 4 H92 L96 12 L90 20 L96 28 L90 36 L96 44 L90 52 L96 60 L92 68 L96 76 H2 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        opacity="0.55"
      />
      <path
        d="M16 28 H70 M16 42 H56"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.35"
      />
      {/* detached stub, offset and rotated */}
      <g transform="translate(112 8) rotate(6 20 32)">
        <path
          d="M4 0 L10 8 L4 16 L10 24 L4 32 L10 40 L4 48 L10 56 L4 64 H40 V0 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          opacity="0.55"
        />
        <path d="M18 22 H32 M18 34 H28" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  )
}

type ErrorPageProps = {
  /** Document title. */
  title: string
  /** HTTP status shown as a small mono eyebrow. */
  status: number | string
  /** The single h1. */
  heading: string
  illustration: ReactNode
  /** Exactly one route back; omit for contexts with nowhere to go (portal). */
  action?: ReactNode
  /** Optional mono line under the action, e.g. a reference ID. */
  footnote?: ReactNode
}

/** Branded dead end: illustration, one h1, one action. Expressive mode, no app shell. */
export default function ErrorPage({
  title,
  status,
  heading,
  illustration,
  action,
  footnote,
}: ErrorPageProps) {
  return (
    <>
      <Head title={title} />
      <div className="flex min-h-svh flex-col bg-background px-4 py-6 text-foreground sm:px-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-display text-base font-semibold tracking-tight">
              Digital Covet
            </span>
          </div>
          <ThemeToggle />
        </header>

        <main
          id="main"
          className="mx-auto flex w-full max-w-[420px] flex-1 flex-col items-center justify-center gap-8 py-12 text-center"
        >
          <div className="py-2">{illustration}</div>
          <div className="flex flex-col items-center gap-3">
            <p className="font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground tabular-nums">
              Error {status}
            </p>
            <h1 className="font-display text-2xl/8 font-semibold">{heading}</h1>
          </div>
          {action}
          {footnote && (
            <p className="font-mono text-xs text-muted-foreground tabular-nums">{footnote}</p>
          )}
        </main>
      </div>
    </>
  )
}

export const actionClass =
  'flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-[filter] duration-[var(--duration-fast)] hover:brightness-110 active:brightness-95 motion-reduce:transition-none'
