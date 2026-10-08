import { Link } from '@adonisjs/inertia/react'
import { Images, Link2 } from 'lucide-react'
import type { RecentCaseStudy, SectorRow, TopShare } from './types'
import { EmptyState, Meter, StatusBadge, WidgetCard } from './widgets'

export function TopShares({ rows }: { rows: TopShare[] }) {
  return (
    <WidgetCard
      title="Top shares"
      footer={
        rows.length > 0 ? (
          <Link href="/shares" className="dash-link">
            All shares
          </Link>
        ) : undefined
      }
    >
      {rows.length === 0 ? (
        <EmptyState
          icon={<Link2 size={24} aria-hidden />}
          title="No shares yet"
          action={
            <Link href="/shares/new" className="btn btn--outline btn--sm">
              Create a share
            </Link>
          }
        />
      ) : (
        <ul className="dash-rows">
          {rows.map((s) => (
            <li key={s.id} className="dash-row">
              <div className="dash-row__main">
                <span className="dash-row__title">{s.recipient}</span>
                <span className="dash-row__meta">
                  {s.company} · <span className="telemetry">…{s.tokenSuffix}</span>
                </span>
              </div>
              <span className="telemetry dash-row__value">{s.views}</span>
              <StatusBadge status={s.status} />
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  )
}

export function BySector({ rows }: { rows: SectorRow[] }) {
  const max = Math.max(0, ...rows.map((r) => r.count))
  return (
    <WidgetCard title="By sector">
      {rows.length === 0 ? (
        <EmptyState icon={<Images size={24} aria-hidden />} title="No sectors yet" />
      ) : (
        <ul className="dash-rows">
          {rows.map((r) => (
            <li key={r.name} className="dash-row dash-row--sector">
              <span className="dash-row__title">{r.name}</span>
              <span className="telemetry dash-row__value">{r.count}</span>
              <Meter value={r.count} max={max} label={`${r.name}: ${r.count} case studies`} />
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  )
}

export function RecentlyUpdated({ rows }: { rows: RecentCaseStudy[] }) {
  return (
    <WidgetCard title="Recently updated">
      {rows.length === 0 ? (
        <EmptyState
          icon={<Images size={24} aria-hidden />}
          title="No case studies yet"
          action={
            <Link href="/case-studies/new" className="btn btn--outline btn--sm">
              New case study
            </Link>
          }
        />
      ) : (
        <ul className="dash-rows">
          {rows.map((r) => (
            <li key={r.id} className="dash-row">
              <span className="dash-thumb" aria-hidden="true" />
              <div className="dash-row__main">
                <Link href={`/case-studies/${r.id}`} className="dash-row__title dash-link">
                  {r.title}
                </Link>
                <span className="dash-row__meta telemetry">/{r.slug}</span>
              </div>
              <StatusBadge status={r.status} />
              <span className="dash-owner" title={r.ownerName}>
                <span className="dash-avatar" aria-hidden="true">
                  {r.ownerInitials}
                </span>
                <span className="visually-hidden">{r.ownerName}</span>
              </span>
              <time className="telemetry dash-row__meta" dateTime={r.updatedAt}>
                {r.updatedRelative}
              </time>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  )
}
