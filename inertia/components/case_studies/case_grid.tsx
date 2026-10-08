import { Link } from '@adonisjs/inertia/react'
import { LibraryBig } from 'lucide-react'
import { EmptyState, StatusBadge } from '~/components/dashboard/widgets'
import { RowMenu } from './row_menu'
import type { CaseStudyRow } from './types'

/**
 * Card-grid view: 16:9 image · client chip bottom-left · status Badge
 * top-right · title · sector line. Selectable via corner checkbox.
 */
export default function CaseGrid({
  rows,
  selected,
  onToggle,
  filtered,
  onClear,
}: {
  rows: CaseStudyRow[]
  selected: string[]
  onToggle: (id: string) => void
  filtered: boolean
  onClear: () => void
}) {
  if (rows.length === 0) {
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

  return (
    <ul className="cs-grid" aria-label="Case studies">
      {rows.map((r) => {
        const checked = selected.includes(r.id)
        return (
          <li key={r.id} className="cs-tile" data-selected={checked ? 'true' : 'false'}>
            <label className="cs-tile__check">
              <span className="visually-hidden">Select {r.title}</span>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(r.id)}
                aria-label={`Select ${r.title}`}
              />
            </label>
            <Link
              href={`/case-studies/${r.id}`}
              className="cs-tile__media"
              aria-label={`${r.title}, ${r.sector}`}
            >
              {r.heroThumb ? (
                <img src={r.heroThumb} alt="" loading="lazy" className="cs-tile__img" />
              ) : (
                <span className="cs-tile__img cs-tile__img--empty" aria-hidden="true" />
              )}
              <span className="cs-tile__badge">
                <StatusBadge status={r.status} />
              </span>
              <span className="cs-tile__client client-chip">{r.clientName}</span>
            </Link>
            <div className="cs-tile__body">
              <Link href={`/case-studies/${r.id}`} className="cs-title">
                {r.title}
              </Link>
              <p className="cs-tile__sector">
                {r.sector} › {r.industry}
              </p>
            </div>
            <div className="cs-tile__menu">
              <RowMenu row={r} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
