import { Link } from '@adonisjs/inertia/react'
import { Briefcase, Eye, Link2, Pencil, Plus } from 'lucide-react'
import AppShell from '~/layouts/app_shell'
import Page from '~/components/page'
import type { InertiaProps } from '~/types'
import DashboardFilters from '~/components/dashboard/dashboard_filters'
import ViewsChart from '~/components/dashboard/views_chart'
import { BySector, RecentlyUpdated, TopShares } from '~/components/dashboard/dashboard_sections'
import type { DashboardProps } from '~/components/dashboard/types'
import { EmptyState, WidgetCard } from '~/components/dashboard/widgets'

type Props = InertiaProps<DashboardProps>

function Kpi({
  label,
  value,
  icon,
  halo,
  sub,
}: {
  label: string
  value: number
  icon: React.ReactNode
  halo?: boolean
  sub?: React.ReactNode
}) {
  return (
    <dl className={`kpi${halo ? ' halo' : ''}`}>
      <dt className="telemetry-label kpi__label">
        <span className="kpi__icon" aria-hidden="true">
          {icon}
        </span>
        {label}
      </dt>
      <dd className="telemetry kpi__value">{value}</dd>
      {sub && <dd className="kpi__sub">{sub}</dd>}
    </dl>
  )
}

export default function Dashboard({
  filters,
  sectors,
  stats,
  viewsSeries,
  topShares,
  bySector,
  recent,
}: Props) {
  return (
    <Page
      title="Dashboard"
      description="Portfolio health and share activity."
      actions={
        <DashboardFilters
          filters={filters}
          sectors={sectors}
          data={{ viewsSeries, topShares, bySector, recent }}
        />
      }
    >
      <div className="kpi-strip" aria-label="Key metrics">
        <Kpi
          label="Published case studies"
          value={stats.published}
          icon={<Briefcase size={16} aria-hidden />}
          halo
          sub={
            stats.publishedDelta !== 0 ? (
              <span className="telemetry">
                {stats.publishedDelta > 0 ? '+' : ''}
                {stats.publishedDelta} vs previous range
              </span>
            ) : (
              <span className="telemetry">vs previous range</span>
            )
          }
        />
        <Kpi
          label="Drafts"
          value={stats.drafts}
          icon={<Pencil size={16} aria-hidden />}
          sub={
            <Link href="/case-studies?status=draft" className="dash-link">
              Review drafts
            </Link>
          }
        />
        <Kpi
          label="Active shares"
          value={stats.activeShares}
          icon={<Link2 size={16} aria-hidden />}
          sub={
            stats.expiringSoon > 0 ? (
              <span className="kpi__warn">
                <TriangleAlertInline /> {stats.expiringSoon} expiring in 7 days
              </span>
            ) : (
              <span className="telemetry">0 expiring in 7 days</span>
            )
          }
        />
        <Kpi label="Share views" value={stats.views} icon={<Eye size={16} aria-hidden />} />
      </div>

      <div className="dash-grid dash-grid--main">
        <WidgetCard title="Views over time">
          {viewsSeries.values.length === 0 ? (
            <EmptyState
              icon={<Eye size={24} aria-hidden />}
              title="No share views in this range"
              action={
                <Link href="/shares/new" className="btn btn--outline btn--sm">
                  <Plus size={14} aria-hidden /> Create a share
                </Link>
              }
            />
          ) : (
            <ViewsChart series={viewsSeries} />
          )}
        </WidgetCard>
        <TopShares rows={topShares} />
      </div>

      <div className="dash-grid dash-grid--lower">
        <BySector rows={bySector} />
        <RecentlyUpdated rows={recent} />
      </div>
    </Page>
  )
}

function TriangleAlertInline() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3 2.5 20h19L12 3Z"
        stroke="var(--warning)"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M12 10v4" stroke="var(--warning)" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1" fill="var(--warning)" />
    </svg>
  )
}

Dashboard.layout = (page: React.ReactNode) => <AppShell>{page}</AppShell>
