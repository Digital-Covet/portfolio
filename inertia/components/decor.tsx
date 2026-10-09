import { Meter } from '@base-ui/react/meter'
import { CircleX, Lock, X } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'

/** Folio number: "Nº 0142", mono 12, zero-padded to 4 digits. */
export function Folio({ n, className = '' }: { n: number | null; className?: string }) {
  return (
    <span
      className={`font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground ${className}`}
    >
      Nº {n === null ? '—' : String(n).padStart(4, '0')}
    </span>
  )
}

/**
 * Crop marks: four L-shaped corner ticks outside the frame.
 * Solid for published work, dashed for drafts. Static and aria-hidden.
 */
export function CropFrame({
  tick = 12,
  dashed = false,
  draw = false,
  className = '',
  children,
}: {
  tick?: number
  dashed?: boolean
  /** Play the 280ms draw-in on the ticks (publish confirmation). */
  draw?: boolean
  className?: string
  children: ReactNode
}) {
  const style = {
    '--tick': `${tick}px`,
    '--tick-style': dashed ? 'dashed' : 'solid',
  } as CSSProperties
  const corner = `absolute size-[var(--tick)] border-accent/70 [border-style:var(--tick-style)] ${draw ? 'motion-safe:animate-[crop-draw_280ms_var(--ease-out)_both]' : ''}`
  const off = 'var(--crop-offset)'
  return (
    <div className={`relative ${className}`} style={{ ...style, margin: off }}>
      {children}
      <span
        aria-hidden
        className={`${corner} border-l border-t`}
        style={{ left: `calc(-1 * ${off})`, top: `calc(-1 * ${off})` }}
      />
      <span
        aria-hidden
        className={`${corner} border-r border-t`}
        style={{ right: `calc(-1 * ${off})`, top: `calc(-1 * ${off})` }}
      />
      <span
        aria-hidden
        className={`${corner} border-b border-l`}
        style={{ left: `calc(-1 * ${off})`, bottom: `calc(-1 * ${off})` }}
      />
      <span
        aria-hidden
        className={`${corner} border-b border-r`}
        style={{ right: `calc(-1 * ${off})`, bottom: `calc(-1 * ${off})` }}
      />
    </div>
  )
}

/**
 * Admission stub: a 104px ticket stub on the card's right edge (a 64px strip
 * on top below lg), cut from the card by a notched perforation. The parent
 * must be `relative overflow-hidden`.
 */
export function AdmissionStub({
  label,
  value,
  caption,
  fill,
}: {
  label: string
  value: number
  caption: string
  /** 0–1 share shown in the stub meter. */
  fill: number
}) {
  return (
    <div className="absolute inset-x-0 top-0 flex h-16 items-center gap-4 bg-surface-raised px-4 lg:inset-x-auto lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[var(--stub-width)] lg:flex-col lg:justify-center lg:gap-1 lg:px-3 lg:text-center">
      {/* Perforation: dashed seam plus notches that read as cut-outs in the card. */}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px [background:repeating-linear-gradient(90deg,var(--border-raised)_0_4px,transparent_4px_8px)] lg:inset-x-auto lg:inset-y-0 lg:left-0 lg:h-auto lg:w-px lg:[background:repeating-linear-gradient(180deg,var(--border-raised)_0_4px,transparent_4px_8px)]"
      />
      <span
        aria-hidden
        className="absolute -left-[var(--perf-notch)] inset-y-0 hidden w-[calc(var(--perf-notch)*2)] [background:radial-gradient(circle_at_50%_50%,var(--surface)_var(--perf-notch),transparent_calc(var(--perf-notch)+0.5px))_0_0/100%_var(--perf-gap)_repeat-y] lg:block"
      />
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="font-mono text-[32px]/10 font-medium text-foreground">{value}</p>
      <p className="font-mono text-xs text-muted-foreground max-lg:ml-auto">{caption}</p>
      <Meter.Root
        value={Math.round(fill * 100)}
        aria-label={`${label}: ${Math.round(fill * 100)}% of shares`}
        className="hidden w-full lg:block"
      >
        <Meter.Track className="h-1 overflow-hidden rounded-full bg-secondary">
          <Meter.Indicator className="h-full origin-left rounded-full bg-warning motion-safe:animate-[meter-fill_400ms_var(--ease-out)_both]" />
        </Meter.Track>
      </Meter.Root>
    </div>
  )
}

/** "23 OCT": the stub's expiry line. UTC, like every other date in the app. */
function stubDate(iso: string) {
  return new Date(iso)
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
    .toUpperCase()
}

/**
 * Share ticket: a card with a 104px admission stub on its right edge showing views used
 * against the cap, the expiry date and a lock when the link has a password. Sized by its
 * container, so it fits the 380px builder rail as well as a full-width detail card.
 */
export function ShareTicket({
  used,
  cap,
  expiresAt,
  locked,
  alert,
  children,
}: {
  used: number
  /** `null` is unlimited and renders as ∞. */
  cap: number | null
  expiresAt: string | null
  locked: boolean
  /** Dead-link label (EXPIRED, LIMIT REACHED); replaces the expiry line in error colour. */
  alert?: string
  children: ReactNode
}) {
  const fill = cap ? Math.min(used / cap, 1) : 0
  return (
    <div className="relative flex min-h-28 overflow-hidden rounded-lg border border-border-raised bg-surface-raised pr-[var(--stub-width)]">
      <div className="min-w-0 flex-1 p-4">{children}</div>
      <div className="absolute inset-y-0 right-0 flex w-[var(--stub-width)] flex-col items-center justify-center gap-1 px-3 text-center">
        {/* Perforation: dashed seam plus notches that read as cut-outs in the card. */}
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-px [background:repeating-linear-gradient(180deg,var(--border-raised)_0_4px,transparent_4px_8px)]"
        />
        <span
          aria-hidden
          className="absolute -left-[var(--perf-notch)] inset-y-0 w-[calc(var(--perf-notch)*2)] [background:radial-gradient(circle_at_50%_50%,var(--surface)_var(--perf-notch),transparent_calc(var(--perf-notch)+0.5px))_0_0/100%_var(--perf-gap)_repeat-y]"
        />
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Views
        </p>
        <p className="font-mono text-lg/6 font-medium text-foreground">
          {used}/{cap ?? '∞'}
        </p>
        {cap !== null && (
          <Meter.Root
            value={Math.round(fill * 100)}
            aria-label={`${used} of ${cap} views used`}
            className="w-full"
          >
            <Meter.Track className="h-1 overflow-hidden rounded-full bg-secondary">
              <Meter.Indicator className="h-full origin-left rounded-full bg-primary motion-safe:animate-[meter-fill_400ms_var(--ease-out)_both]" />
            </Meter.Track>
          </Meter.Root>
        )}
        {alert ? (
          <p className="flex items-center gap-1 font-mono text-[11px] font-medium text-error">
            <CircleX size={12} strokeWidth={1.75} aria-hidden /> {alert}
          </p>
        ) : (
          <p className="font-mono text-[11px] text-muted-foreground">
            {expiresAt ? `EXP ${stubDate(expiresAt)}` : 'NO EXPIRY'}
          </p>
        )}{' '}
        {locked && (
          <p className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
            <Lock size={12} strokeWidth={1.75} aria-hidden /> PASSWORD
          </p>
        )}
      </div>
    </div>
  )
}

export type Frame = { id: string; src: string | null; label: string }

/**
 * Contact sheet: 4:3 frames in a strip with 2px gaps, a mono frame index under each.
 * `onRemove` turns every frame into a removable pick (the share builder's tray).
 */
export function ContactSheet({
  frames,
  size = 96,
  onRemove,
  empty,
}: {
  frames: Frame[]
  size?: number
  onRemove?: (id: string) => void
  /** Shown beside four blank frames when there is nothing to display. */
  empty?: string
}) {
  if (frames.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <div
          className="flex gap-0.5 overflow-hidden rounded-[6px] bg-surface-raised p-0.5"
          aria-hidden
        >
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`aspect-[4/3] min-w-0 flex-1 border border-dashed ${i === 1 ? 'border-accent' : 'border-muted-foreground/50'}`}
            />
          ))}
        </div>
        {empty && <p className="text-sm text-muted-foreground">{empty}</p>}
      </div>
    )
  }
  return (
    <ol className="flex gap-0.5 overflow-x-auto rounded-[6px] bg-surface-raised p-0.5">
      {frames.map((f, i) => (
        <li key={f.id} className="group relative shrink-0" style={{ width: size }}>
          <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
            {f.src && <img src={f.src} alt="" loading="lazy" className="size-full object-cover" />}
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(f.id)}
                aria-label={`Remove ${f.label}`}
                className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 max-md:opacity-100"
              >
                <X size={12} strokeWidth={1.75} aria-hidden />
              </button>
            )}
          </div>
          <p className="py-1 text-center font-mono text-[10px] text-muted-foreground">
            {String(i + 1).padStart(2, '0')}
          </p>
        </li>
      ))}
    </ol>
  )
}
