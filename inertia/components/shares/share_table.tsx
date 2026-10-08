import { Link } from '@adonisjs/inertia/react'
import { router } from '@inertiajs/react'
import { CalendarClock, Eye, Link2, Lock } from 'lucide-react'
import { StatusBadge } from '~/components/dashboard/widgets'
import RowMenu from './row_menu'
import type { SharesFilters, ShareRow } from './types'

export function ProtectionIcons({ row }: { row: ShareRow }) {
  return (
    <span style={{ display: 'inline-flex', gap: 8, color: 'var(--fg-3)' }} aria-label="Protection">
      <span title={row.hasPassword ? 'Password protected' : 'No password'}>
        <Lock
          size={15}
          aria-hidden
          aria-label={row.hasPassword ? 'Password protected' : 'No password'}
          style={row.hasPassword ? { color: 'var(--fg-1)' } : undefined}
        />
      </span>
      <span title={row.expiresAt ? `Expires ${row.expiresAt}` : 'No expiry'}>
        <CalendarClock
          size={15}
          aria-hidden
          aria-label={row.expiresAt ? `Expires ${row.expiresAt}` : 'No expiry'}
          style={row.expiresAt ? { color: 'var(--fg-1)' } : undefined}
        />
      </span>
      <span title={row.maxViews ? `Capped at ${row.maxViews} views` : 'Unlimited views'}>
        <Eye
          size={15}
          aria-hidden
          aria-label={row.maxViews ? `Capped at ${row.maxViews} views` : 'Unlimited views'}
          style={row.maxViews ? { color: 'var(--fg-1)' } : undefined}
        />
      </span>
    </span>
  )
}

export function ContentLabel({ row }: { row: ShareRow }) {
  return <span>{row.content.label}</span>
}

export default function ShareTable({
  rows,
  filtered,
  onClear,
}: {
  rows: ShareRow[]
  filters: SharesFilters
  filtered: boolean
  onClear: () => void
}) {
  const clear = onClear

  if (rows.length === 0) {
    return (
      <div className="cs-card">
        {filtered ? (
          <div className="empty">
            <p className="empty__title">No shares match these filters</p>
            <button type="button" className="btn btn--outline btn--sm" onClick={clear}>
              Clear filters
            </button>
          </div>
        ) : (
          <div className="empty">
            <div className="empty__patch covet-grid" aria-hidden="true">
              <span className="empty__icon">
                <Link2 size={24} aria-hidden />
              </span>
            </div>
            <p className="empty__title">No shares yet</p>
            <Link href="/shares/new" className="btn btn--primary btn--sm">
              Create your first share
            </Link>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="cs-card cs-tablewrap">
      <table className="cs-table">
        <caption className="visually-hidden">Shares</caption>
        <thead>
          <tr>
            <th scope="col" className="cs-th">
              Recipient
            </th>
            <th scope="col" className="cs-th">
              Content
            </th>
            <th scope="col" className="cs-th">
              Protection
            </th>
            <th scope="col" className="cs-th">
              Views
            </th>
            <th scope="col" className="cs-th">
              Status
            </th>
            <th scope="col" className="cs-th">
              Created
            </th>
            <th scope="col" className="cs-th">
              <span className="visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="cs-row">
              <td className="cs-cell cs-cell--title">
                <span className="cs-titlewrap">
                  <Link href={`/shares/${r.id}`} className="cs-title">
                    {r.recipient}
                    {r.company ? ` · ${r.company}` : ''}
                  </Link>
                  <span className="telemetry cs-slug">…{r.tokenSuffix}</span>
                </span>
              </td>
              <td className="cs-cell">
                <ContentLabel row={r} />
              </td>
              <td className="cs-cell">
                <ProtectionIcons row={r} />
              </td>
              <td className="cs-cell">
                <span className="telemetry cs-time">
                  {r.views}
                  {r.maxViews ? ` / ${r.maxViews}` : ''}
                </span>
              </td>
              <td className="cs-cell">
                <StatusBadge status={r.status} />
              </td>
              <td className="cs-cell">
                <time className="telemetry cs-time" dateTime={r.createdAt} title={r.createdAt}>
                  {r.createdRelative}
                </time>
              </td>
              <td className="cs-cell cs-cell--menu">
                <RowMenu row={r} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function sharesQuery(filters: SharesFilters) {
  return { ...filters }
}

export async function noopReload() {
  router.reload({ only: ['rows', 'meta', 'counts', 'filters'] })
}
