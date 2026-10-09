import { useState } from 'react'
import { Link, router } from '@inertiajs/react'
import { Menu } from '@base-ui/react/menu'
import {
  Ban,
  CalendarPlus,
  Ellipsis,
  Info,
  Lock,
  LockOpen,
  Monitor,
  Pencil,
  Smartphone,
  Tablet,
  type LucideIcon,
} from 'lucide-react'
import { AreaChart } from '~/components/area_chart'
import { Badge, type Tone } from '~/components/badge'
import { Card, CardTitle } from '~/components/card'
import CopyButton from '~/components/copy_button'
import { Folio, ShareTicket } from '~/components/decor'
import Page from '~/components/page'
import RevokeDialog from '~/components/revoke_share_dialog'
import AppLayout from '~/layouts/app'
import { relativeTime, shareUrl, shortDate, shortToken, type ShareState } from '~/lib/share'

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type Study = { id: string; title: string; folio: number; client: string; thumbnail: string | null }

/** Mirrors the props sent by SharesController.show. */
type ShowProps = {
  share: {
    id: string
    name: string
    token: string
    state: ShareState
    protected: boolean
    expiresAt: string | null
    maxViews: number | null
    viewCount: number
    owner: string
    createdAt: string
  }
  stats: { views: number; visitors: number; lastVisit: string | null }
  series: { date: string; value: number }[]
  devices: { device: 'Desktop' | 'Mobile' | 'Tablet'; count: number }[]
  visits: {
    page: number
    perPage: number
    total: number
    rows: { id: string; at: string; device: 'Desktop' | 'Mobile' | 'Tablet'; browser: string }[]
  }
  contents:
    | { kind: 'pinned'; items: Study[] }
    | {
        kind: 'rule'
        rules: { field: string; names: string[] }[]
        count: number
        items: Study[]
      }
}

const STATE_BADGE: Record<ShareState, { tone: Tone; label: string }> = {
  active: { tone: 'success', label: 'Active' },
  expiring: { tone: 'warning', label: 'Expiring' },
  expired: { tone: 'error', label: 'Expired' },
  limit: { tone: 'error', label: 'Limit reached' },
}

const STUB_ALERT: Partial<Record<ShareState, string>> = {
  expired: 'EXPIRED',
  limit: 'LIMIT REACHED',
}

const DEVICE_ICON: Record<string, LucideIcon> = {
  Desktop: Monitor,
  Mobile: Smartphone,
  Tablet,
}

const FIELD_LABEL: Record<string, string> = {
  sector: 'Sector',
  industry: 'Industry',
  keyBusiness: 'Key business',
  workCategory: 'Work category',
  service: 'Service',
  client: 'Client',
}

const primaryBtn =
  'inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90'
const secondaryBtn =
  'inline-flex h-9 items-center gap-2 rounded-md bg-secondary px-3 text-sm font-medium transition-colors hover:bg-secondary/70'
const menuItemCls =
  'flex h-9 w-full cursor-pointer items-center gap-2 rounded-sm px-2 text-sm outline-none data-[highlighted]:bg-secondary'

/* -------------------------------------------------------------------------- */
/* Pieces                                                                      */
/* -------------------------------------------------------------------------- */

function Kpi({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card className="p-4">
      <h2 className="text-xs font-medium text-muted-foreground">{label}</h2>
      <p className="mt-1 font-mono text-[32px]/10 font-medium">{value}</p>
      {hint && <p className="font-mono text-xs text-muted-foreground">{hint}</p>}
    </Card>
  )
}

function Thumb({ src }: { src: string | null }) {
  return (
    <span className="inline-flex h-[30px] w-10 shrink-0 overflow-hidden rounded-sm bg-secondary ring-1 ring-border">
      {src && <img src={src} alt="" loading="lazy" className="size-full object-cover" />}
    </span>
  )
}

function Devices({ devices }: { devices: ShowProps['devices'] }) {
  const total = devices.reduce((n, d) => n + d.count, 0)
  return (
    <ul className="flex flex-col gap-4">
      {devices.map((d) => {
        const Icon = DEVICE_ICON[d.device]
        const pct = total ? Math.round((d.count / total) * 100) : 0
        return (
          <li key={d.device}>
            <div className="mb-1.5 flex items-center justify-between text-[13px]">
              <span className="flex items-center gap-2">
                <Icon size={16} strokeWidth={1.75} className="text-muted-foreground" aria-hidden />
                {d.device}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {d.count} · {pct}%
              </span>
            </div>
            <div
              role="img"
              aria-label={`${d.device}: ${pct}% of visits`}
              className="h-2 overflow-hidden rounded-full bg-secondary"
            >
              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function VisitLog({ visits }: { visits: ShowProps['visits'] }) {
  const pages = Math.max(1, Math.ceil(visits.total / visits.perPage))
  const go = (page: number) =>
    router.get(
      location.pathname,
      { page },
      { only: ['visits'], preserveState: true, preserveScroll: true }
    )
  const th = 'h-10 px-4 text-left text-xs font-medium text-muted-foreground'
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-[13px]/[18px]">
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className={th}>
                Time
              </th>
              <th scope="col" className={th}>
                Device
              </th>
              <th scope="col" className={th}>
                Browser
              </th>
            </tr>
          </thead>
          <tbody>
            {visits.rows.map((v) => {
              const Icon = DEVICE_ICON[v.device]
              return (
                <tr key={v.id} className="h-10 border-b border-border last:border-b-0">
                  <td className="px-4 font-mono text-xs" title={new Date(v.at).toUTCString()}>
                    {relativeTime(v.at)}
                  </td>
                  <td className="px-4">
                    <span className="flex items-center gap-2">
                      <Icon
                        size={16}
                        strokeWidth={1.75}
                        className="text-muted-foreground"
                        aria-hidden
                      />
                      {v.device}
                    </span>
                  </td>
                  <td className="px-4 text-muted-foreground">{v.browser}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <span className="font-mono text-xs text-muted-foreground">
            {(visits.page - 1) * visits.perPage + 1}–
            {Math.min(visits.page * visits.perPage, visits.total)} of {visits.total}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={visits.page <= 1}
              onClick={() => go(visits.page - 1)}
              className={`${secondaryBtn} h-8 disabled:opacity-50`}
            >
              Previous
            </button>
            <button
              type="button"
              disabled={visits.page >= pages}
              onClick={() => go(visits.page + 1)}
              className={`${secondaryBtn} h-8 disabled:opacity-50`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  )
}

/** Blank contact-sheet frames with one accent detail (the kit's empty-state art). */
function EmptyIllustration() {
  return (
    <svg width={120} height={54} viewBox="0 0 120 54" fill="none" aria-hidden>
      {[0, 42, 84].map((x, i) => (
        <rect
          key={x}
          x={x + 1}
          y={1}
          width={34}
          height={26}
          rx={2}
          stroke={i === 1 ? 'var(--accent)' : 'var(--muted-foreground)'}
          strokeWidth={1.5}
        />
      ))}
      {[0, 42, 84].map((x) => (
        <rect
          key={x}
          x={x + 1}
          y={29}
          width={34}
          height={24}
          rx={2}
          stroke="var(--muted-foreground)"
          strokeWidth={1.5}
          opacity={0.6}
        />
      ))}
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/* Page                                                                         */
/* -------------------------------------------------------------------------- */

export default function ShareShow({ share, stats, series, devices, visits, contents }: ShowProps) {
  const [revoking, setRevoking] = useState(false)
  const badge = STATE_BADGE[share.state]
  const noVisits = stats.views === 0

  return (
    <Page
      title={share.name}
      eyebrow={
        <span className="flex items-center gap-2">
          <Link href="/shares" className="hover:text-foreground hover:underline">
            Shares
          </Link>
          <span aria-hidden>/</span>
          <Badge tone={badge.tone}>{badge.label}</Badge>
        </span>
      }
      description={`Created by ${share.owner} · ${shortDate(share.createdAt)}`}
      actions={
        <>
          <CopyButton
            value={() => shareUrl(share.token)}
            announce="Link copied"
            className={primaryBtn}
          >
            Copy link
          </CopyButton>
          <Link href={`/shares/${share.id}/edit`} className={secondaryBtn}>
            <Pencil size={16} strokeWidth={1.75} aria-hidden /> Edit
          </Link>
          <Menu.Root>
            <Menu.Trigger
              aria-label="More actions"
              className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground data-[popup-open]:bg-secondary"
            >
              <Ellipsis size={16} strokeWidth={1.75} aria-hidden />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner side="bottom" align="end" sideOffset={4} className="z-50">
                <Menu.Popup className="min-w-48 rounded-lg border border-border-raised bg-surface-raised p-1 shadow-[var(--shadow-raised)]">
                  <Menu.Item
                    className={menuItemCls}
                    onClick={() =>
                      router.post(`/shares/${share.id}/extend`, {}, { preserveScroll: true })
                    }
                  >
                    <CalendarPlus size={16} strokeWidth={1.75} aria-hidden /> Extend 7 days
                  </Menu.Item>
                  <Menu.Separator className="my-1 h-px bg-border-raised" />
                  <Menu.Item
                    className={`${menuItemCls} text-error`}
                    onClick={() => setRevoking(true)}
                  >
                    <Ban size={16} strokeWidth={1.75} aria-hidden /> Revoke link
                  </Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </>
      }
    >
      <div className="grid grid-cols-12 gap-6 pb-8">
        {/* Access: remaining admission, at a glance. */}
        <Card className="col-span-12 border-0 bg-transparent p-0">
          <h2 className="sr-only">Access</h2>
          <ShareTicket
            used={share.viewCount}
            cap={share.maxViews}
            expiresAt={share.expiresAt}
            locked={share.protected}
            alert={STUB_ALERT[share.state]}
          >
            <dl className="flex flex-wrap gap-x-10 gap-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Link</dt>
                <dd className="font-mono text-xs/5">{shortToken(share.token)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Protection</dt>
                <dd className="flex items-center gap-1.5">
                  {share.protected ? (
                    <Lock size={14} strokeWidth={1.75} aria-hidden />
                  ) : (
                    <LockOpen size={14} strokeWidth={1.75} aria-hidden />
                  )}
                  {share.protected ? 'Password' : 'Open'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Type</dt>
                <dd>
                  {contents.kind === 'rule' ? (
                    <Badge tone="info" icon={Info}>
                      Live rule
                    </Badge>
                  ) : (
                    <Badge>Pinned · {contents.items.length} studies</Badge>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Views</dt>
                <dd className="font-mono text-xs/5">
                  {share.maxViews === null
                    ? `${share.viewCount} · no cap`
                    : `${share.viewCount} of ${share.maxViews} views`}
                </dd>
              </div>
            </dl>
          </ShareTicket>
        </Card>

        <div className="col-span-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Kpi label="Views" value={stats.views} />
          <Kpi label="Unique visitors" value={stats.visitors} />
          <Kpi label="Last visit" value={stats.lastVisit ? relativeTime(stats.lastVisit) : '—'} />
        </div>

        <Card className="col-span-12 flex min-h-[260px] flex-col gap-3 p-4 lg:col-span-8">
          <CardTitle>Visits over time</CardTitle>
          {noVisits ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-8 text-center">
              <EmptyIllustration />
              <p className="max-w-[44ch] text-sm text-muted-foreground">
                No visits yet. Links are usually opened within 48 hours of sending.
              </p>
            </div>
          ) : (
            <div className="flex h-[200px] flex-col">
              <AreaChart points={series} />
            </div>
          )}
        </Card>

        {noVisits ? null : (
          <Card className="col-span-12 flex flex-col gap-4 p-4 lg:col-span-4">
            <CardTitle>Devices</CardTitle>
            <Devices devices={devices} />
          </Card>
        )}

        {!noVisits && (
          <Card className="col-span-12 overflow-hidden p-0 lg:col-span-8">
            <CardTitle className="px-4 pb-1 pt-4">Visit log</CardTitle>
            <VisitLog visits={visits} />
          </Card>
        )}

        <Card className="col-span-12 flex flex-col gap-3 p-4 lg:col-span-4">
          <CardTitle>Contents</CardTitle>
          {contents.kind === 'rule' && (
            <div className="flex flex-col gap-2">
              <p className="text-sm">
                Matches now: <span className="font-mono font-medium">{contents.count}</span>
              </p>
              <ul className="flex flex-wrap gap-1">
                {contents.rules.flatMap((r) =>
                  r.names.map((n) => (
                    <li
                      key={`${r.field}-${n}`}
                      className="inline-flex h-6 items-center rounded-full bg-secondary px-2 text-xs"
                    >
                      <span className="mr-1 text-muted-foreground">{FIELD_LABEL[r.field]}:</span>
                      {n}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
          {contents.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing published matches yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {contents.items.map((s) => (
                <li key={s.id} className="flex items-center gap-3">
                  <Thumb src={s.thumbnail} />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/case-studies/${s.id}`}
                      className="block truncate text-sm font-medium hover:underline"
                    >
                      {s.title}
                    </Link>
                    <Folio n={s.folio} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          {contents.kind === 'rule' && contents.count > contents.items.length && (
            <p className="text-xs text-muted-foreground">
              + {contents.count - contents.items.length} more
            </p>
          )}
        </Card>
      </div>

      <RevokeDialog
        target={revoking ? { id: share.id, name: share.name } : null}
        onClose={() => setRevoking(false)}
      />
    </Page>
  )
}

ShareShow.layout = [AppLayout]
