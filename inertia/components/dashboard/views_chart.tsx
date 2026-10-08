import { useId, useMemo } from 'react'
import type { ViewsSeries } from './types'

const W = 720
const H = 260
const PAD = { top: 16, right: 16, bottom: 28, left: 40 }

/**
 * Views-over-time line chart (dependency-free SVG so the workspace stays
 * within budget). Single --accent series, hairline gridlines, tooltip via
 * <title>, plus a visually-hidden data table for screen readers.
 */
export default function ViewsChart({ series }: { series: ViewsSeries }) {
  const chartId = useId()
  const tableId = useId()

  const { points, gridlines, max } = useMemo(() => {
    const values = series.values
    const peak = Math.max(1, ...values)
    const innerW = W - PAD.left - PAD.right
    const innerH = H - PAD.top - PAD.bottom
    const n = Math.max(values.length, 1)
    const pts = values.map((v, i) => {
      const x = PAD.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW)
      const y = PAD.top + innerH - (v / peak) * innerH
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    const lines = [0.25, 0.5, 0.75, 1].map((f) => ({
      y: PAD.top + innerH * (1 - f),
      value: Math.round(peak * f),
    }))
    return { points: pts.join(' '), gridlines: lines, max: peak }
  }, [series.values])

  const summary = `Share views over the selected range. Total ${series.total} views, peak ${max} in one bucket.`

  return (
    <div className="views-chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-labelledby={`${chartId} ${tableId}`}
        className="views-chart__svg"
      >
        <title id={chartId}>{summary}</title>
        {gridlines.map((g) => (
          <g key={g.y}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={g.y}
              y2={g.y}
              className="views-chart__grid"
            />
            <text x={PAD.left - 8} y={g.y + 4} textAnchor="end" className="views-chart__tick">
              {g.value}
            </text>
          </g>
        ))}
        {series.values.length > 0 ? (
          <>
            <polyline points={points} className="views-chart__line" fill="none">
              <title>{summary}</title>
            </polyline>
            {series.values.map((v, i) => {
              const n = series.values.length
              const innerW = W - PAD.left - PAD.right
              const innerH = H - PAD.top - PAD.bottom
              const cx = PAD.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW)
              const cy = PAD.top + innerH - (v / Math.max(1, ...series.values)) * innerH
              const label = series.labels[i] ?? `Bucket ${i + 1}`
              return (
                <circle key={label} cx={cx} cy={cy} r={4} className="views-chart__dot">
                  <title>{`${label}: ${v} views`}</title>
                </circle>
              )
            })}
          </>
        ) : (
          <text x={W / 2} y={H / 2} textAnchor="middle" className="views-chart__tick">
            No data
          </text>
        )}
      </svg>
      <table id={tableId} className="visually-hidden">
        <caption>{summary}</caption>
        <tbody>
          {series.labels.map((label, i) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              <td>{series.values[i] ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
