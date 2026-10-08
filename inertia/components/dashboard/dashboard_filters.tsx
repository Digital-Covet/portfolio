import { Menu, MenuPositioner, MenuPopup, MenuItem } from '~/components/ui/menu'
import { UiSelect } from '~/components/ui/select'
import { router } from '@inertiajs/react'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import type { DashboardFilters, DashboardProps } from './types'

const RANGES = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
] as const

type ExportData = Pick<DashboardProps, 'viewsSeries' | 'topShares' | 'bySector' | 'recent'>

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const escaped = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
  const blob = new Blob([escaped.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Header controls: one range governs every widget; Export menu is Base UI. */
export default function DashboardFilters({
  filters,
  sectors,
  data,
}: {
  filters: DashboardFilters
  sectors: string[]
  data: ExportData
}) {
  const apply = (patch: Partial<DashboardFilters>) => {
    router.get(
      '/dashboard',
      { range: filters.range, sector: filters.sector, ...patch },
      {
        only: ['filters', 'stats', 'viewsSeries', 'topShares', 'bySector', 'recent'],
        preserveState: true,
        preserveScroll: true,
        replace: true,
      }
    )
  }

  const exportCsv = () => {
    try {
      downloadCsv(`dashboard-last-${filters.range}-days.csv`, [
        ['Section', 'Name', 'Value'],
        ...data.viewsSeries.labels.map((label, i): Array<string | number> => [
          'Views over time',
          label,
          data.viewsSeries.values[i] ?? 0,
        ]),
        ...data.topShares.map((s): Array<string | number> => [
          'Top shares',
          `${s.recipient} · ${s.company}`,
          s.views,
        ]),
        ...data.bySector.map((s): Array<string | number> => ['By sector', s.name, s.count]),
        ...data.recent.map((r): Array<string | number> => ['Recently updated', r.title, r.status]),
      ])
      toast.success('CSV exported')
    } catch {
      toast.error('Export failed. Try again.')
    }
  }

  const exportPdf = () => {
    // Interim: print-to-PDF until jsPDF lands (dynamic import on click).
    toast.success('Use “Save as PDF” in the print dialog')
    window.print()
  }

  return (
    <div className="dash-filters" role="group" aria-label="Dashboard range, sector and export">
      <UiSelect
        label="Range"
        value={filters.range}
        onValueChange={(range) => apply({ range: range as DashboardFilters['range'] })}
        options={RANGES.map((r) => ({ value: r.value, label: r.label }))}
        className="dash-select__input"
      />

      <UiSelect
        label="Sector"
        value={filters.sector}
        onValueChange={(sector) => apply({ sector })}
        options={[
          { value: 'all', label: 'All sectors' },
          ...sectors.filter((s) => s !== 'All sectors').map((s) => ({ value: s, label: s })),
        ]}
        className="dash-select__input"
      />

      <Menu.Root>
        <Menu.Trigger className="btn btn--outline">
          <Download size={16} aria-hidden />
          Export
        </Menu.Trigger>
        <Menu.Portal>
          <MenuPositioner side="bottom" align="end" sideOffset={6}>
            <MenuPopup aria-label="Export options">
              <MenuItem onClick={exportCsv}>Export CSV</MenuItem>
              <MenuItem onClick={exportPdf}>Export PDF</MenuItem>
            </MenuPopup>
          </MenuPositioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
  )
}
