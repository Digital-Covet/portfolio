import { useId, useState } from 'react'

export type ChartPoint = { date: string; value: number }
function fmtDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}

export function AreaChart({ points }: { points: ChartPoint[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const gradId = useId()
  const W = 800
  const H = 200
  const max = Math.max(...points.map((p) => p.value), 1) * 1.1
  const x = (i: number) => (i / Math.max(points.length - 1, 1)) * W
  const y = (v: number) => H - (v / max) * H
  const line = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`)
    .join(' ')
  const area = `${line} L${W},${H} L0,${H} Z`
  const active = hover === null ? null : points[hover]

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className="relative min-h-0 flex-1"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          const t = (e.clientX - r.left) / r.width
          setHover(Math.min(points.length - 1, Math.max(0, Math.round(t * (points.length - 1)))))
        }}
        onPointerLeave={() => setHover(null)}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="size-full overflow-visible"
          aria-hidden
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--primary)" stopOpacity="0.25" />
              <stop offset="1" stopColor="var(--primary)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1="0"
              x2={W}
              y1={H * f}
              y2={H * f}
              stroke="var(--border)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <path d={area} fill={`url(#${gradId})`} />
          <path
            d={line}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {active && hover !== null && (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 w-px bg-border-strong"
              style={{ left: `${(hover / Math.max(points.length - 1, 1)) * 100}%` }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute size-2.5 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-surface bg-primary"
              style={{
                left: `${(hover / Math.max(points.length - 1, 1)) * 100}%`,
                bottom: `${(active.value / max) * 100}%`,
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-md border border-border-raised bg-surface-raised px-2 py-1 text-xs shadow-[var(--shadow-raised)]"
              style={{
                left: `clamp(48px, ${(hover / Math.max(points.length - 1, 1)) * 100}%, calc(100% - 48px))`,
              }}
            >
              <span className="text-muted-foreground">{fmtDate(active.date)}</span>{' '}
              <span className="font-mono font-medium">{active.value}</span>
            </div>
          </>
        )}
      </div>
      <div
        aria-hidden
        className="mt-2 flex justify-between font-mono text-[11px] text-muted-foreground"
      >
        <span>{fmtDate(points[0].date)}</span>
        <span>{fmtDate(points[Math.floor(points.length / 2)].date)}</span>
        <span>{fmtDate(points[points.length - 1].date)}</span>
      </div>
      <table className="sr-only">
        <caption>Per day</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Views</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.date}>
              <td>{p.date}</td>
              <td>{p.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
