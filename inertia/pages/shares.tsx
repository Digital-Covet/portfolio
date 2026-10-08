import { Link } from '@adonisjs/inertia/react'
import { router } from '@inertiajs/react'
import { Plus, Search } from 'lucide-react'
import AppShell from '~/layouts/app_shell'
import Page from '~/components/page'
import type { InertiaProps } from '~/types'
import type { SharesProps } from '~/components/shares/types'
import ShareTable from '~/components/shares/share_table'

type Props = InertiaProps<SharesProps>

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'expiring', label: 'Expiring' },
  { key: 'expired', label: 'Expired' },
  { key: 'limit', label: 'Limit reached' },
] as const

export default function Shares({ filters, counts, rows, meta }: Props) {
  const filtered = Boolean(filters.q || filters.status !== 'all')

  const set = (patch: Partial<typeof filters>) => {
    router.get(
      '/shares',
      { ...filters, ...patch, page: patch.status !== undefined ? 1 : filters.page },
      {
        only: ['filters', 'counts', 'rows', 'meta'],
        preserveState: true,
        preserveScroll: true,
        replace: true,
      }
    )
  }

  const clear = () => {
    router.get(
      '/shares',
      { q: '', status: 'all', page: 1, perPage: filters.perPage },
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
      title="Shares"
      description={
        <span className="telemetry">
          {meta.total} total · {counts.active} active
        </span>
      }
      actions={
        <Link href="/shares/new" className="btn btn--primary">
          <Plus size={16} aria-hidden />
          New share
        </Link>
      }
    >
      <p className="visually-hidden" role="status" aria-live="polite">
        {meta.total} results
      </p>

      <div className="cs-filterbar">
        <div className="cs-search">
          <span className="cs-search__icon" aria-hidden="true">
            <Search size={15} />
          </span>
          <input
            className="field__input cs-search__input"
            placeholder="Search recipient, company or token"
            defaultValue={filters.q}
            aria-label="Search shares"
            onChange={(e) => {
              const v = e.target.value
              window.clearTimeout((window as unknown as { __shq?: number }).__shq)
              ;(window as unknown as { __shq?: number }).__shq = window.setTimeout(
                () => set({ q: v, page: 1 }),
                250
              )
            }}
          />
        </div>
        <div className="cs-tabs" role="tablist" aria-label="Status">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={filters.status === t.key}
              className="cs-tab"
              data-active={filters.status === t.key ? 'true' : 'false'}
              onClick={() => set({ status: t.key as typeof filters.status })}
            >
              {t.label}
              <span className="telemetry cs-tab__count">
                {counts[t.key as keyof typeof counts] ?? 0}
              </span>
            </button>
          ))}
        </div>
        {filtered && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={clear}>
            Clear filters
          </button>
        )}
      </div>

      <ShareTable rows={rows} filters={filters} filtered={filtered} onClear={clear} />

      {rows.length > 0 && (
        <div className="cs-pagination">
          <p className="telemetry cs-pagination__range">
            {meta.from}–{meta.to} of {meta.total}
          </p>
          <div className="cs-pagination__controls">
            <button
              type="button"
              className="btn btn--outline btn--sm"
              disabled={filters.page <= 1}
              onClick={() => set({ page: filters.page - 1 })}
            >
              Prev
            </button>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              disabled={meta.to >= meta.total}
              onClick={() => set({ page: filters.page + 1 })}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </Page>
  )
}

Shares.layout = (page: React.ReactNode) => <AppShell>{page}</AppShell>
