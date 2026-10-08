import { useEffect, useMemo, useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { router } from '@inertiajs/react'
import { LayoutGrid, Plus, Table2 } from 'lucide-react'
import AppShell from '~/layouts/app_shell'
import Page from '~/components/page'
import type { InertiaProps } from '~/types'
import FilterBar from '~/components/case_studies/filter_bar'
import CaseTable from '~/components/case_studies/case_table'
import CaseGrid from '~/components/case_studies/case_grid'
import BulkBar from '~/components/case_studies/bulk_bar'
import Pagination from '~/components/case_studies/pagination'
import type { CaseStudiesProps, CaseStudyFilters } from '~/components/case_studies/types'

type Props = InertiaProps<CaseStudiesProps>

function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const onChange = () => setNarrow(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return narrow
}

export default function CaseStudies({ filters, counts, rows, meta, filterOptions }: Props) {
  const [selected, setSelected] = useState<string[]>([])
  const narrow = useNarrow()
  const view = narrow ? 'grid' : filters.view

  // Only ids present in the current rows count as selected, so stale
  // selections never survive a filter or page change.
  const visibleSelected = useMemo(
    () => selected.filter((id) => rows.some((r) => r.id === id)),
    [selected, rows]
  )

  const filtered = useMemo(
    () =>
      Boolean(
        filters.q ||
        filters.status !== 'all' ||
        filters.sector !== 'all' ||
        filters.industry !== 'all' ||
        filters.keyBusiness !== 'all' ||
        filters.category !== 'all' ||
        filters.service !== 'all' ||
        filters.client !== 'all' ||
        filters.owner !== 'all'
      ),
    [filters]
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const typing =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      if (e.key === '/' && !typing) {
        e.preventDefault()
        document.querySelector<HTMLInputElement>('[data-cs-search]')?.focus()
      }
      if ((e.key === 'c' || e.key === 'C') && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        router.visit('/case-studies/new')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const setView = (next: CaseStudyFilters['view']) => {
    router.get(
      '/case-studies',
      { ...filters, view: next, page: 1 },
      { only: ['filters'], preserveState: true, preserveScroll: true, replace: true }
    )
  }

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const toggleAll = () =>
    setSelected((s) =>
      rows.length > 0 && rows.every((r) => s.includes(r.id)) ? [] : rows.map((r) => r.id)
    )

  const clear = () => {
    router.get(
      '/case-studies',
      {
        ...filters,
        q: '',
        status: 'all',
        sector: 'all',
        industry: 'all',
        keyBusiness: 'all',
        category: 'all',
        service: 'all',
        client: 'all',
        owner: 'all',
        page: 1,
      },
      {
        only: ['filters', 'counts', 'rows', 'meta'],
        preserveState: true,
        preserveScroll: true,
        replace: true,
      }
    )
  }

  return (
    <Page
      title="Case studies"
      description={
        <span className="telemetry">
          {meta.total} total · {counts.published} published
        </span>
      }
      actions={
        <>
          <div className="cs-viewtoggle" role="group" aria-label="View">
            <button
              type="button"
              className="iconbtn"
              data-active={view === 'table' ? 'true' : 'false'}
              aria-pressed={view === 'table'}
              title="Table view"
              aria-label="Table view"
              onClick={() => setView('table')}
            >
              <Table2 size={16} aria-hidden />
            </button>
            <button
              type="button"
              className="iconbtn"
              data-active={view === 'grid' ? 'true' : 'false'}
              aria-pressed={view === 'grid'}
              title="Grid view"
              aria-label="Grid view"
              onClick={() => setView('grid')}
            >
              <LayoutGrid size={16} aria-hidden />
            </button>
          </div>
          <Link href="/case-studies/new" className="btn btn--primary">
            <Plus size={16} aria-hidden />
            New case study
          </Link>
        </>
      }
    >
      <p className="visually-hidden" role="status" aria-live="polite">
        {meta.total} results
      </p>

      <FilterBar filters={filters} counts={counts} options={filterOptions} />

      {view === 'table' ? (
        <CaseTable
          rows={rows}
          filters={filters}
          selected={visibleSelected}
          onToggle={toggle}
          onToggleAll={toggleAll}
          filtered={filtered}
          onClear={clear}
        />
      ) : (
        <CaseGrid
          rows={rows}
          selected={visibleSelected}
          onToggle={toggle}
          filtered={filtered}
          onClear={clear}
        />
      )}

      {rows.length > 0 && <Pagination filters={filters} meta={meta} />}

      <BulkBar
        count={visibleSelected.length}
        ids={visibleSelected}
        onDone={() => setSelected([])}
      />
    </Page>
  )
}

CaseStudies.layout = (page: React.ReactNode) => <AppShell>{page}</AppShell>
