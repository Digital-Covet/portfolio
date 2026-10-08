import { useEffect, useRef } from 'react'
import { Popover, PopoverPositioner, PopoverPopup } from '~/components/ui/popover'
import { Tabs, PillTab } from '~/components/ui/tabs'
import { UiSelect } from '~/components/ui/select'
import { router } from '@inertiajs/react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import type {
  CaseStudiesProps,
  CaseStudyCounts,
  CaseStudyFilters,
  CaseStudyFilterOptions,
} from './types'

const TABS: Array<{ value: CaseStudyFilters['status']; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
]

const ONLY = ['filters', 'counts', 'rows', 'meta'] as const

function isFiltering(f: CaseStudyFilters): boolean {
  return Boolean(
    f.q ||
    f.status !== 'all' ||
    f.sector !== 'all' ||
    f.industry !== 'all' ||
    f.keyBusiness !== 'all' ||
    f.category !== 'all' ||
    f.service !== 'all' ||
    f.client !== 'all' ||
    f.owner !== 'all'
  )
}

/**
 * Sticky filter bar: search (debounced, "/" focuses) · status tabs with mono
 * counts · cascading Sector → Industry → Key business · "More filters"
 * popover · "Clear filters" only when active.
 */
export default function FilterBar({
  filters,
  counts,
  options,
}: {
  filters: CaseStudyFilters
  counts: CaseStudyCounts
  options: CaseStudyFilterOptions
}) {
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (debounce.current) clearTimeout(debounce.current)
    }
  }, [])

  const apply = (patch: Partial<CaseStudyFilters>) => {
    router.get(
      '/case-studies',
      { ...filters, ...patch, page: patch.page ?? 1 },
      {
        only: [...ONLY],
        preserveState: true,
        preserveScroll: true,
        replace: true,
      }
    )
  }

  const onQuery = (value: string) => {
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => {
      apply({ q: value })
    }, 250)
  }

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
      { only: [...ONLY], preserveState: true, preserveScroll: true, replace: true }
    )
  }

  const countFor = (tab: CaseStudyFilters['status']) => (tab === 'all' ? counts.all : counts[tab])

  return (
    <div className="cs-filterbar" role="search" aria-label="Filter case studies">
      <div className="cs-search">
        <Search size={16} aria-hidden className="cs-search__icon" />
        <label className="visually-hidden" htmlFor="cs-search">
          Search title, client or slug
        </label>
        <input
          id="cs-search"
          data-cs-search
          key={filters.q}
          className="field__input cs-search__input"
          type="search"
          placeholder="Search title, client or slug"
          defaultValue={filters.q}
          onChange={(e) => onQuery(e.target.value)}
          autoComplete="off"
        />
      </div>

      <Tabs.Root
        value={filters.status}
        onValueChange={(v) => apply({ status: v as CaseStudyFilters['status'] })}
      >
        <Tabs.List className="cs-tabs" aria-label="Status">
          {TABS.map((t) => (
            <PillTab key={t.value} value={t.value}>
              {t.label}
              <span className="telemetry cs-tab__count">{countFor(t.value)}</span>
            </PillTab>
          ))}
        </Tabs.List>
      </Tabs.Root>

      <div className="cs-selects">
        <UiSelect
          label="Sector"
          value={filters.sector}
          onValueChange={(sector) => apply({ sector, industry: 'all', keyBusiness: 'all' })}
          options={[
            { value: 'all', label: 'Sector: All' },
            ...options.sectors.map((s) => ({ value: s, label: s })),
          ]}
        />

        <UiSelect
          label="Industry"
          value={filters.industry}
          onValueChange={(industry) => apply({ industry, keyBusiness: 'all' })}
          options={[
            { value: 'all', label: 'Industry: All' },
            ...options.industries.map((s) => ({ value: s, label: s })),
          ]}
          disabled={filters.sector === 'all'}
        />

        <UiSelect
          label="Key business"
          value={filters.keyBusiness}
          onValueChange={(keyBusiness) => apply({ keyBusiness })}
          options={[
            { value: 'all', label: 'Key business: All' },
            ...options.keyBusinesses.map((s) => ({ value: s, label: s })),
          ]}
          disabled={filters.industry === 'all'}
        />

        <Popover.Root>
          <Popover.Trigger className="btn btn--outline">
            <SlidersHorizontal size={16} aria-hidden />
            More filters
          </Popover.Trigger>
          <Popover.Portal>
            <PopoverPositioner side="bottom" align="end" sideOffset={8}>
              <PopoverPopup className="cs-popover" aria-label="More filters">
                <UiSelect
                  label="Category"
                  value={filters.category}
                  onValueChange={(category) => apply({ category })}
                  options={[
                    { value: 'all', label: 'All categories' },
                    ...options.categories.map((s) => ({ value: s, label: s })),
                  ]}
                />
                <UiSelect
                  label="Service"
                  value={filters.service}
                  onValueChange={(service) => apply({ service })}
                  options={[
                    { value: 'all', label: 'All services' },
                    ...options.services.map((s) => ({ value: s, label: s })),
                  ]}
                />
                <UiSelect
                  label="Client"
                  value={filters.client}
                  onValueChange={(client) => apply({ client })}
                  options={[
                    { value: 'all', label: 'All clients' },
                    ...options.clients.map((s) => ({ value: s, label: s })),
                  ]}
                />
                <UiSelect
                  label="Owner"
                  value={filters.owner}
                  onValueChange={(owner) => apply({ owner })}
                  options={[
                    { value: 'all', label: 'All owners' },
                    ...options.owners.map((s) => ({ value: s, label: s })),
                  ]}
                />
              </PopoverPopup>
            </PopoverPositioner>
          </Popover.Portal>
        </Popover.Root>

        {isFiltering(filters) && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={clear}>
            <X size={14} aria-hidden />
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}

export type { CaseStudiesProps }
