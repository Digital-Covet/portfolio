import { Link } from '@adonisjs/inertia/react'
import { router } from '@inertiajs/react'
import { LibraryBig } from 'lucide-react'
import { EmptyState, StatusBadge } from '~/components/dashboard/widgets'
import { RowMenu } from './row_menu'
import type { CaseStudyFilters, CaseStudyRow } from './types'

const SKELETON_ROWS = 8

function SkeletonRows() {
  return (
    <tbody aria-hidden="true">
      {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
        <tr key={i} className="cs-row">
          <td className="cs-cell">
            <span className="skeleton" style={{ width: 16, height: 16 }} />
          </td>
          <td className="cs-cell">
            <span className="skeleton" style={{ width: 220, height: 32 }} />
          </td>
          <td className="cs-cell cs-hide-lg">
            <span className="skeleton" style={{ width: 120, height: 20 }} />
          </td>
          <td className="cs-cell cs-hide-lg">
            <span className="skeleton" style={{ width: 140, height: 20 }} />
          </td>
          <td className="cs-cell">
            <span className="skeleton" style={{ width: 90, height: 24 }} />
          </td>
          <td className="cs-cell cs-hide-lg">
            <span className="skeleton" style={{ width: 110, height: 20 }} />
          </td>
          <td className="cs-cell">
            <span className="skeleton" style={{ width: 70, height: 20 }} />
          </td>
          <td className="cs-cell">
            <span className="skeleton" style={{ width: 32, height: 32 }} />
          </td>
        </tr>
      ))}
    </tbody>
  )
}

/**
 * Default dense view: one Level-1 card with a native table (56px rows,
 * sticky header). Selected rows get primary/10 + Signal Line edge.
 */
export default function CaseTable({
  rows,
  filters,
  selected,
  onToggle,
  onToggleAll,
  loading,
  filtered,
  onClear,
}: {
  rows: CaseStudyRow[]
  filters: CaseStudyFilters
  selected: string[]
  onToggle: (id: string) => void
  onToggleAll: () => void
  loading?: boolean
  filtered: boolean
  onClear: () => void
}) {
  const sortBy = (sort: CaseStudyFilters['sort']) => {
    router.get(
      '/case-studies',
      { ...filters, sort, page: 1 },
      {
        only: ['filters', 'rows', 'meta'],
        preserveState: true,
        preserveScroll: true,
        replace: true,
      }
    )
  }

  if (!loading && rows.length === 0) {
    return (
      <div className="cs-card">
        {filtered ? (
          <EmptyState
            icon={<LibraryBig size={24} aria-hidden />}
            title="No case studies match these filters"
            action={
              <button type="button" className="btn btn--outline btn--sm" onClick={onClear}>
                Clear filters
              </button>
            }
          />
        ) : (
          <EmptyState
            icon={<LibraryBig size={24} aria-hidden />}
            title="No case studies yet"
            action={
              <Link href="/case-studies/new" className="btn btn--primary btn--sm">
                Create your first case study
              </Link>
            }
          />
        )}
      </div>
    )
  }

  const allSelected = rows.length > 0 && rows.every((r) => selected.includes(r.id))

  return (
    <div className="cs-card cs-tablewrap" aria-busy={loading ? 'true' : undefined}>
      <table className="cs-table">
        <caption className="visually-hidden">
          Case studies, sorted by {filters.sort === 'title' ? 'title' : 'last updated'}
        </caption>
        <thead>
          <tr>
            <th scope="col" className="cs-cell cs-cell--check">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                aria-label={allSelected ? 'Deselect all case studies' : 'Select all case studies'}
              />
            </th>
            <th
              scope="col"
              className="cs-th"
              aria-sort={filters.sort === 'title' ? 'ascending' : 'none'}
            >
              <button type="button" className="cs-sort" onClick={() => sortBy('title')}>
                Case study
              </button>
            </th>
            <th scope="col" className="cs-th cs-hide-lg">
              Client
            </th>
            <th scope="col" className="cs-th cs-hide-lg">
              Sector › Industry
            </th>
            <th scope="col" className="cs-th">
              Status
            </th>
            <th scope="col" className="cs-th cs-hide-lg">
              Owner
            </th>
            <th
              scope="col"
              className="cs-th"
              aria-sort={filters.sort === 'updated' ? 'descending' : 'none'}
            >
              <button type="button" className="cs-sort" onClick={() => sortBy('updated')}>
                Updated
              </button>
            </th>
            <th scope="col" className="cs-th">
              <span className="visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        {loading ? (
          <SkeletonRows />
        ) : (
          <tbody>
            {rows.map((r) => {
              const checked = selected.includes(r.id)
              return (
                <tr key={r.id} className="cs-row" data-selected={checked ? 'true' : 'false'}>
                  <td className="cs-cell cs-cell--check">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(r.id)}
                      aria-label={`Select ${r.title}`}
                    />
                  </td>
                  <td className="cs-cell cs-cell--title">
                    {r.heroThumb ? (
                      <img
                        src={r.heroThumb}
                        alt=""
                        width={56}
                        height={32}
                        loading="lazy"
                        className="cs-thumb"
                      />
                    ) : (
                      <span className="cs-thumb" aria-hidden="true" />
                    )}
                    <span className="cs-titlewrap">
                      <Link href={`/case-studies/${r.id}`} className="cs-title">
                        {r.title}
                      </Link>
                      <span className="telemetry cs-slug">/{r.slug}</span>
                    </span>
                  </td>
                  <td className="cs-cell cs-hide-lg">
                    <span className="cs-client">
                      {r.clientLogo ? (
                        <img
                          src={r.clientLogo}
                          alt=""
                          width={24}
                          height={16}
                          loading="lazy"
                          className="client-chip"
                        />
                      ) : (
                        <span className="client-chip" aria-hidden="true" />
                      )}
                      {r.clientName}
                    </span>
                  </td>
                  <td className="cs-cell cs-hide-lg cs-sector">
                    {r.sector} › {r.industry}
                  </td>
                  <td className="cs-cell">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="cs-cell cs-hide-lg">
                    <span className="cs-owner" title={r.ownerName}>
                      <span className="dash-avatar" aria-hidden="true">
                        {r.ownerInitials}
                      </span>
                      {r.ownerName}
                    </span>
                  </td>
                  <td className="cs-cell">
                    <time className="telemetry cs-time" dateTime={r.updatedAt} title={r.updatedAt}>
                      {r.updatedRelative}
                    </time>
                  </td>
                  <td className="cs-cell cs-cell--menu">
                    <RowMenu row={r} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        )}
      </table>
    </div>
  )
}
