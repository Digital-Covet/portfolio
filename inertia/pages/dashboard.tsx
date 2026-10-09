import { useId, useState, type ReactNode } from 'react'
import { Link, router } from '@inertiajs/react'
import { Avatar } from '@base-ui/react/avatar'
import { Tabs } from '@base-ui/react/tabs'
import { Toggle } from '@base-ui/react/toggle'
import { ToggleGroup } from '@base-ui/react/toggle-group'
import {
  ArrowRight,
  Clock,
  Image as ImageIcon,
  Link2,
  Plus,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react'
import { Badge, type Tone } from '~/components/badge'
import { AreaChart } from '~/components/area_chart'
import { Card, CardTitle } from '~/components/card'
import { AdmissionStub, CropFrame, Folio } from '~/components/decor'
import Page from '~/components/page'
import AppLayout from '~/layouts/app'

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type Range = '7d' | '30d' | '90d'

type Stats = {
  published: number
  publishedDelta: number
  drafts: number
  staleDrafts: number
  activeShares: number
  sharesTrend: number[]
  views30d: number
  viewsDelta: number
}

type ShareHealth = { active: number; expiring: number; expired: number; limit: number }

type AttentionItem = {
  id: string
  kind: 'draft' | 'share'
  status: 'draft' | 'expiring' | 'expired' | 'limit'
  title: string
  /** Folio number for drafts, expiry / usage text for shares. */
  meta: string
  href: string
  due: 'today' | 'week' | 'later'
}

type Views = { range: Range; points: { date: string; value: number }[] }

type Latest = {
  folio: number
  title: string
  client: string
  href: string
  thumbnail?: string
} | null

/** Mirrors the props sent by app/controllers/dashboard_controller.ts. */
type DashboardProps = {
  today: string
  stats: Stats
  shareHealth: ShareHealth
  attention: AttentionItem[]
  /** `null` means the views query failed. */
  views: Views | null
  latest: Latest
}

const nf = new Intl.NumberFormat('en-GB')

/* -------------------------------------------------------------------------- */
/* KPI row                                                                      */
/* -------------------------------------------------------------------------- */

function Sparkline({ data }: { data: number[] }) {
  const w = 96
  const h = 40
  const min = Math.min(...data)
  const span = Math.max(...data) - min || 1
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - 4 - ((v - min) / span) * (h - 8)}`)
    .join(' ')
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label="Active shares, recent trend"
      className="shrink-0"
    >
      <polyline
        points={pts}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function KpiCard({
  label,
  value,
  children,
  aside,
}: {
  label: string
  value: number
  children?: ReactNode
  aside?: ReactNode
}) {
  return (
    <Card className="min-w-[200px] shrink-0 p-4 max-md:snap-start md:min-w-0">
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-[13px]/[18px] text-muted-foreground">{label}</h2>
          <p className="mt-1 font-mono text-[32px]/10 font-medium">{nf.format(value)}</p>
        </div>
        {aside}
      </div>
      <div className="mt-3 min-h-6 text-xs text-muted-foreground">{children}</div>
    </Card>
  )
}

function KpiRow({ stats }: { stats: Stats }) {
  return (
    <div className="max-md:order-2 flex snap-x gap-4 overflow-x-auto md:grid md:grid-cols-2 md:overflow-visible xl:col-span-12 xl:grid-cols-4 xl:gap-6">
      <KpiCard label="Published" value={stats.published}>
        <Badge tone="success" icon={TrendingUp}>
          +{stats.publishedDelta} this month
        </Badge>
      </KpiCard>
      <KpiCard label="Drafts" value={stats.drafts}>
        {stats.staleDrafts > 0 ? (
          <Link
            href="/case-studies?status=draft"
            className="inline-flex items-center gap-1 rounded-sm hover:text-foreground"
          >
            <Clock size={14} strokeWidth={1.75} className="text-warning" aria-hidden />
            {stats.staleDrafts} older than 14 days
          </Link>
        ) : (
          'All drafts are recent'
        )}
      </KpiCard>
      <KpiCard
        label="Active shares"
        value={stats.activeShares}
        aside={<Sparkline data={stats.sharesTrend} />}
      >
        <Link href="/shares" className="rounded-sm hover:text-foreground">
          View shares
        </Link>
      </KpiCard>
      <KpiCard label="Views · 30 days" value={stats.views30d}>
        <Badge tone={stats.viewsDelta >= 0 ? 'success' : 'warning'} icon={TrendingUp}>
          {stats.viewsDelta >= 0 ? '+' : ''}
          {stats.viewsDelta}% vs prior 30d
        </Badge>
      </KpiCard>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Needs attention                                                              */
/* -------------------------------------------------------------------------- */

const STATUS: Record<AttentionItem['status'], { tone: Tone; label: string }> = {
  draft: { tone: 'warning', label: 'Draft' },
  expiring: { tone: 'warning', label: 'Expiring' },
  expired: { tone: 'error', label: 'Expired' },
  limit: { tone: 'error', label: 'Limit reached' },
}

const GROUPS: { key: AttentionItem['due']; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'later', label: 'Later' },
]

function AttentionRow({ item }: { item: AttentionItem }) {
  const s = STATUS[item.status]
  const Icon = item.kind === 'share' ? Link2 : undefined
  return (
    <li>
      <Link
        href={item.href}
        className="group flex h-14 items-center gap-3 rounded-md px-2 hover:bg-secondary"
      >
        <Badge tone={s.tone} className="w-[7.5rem] shrink-0 justify-start">
          {s.label}
        </Badge>
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {Icon && (
            <Icon
              size={16}
              strokeWidth={1.75}
              className="shrink-0 text-muted-foreground"
              aria-hidden
            />
          )}
          <span className="truncate font-medium">{item.title}</span>
        </span>
        <span className="hidden font-mono text-xs text-muted-foreground sm:block">{item.meta}</span>
        <span className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-[13px] text-muted-foreground group-hover:text-foreground">
          Open <span className="sr-only">{item.title}</span>
          <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
        </span>
      </Link>
    </li>
  )
}

function AttentionList({ items, empty }: { items: AttentionItem[]; empty: ReactNode }) {
  if (items.length === 0) return <>{empty}</>
  return (
    <div className="flex flex-col gap-3">
      {GROUPS.map((g) => {
        const rows = items.filter((i) => i.due === g.key)
        if (!rows.length) return null
        return (
          <div key={g.key}>
            <h3 className="px-2 pb-1 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {g.label}
            </h3>
            <ul>
              {rows.map((i) => (
                <AttentionRow key={i.id} item={i} />
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

/** Blank contact sheet: three empty 4:3 frames, one accent detail. */
function ContactSheetIllustration({ width = 120 }: { width?: number }) {
  return (
    <svg width={width} height={width * 0.45} viewBox="0 0 120 54" fill="none" aria-hidden>
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

function EmptyState({ title, action }: { title: string; action: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <ContactSheetIllustration />
      <p className="font-display text-base/6 font-semibold">{title}</p>
      {action}
    </div>
  )
}

const secondaryBtn =
  'inline-flex h-9 items-center gap-2 rounded-md bg-secondary px-3 text-sm font-medium transition-colors hover:bg-secondary/70'
const primaryBtn =
  'inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90'

function NeedsAttention({
  items,
  workspaceEmpty,
}: {
  items: AttentionItem[]
  workspaceEmpty: boolean
}) {
  const tabs = [
    { value: 'all', label: 'All', items },
    { value: 'drafts', label: 'Drafts', items: items.filter((i) => i.kind === 'draft') },
    { value: 'shares', label: 'Shares', items: items.filter((i) => i.kind === 'share') },
  ]
  const empty = workspaceEmpty ? (
    <EmptyState title="Add your first case study" action={null} />
  ) : (
    <EmptyState
      title="Nothing needs you today."
      action={
        <Link href="/case-studies" className={secondaryBtn}>
          Browse case studies
        </Link>
      }
    />
  )

  return (
    <Card className="max-md:order-1 p-4 xl:col-span-8">
      <CardTitle>Needs attention</CardTitle>
      <Tabs.Root defaultValue="all" className="mt-3">
        <Tabs.List className="mb-3 flex gap-1 border-b border-border">
          {tabs.map((t) => (
            <Tabs.Tab
              key={t.value}
              value={t.value}
              className="-mb-px flex h-9 items-center gap-2 border-b-2 border-transparent px-3 text-sm text-muted-foreground transition-colors hover:text-foreground aria-selected:border-primary aria-selected:text-foreground"
            >
              {t.label}
              <span className="font-mono text-xs">{t.items.length}</span>
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {tabs.map((t) => (
          <Tabs.Panel key={t.value} value={t.value}>
            <AttentionList items={t.items} empty={empty} />
          </Tabs.Panel>
        ))}
      </Tabs.Root>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/* Share health                                                                 */
/* -------------------------------------------------------------------------- */

function ShareHealthCard({ health }: { health: ShareHealth }) {
  const hatch = useId()
  const total = health.active + health.expiring + health.expired + health.limit
  const segments = [
    { key: 'active', label: 'Active', n: health.active, bar: 'bg-success', icon: 'text-success' },
    {
      key: 'expiring',
      label: 'Expiring',
      n: health.expiring,
      bar: 'bg-warning',
      icon: 'text-warning',
    },
    { key: 'expired', label: 'Expired', n: health.expired, bar: 'bg-error', icon: 'text-error' },
    { key: 'limit', label: 'Limit reached', n: health.limit, bar: 'bg-error', icon: 'text-error' },
  ]
  return (
    <Card className="relative max-md:order-3 overflow-hidden p-4 max-lg:pt-20 lg:pr-[calc(var(--stub-width)+1rem)] xl:col-span-4">
      <CardTitle>Share health</CardTitle>
      <div
        role="img"
        aria-label={`${total} shares: ${segments.map((s) => `${s.n} ${s.label.toLowerCase()}`).join(', ')}`}
        className="mt-4 flex h-2 gap-0.5 overflow-hidden rounded-full bg-secondary"
      >
        {segments.map((s) =>
          s.n > 0 ? (
            <div
              key={s.key}
              style={{ flexGrow: s.n }}
              className={`basis-0 ${s.key === 'limit' ? 'bg-error/25' : s.bar}`}
            >
              {s.key === 'limit' && (
                <svg className="size-full" aria-hidden>
                  <defs>
                    <pattern
                      id={hatch}
                      width="4"
                      height="4"
                      patternUnits="userSpaceOnUse"
                      patternTransform="rotate(45)"
                    >
                      <rect width="2" height="4" fill="var(--error)" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill={`url(#${hatch})`} />
                </svg>
              )}
            </div>
          ) : null
        )}
      </div>
      <ul className="mt-4 flex flex-col gap-2 text-[13px]/[18px]">
        {[
          { ...segments[0], Icon: Clock, icon: 'text-success' },
          { ...segments[1], Icon: Clock, icon: 'text-warning' },
          { ...segments[2], Icon: Clock, icon: 'text-error' },
          { ...segments[3], Icon: TriangleAlert, icon: 'text-error' },
        ].map(({ key, label, n, icon, Icon }) => (
          <li key={key} className="flex items-center gap-2">
            <Icon size={16} strokeWidth={1.75} className={icon} aria-hidden />
            <span className="text-muted-foreground">{label}</span>
            <span className="ml-auto font-mono text-xs">{n}</span>
          </li>
        ))}
      </ul>
      <AdmissionStub
        label="Expiring"
        value={health.expiring}
        caption="≤ 7 days"
        fill={total ? health.expiring / total : 0}
      />
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/* Views chart                                                                  */
/* -------------------------------------------------------------------------- */

const RANGES: { value: Range; label: string }[] = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
]

function ViewsCard({
  views,
  range,
  onRange,
  loading,
}: {
  views: Views | null
  range: Range
  onRange: (r: Range) => void
  loading: boolean
}) {
  return (
    <Card className="max-md:order-4 flex h-[280px] flex-col p-4 xl:col-span-8">
      <div className="mb-3 flex items-center justify-between gap-2">
        <CardTitle>Views</CardTitle>
        <ToggleGroup
          value={[range]}
          onValueChange={(next) => next[0] && onRange(next[0] as Range)}
          aria-label="Views range"
          className="flex rounded-md border border-border p-0.5"
        >
          {RANGES.map((r) => (
            <Toggle
              key={r.value}
              value={r.value}
              className="h-7 min-w-9 rounded-sm px-2 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground data-[pressed]:bg-secondary data-[pressed]:text-foreground"
            >
              {r.label}
            </Toggle>
          ))}
        </ToggleGroup>
      </div>
      {views ? (
        <div
          className={`flex min-h-0 flex-1 flex-col transition-opacity ${loading ? 'opacity-60' : ''}`}
        >
          <AreaChart points={views.points} />
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-muted-foreground">Couldn’t load views</p>
          <button type="button" onClick={() => onRange(range)} className={secondaryBtn}>
            Retry
          </button>
        </div>
      )}
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/* Latest published                                                             */
/* -------------------------------------------------------------------------- */

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function LatestPublished({ latest }: { latest: Latest }) {
  return (
    <Card className="max-md:order-5 p-4 xl:col-span-4">
      <CardTitle>Latest published</CardTitle>
      {latest ? (
        <>
          {/* Crop marks sit outside the frame; hidden when the card stacks (<768). */}
          <div className="mt-4 hidden md:block">
            <CropFrame tick={12}>
              <Thumb latest={latest} />
            </CropFrame>
          </div>
          <div className="mt-4 md:hidden">
            <Thumb latest={latest} />
          </div>
          <div className="mt-3 flex flex-col gap-1">
            <Folio n={latest.folio} />
            <p className="font-display text-base/6 font-semibold">{latest.title}</p>
            <div className="flex items-center gap-2 text-[13px]/[18px] text-muted-foreground">
              <Avatar.Root className="inline-flex size-5 items-center justify-center overflow-hidden rounded-full bg-secondary text-[10px] font-medium text-foreground">
                <Avatar.Fallback>{initials(latest.client)}</Avatar.Fallback>
              </Avatar.Root>
              {latest.client}
            </div>
          </div>
          <Link
            href={latest.href}
            className="mt-3 inline-flex items-center gap-1 rounded-sm text-sm font-medium text-primary hover:underline"
          >
            View study <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
          </Link>
        </>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Published studies appear here.</p>
      )}
    </Card>
  )
}

function Thumb({ latest }: { latest: NonNullable<Latest> }) {
  return latest.thumbnail ? (
    <img
      src={latest.thumbnail}
      alt=""
      width={640}
      height={480}
      loading="lazy"
      className="aspect-[4/3] w-full rounded-md object-cover"
    />
  ) : (
    <div className="flex aspect-[4/3] w-full items-center justify-center rounded-md bg-surface-raised text-muted-foreground">
      <ImageIcon size={20} strokeWidth={1.75} aria-hidden />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Page                                                                         */
/* -------------------------------------------------------------------------- */

export default function Dashboard({
  today,
  stats,
  shareHealth,
  attention,
  views,
  latest,
}: DashboardProps) {
  const [range, setRange] = useState<Range>(views?.range ?? '30d')
  const [loading, setLoading] = useState(false)
  const changeRange = (next: Range) => {
    setRange(next)
    router.reload({
      only: ['views'],
      data: { range: next },
      onStart: () => setLoading(true),
      onFinish: () => setLoading(false),
    })
  }

  const workspaceEmpty = stats.published + stats.drafts === 0

  return (
    <Page
      title="Dashboard"
      description={`Portfolio health for Today, ${today}`}
      actions={
        <>
          <Link href="/shares/new" className={`${secondaryBtn} max-md:hidden`}>
            <Link2 size={16} strokeWidth={1.75} aria-hidden /> New share
          </Link>
          <Link href="/case-studies/new" className={primaryBtn}>
            <Plus size={16} strokeWidth={1.75} aria-hidden /> New case study
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-6 xl:grid xl:grid-cols-12">
        {!workspaceEmpty && <KpiRow stats={stats} />}
        <NeedsAttention items={workspaceEmpty ? [] : attention} workspaceEmpty={workspaceEmpty} />
        <ShareHealthCard health={shareHealth} />
        <ViewsCard views={views} range={range} onRange={changeRange} loading={loading} />
        <LatestPublished latest={latest} />
      </div>
    </Page>
  )
}

Dashboard.layout = [AppLayout]
