import { useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { CalendarClock, Check, Copy, Eye, Lock } from 'lucide-react'
import AppShell from '~/layouts/app_shell'
import Page from '~/components/page'
import ViewsChart from '~/components/dashboard/views_chart'
import { StatusBadge, WidgetCard } from '~/components/dashboard/widgets'
import type { InertiaProps } from '~/types'
import type { ShareDetailProps } from '~/components/shares/types'

type Props = InertiaProps<ShareDetailProps>

function Kpi({ label, value, halo }: { label: string; value: string; halo?: boolean }) {
  return (
    <dl className={`kpi${halo ? ' halo' : ''}`}>
      <dt className="telemetry-label kpi__label">{label}</dt>
      <dd className="telemetry kpi__value">{value}</dd>
    </dl>
  )
}

export default function ShareDetail({ share, kpis, viewsSeries, visits }: Props) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    const url = share.link.startsWith('http')
      ? share.link
      : `${window.location.origin}${share.link}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = url
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  const downloadCsv = () => {
    const rows = [
      ['viewed_at', 'masked_ip', 'device'],
      ...visits.map((v) => [v.viewedAt, v.maskedIp, v.device]),
    ]
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `share-${share.id}-visits.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <Page
      title={`${share.recipient}${share.company ? ` · ${share.company}` : ''}`}
      description={
        <span className="telemetry">
          …{share.tokenSuffix} · Created {share.createdRelative}
        </span>
      }
      actions={
        <>
          <button type="button" className="btn btn--outline" onClick={copy}>
            {copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
            {copied ? 'Copied' : 'Copy link'}
          </button>
          {share.editable && (
            <Link href={`/shares/${share.id}/edit`} className="btn btn--primary">
              Edit share
            </Link>
          )}
        </>
      }
    >
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <StatusBadge status={share.status} />
        <span style={{ display: 'inline-flex', gap: 8, color: 'var(--fg-3)' }}>
          <Lock size={14} aria-label={share.hasPassword ? 'Password protected' : 'No password'} />
          <CalendarClock
            size={14}
            aria-label={share.expiresAt ? `Expires ${share.expiresAt}` : 'No expiry'}
          />
          <Eye
            size={14}
            aria-label={share.maxViews ? `Capped at ${share.maxViews}` : 'Unlimited'}
          />
        </span>
      </div>

      {!share.editable && (
        <div className="alert" role="note" style={{ marginBottom: 16 }}>
          <p>Owned by {share.ownerName ?? 'someone'}. Read-only.</p>
        </div>
      )}

      <div className="kpi-strip" aria-label="Share metrics">
        <Kpi label="Total views" value={String(kpis.totalViews)} halo />
        <Kpi label="Last viewed" value={kpis.lastViewedRelative} />
        <Kpi label="Views remaining" value={kpis.viewsRemaining} />
        <Kpi label="Expires in" value={kpis.expiresIn} />
      </div>

      <div className="dash-grid dash-grid--main" style={{ gridTemplateColumns: '1fr' }}>
        <WidgetCard title="Views over time">
          {viewsSeries.values.length === 0 ? (
            <p className="empty__title">No views yet for this share.</p>
          ) : (
            <ViewsChart series={viewsSeries} />
          )}
        </WidgetCard>
      </div>

      <WidgetCard
        title="Visits"
        action={
          visits.length > 0 ? (
            <button type="button" className="btn btn--outline btn--sm" onClick={downloadCsv}>
              Export CSV
            </button>
          ) : undefined
        }
      >
        {visits.length === 0 ? (
          <p className="empty__title">No visits recorded.</p>
        ) : (
          <div className="cs-tablewrap">
            <table className="cs-table">
              <caption className="visually-hidden">Share visits (IP masked)</caption>
              <thead>
                <tr>
                  <th scope="col" className="cs-th">
                    Time
                  </th>
                  <th scope="col" className="cs-th">
                    IP
                  </th>
                  <th scope="col" className="cs-th">
                    Device
                  </th>
                </tr>
              </thead>
              <tbody>
                {visits.map((v) => (
                  <tr key={v.id} className="cs-row">
                    <td className="cs-cell">
                      <time className="telemetry cs-time" dateTime={v.viewedAt} title={v.viewedAt}>
                        {v.viewedRelative}
                      </time>
                    </td>
                    <td className="cs-cell">
                      <span className="telemetry cs-time">{v.maskedIp}</span>
                    </td>
                    <td className="cs-cell">{v.device}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </WidgetCard>
    </Page>
  )
}

ShareDetail.layout = (page: React.ReactNode) => (
  <AppShell crumbs={[{ label: 'Shares', href: '/shares' }, { label: 'Analytics' }]}>
    {page}
  </AppShell>
)
