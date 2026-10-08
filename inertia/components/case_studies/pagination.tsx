import { router } from '@inertiajs/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { CaseStudyFilters, CaseStudyMeta } from './types'

/** "1–25 of 148" (mono) · per-page select · prev/next. */
export default function Pagination({
  filters,
  meta,
}: {
  filters: CaseStudyFilters
  meta: CaseStudyMeta
}) {
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.perPage))

  const go = (patch: Partial<CaseStudyFilters>) => {
    router.get(
      '/case-studies',
      { ...filters, ...patch },
      {
        only: ['filters', 'rows', 'meta'],
        preserveState: true,
        preserveScroll: true,
        replace: true,
      }
    )
  }

  return (
    <nav className="cs-pagination" aria-label="Case studies pages">
      <p className="telemetry cs-pagination__range">
        {meta.total === 0 ? '0 results' : `${meta.from}–${meta.to} of ${meta.total}`}
      </p>
      <div className="cs-pagination__controls">
        <label className="cs-select">
          <span className="visually-hidden">Rows per page</span>
          <select
            className="field__input cs-select__input"
            value={String(filters.perPage)}
            onChange={(e) => go({ perPage: Number(e.target.value), page: 1 })}
            aria-label="Rows per page"
          >
            <option value="25">25 / page</option>
            <option value="50">50 / page</option>
          </select>
        </label>
        <button
          type="button"
          className="iconbtn"
          disabled={filters.page <= 1}
          onClick={() => go({ page: filters.page - 1 })}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} aria-hidden />
        </button>
        <button
          type="button"
          className="iconbtn"
          disabled={filters.page >= totalPages}
          onClick={() => go({ page: filters.page + 1 })}
          aria-label="Next page"
        >
          <ChevronRight size={16} aria-hidden />
        </button>
      </div>
    </nav>
  )
}
