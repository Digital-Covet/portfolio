import type { ReactNode } from 'react'
import { Archive, CircleCheck, OctagonX, Pencil, TriangleAlert } from 'lucide-react'
import type { CaseStatus, ShareStatus } from './types'

/** Level-1 card used by every dashboard widget. */
export function WidgetCard({
  title,
  action,
  footer,
  children,
  labelledBy,
}: {
  title: string
  action?: ReactNode
  footer?: ReactNode
  children: ReactNode
  labelledBy?: string
}) {
  return (
    <section aria-labelledby={labelledBy ?? title} className="dash-card">
      <header className="dash-card__header">
        <h2 id={labelledBy ?? title} className="dash-card__title">
          {title}
        </h2>
        {action}
      </header>
      {children}
      {footer && <footer className="dash-card__footer">{footer}</footer>}
    </section>
  )
}

const STATUS_META: Record<
  ShareStatus | CaseStatus | 'draft',
  { label: string; Icon: typeof CircleCheck }
> = {
  active: { label: 'Active', Icon: CircleCheck },
  expiring: { label: 'Expiring', Icon: TriangleAlert },
  expired: { label: 'Expired', Icon: OctagonX },
  limit: { label: 'Limit reached', Icon: OctagonX },
  published: { label: 'Published', Icon: CircleCheck },
  draft: { label: 'Draft', Icon: Pencil },
  archived: { label: 'Archived', Icon: Archive },
}

/** Status badge: icon + word, never hue alone. */
export function StatusBadge({ status }: { status: ShareStatus | CaseStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.draft
  const { label, Icon } = meta
  return (
    <span className="badge" data-status={status}>
      <Icon size={13} aria-hidden />
      {label}
    </span>
  )
}

/** Horizontal meter bar for the By-sector card. */
export function Meter({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <span
      className="meter"
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      <span className="meter__fill" style={{ width: `${pct}%` }} />
    </span>
  )
}

/** Skeleton block matching a widget's final height (deferred-load state). */
export function Skeleton({
  height = 120,
  label = 'Loading…',
}: {
  height?: number
  label?: string
}) {
  return (
    <div className="skeleton" style={{ height }} role="status" aria-label={label}>
      <span className="skeleton__bar" />
    </div>
  )
}

/** Inline error with retry for a single failing widget; siblings stay. */
export function WidgetError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="alert" role="alert">
      <OctagonX size={16} aria-hidden />
      <p>{message}</p>
      <button type="button" className="btn btn--outline btn--sm" onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}

/** Covet Grid empty state: patch + icon + message + one action. */
export function EmptyState({
  icon,
  title,
  action,
}: {
  icon: ReactNode
  title: string
  action?: ReactNode
}) {
  return (
    <div className="empty">
      <div className="empty__patch covet-grid" aria-hidden="true">
        <span className="empty__icon">{icon}</span>
      </div>
      <p className="empty__title">{title}</p>
      {action}
    </div>
  )
}
