import type { ReactNode } from 'react'
import { cx } from './ui'

/* ------------------------------------------------------------------ */
/* Submissions volume — area chart (admin dashboard)                   */
/* ------------------------------------------------------------------ */

type Point = { label: string; value: number }

export function AreaChart({
  data,
  yMax,
  yStep,
  height = 260,
  peakLabel,
}: {
  data: Point[]
  yMax: number
  yStep: number
  height?: number
  peakLabel?: string
}) {
  const W = 720
  const H = height
  const padL = 44
  const padR = 16
  const padT = 16
  const padB = 28
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const x = (i: number) => padL + (i / Math.max(1, data.length - 1)) * innerW
  const y = (v: number) => padT + innerH - (Math.min(v, yMax) / yMax) * innerH

  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(' ')
  const area = `${line} L${x(data.length - 1).toFixed(1)},${padT + innerH} L${padL},${padT + innerH} Z`

  const ticks: number[] = []
  for (let v = 0; v <= yMax; v += yStep) ticks.push(v)

  const peakIndex = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Submissions volume over time">
      {ticks.map((t) => (
        <g key={t}>
          <line
            x1={padL}
            x2={W - padR}
            y1={y(t)}
            y2={y(t)}
            className="stroke-border"
            strokeDasharray="3 4"
          />
          <text x={padL - 8} y={y(t) + 3.5} textAnchor="end" className="fill-muted-foreground font-mono text-xs">
            {t >= 1000 ? `${t / 1000}k` : t}
          </text>
        </g>
      ))}
      <path d={area} className="fill-primary/10" />
      <path d={line} className="fill-none stroke-primary" strokeWidth="2" strokeLinejoin="round" />
      {data.map((d, i) =>
        i % 3 === 0 || i === data.length - 1 ? (
          <text
            key={d.label}
            x={x(i)}
            y={H - 8}
            textAnchor="middle"
            className="fill-muted-foreground font-mono text-xs"
          >
            {d.label}
          </text>
        ) : null,
      )}
      <circle cx={x(peakIndex)} cy={y(data[peakIndex].value)} r="4.5" className="fill-primary stroke-card" strokeWidth="2" />
      {peakLabel && (
        <g transform={`translate(${Math.min(x(peakIndex) + 12, W - 190)}, ${Math.max(y(data[peakIndex].value) - 46, 8)})`}>
          <rect width="176" height="38" rx="6" className="fill-popover stroke-border" />
          <circle cx="12" cy="13" r="3.5" className="fill-primary" />
          <text x="22" y="16.5" className="fill-popover-foreground text-xs font-medium">
            {peakLabel}
          </text>
          <text x="12" y="30" className="fill-muted-foreground font-mono text-xs">
            68% Accepted
          </text>
        </g>
      )}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Donut — difficulty matrix / progress ring                           */
/* ------------------------------------------------------------------ */

export function Donut({
  segments,
  size = 180,
  thickness = 14,
  children,
}: {
  segments: Array<{ value: number }>
  size?: number
  thickness?: number
  children?: ReactNode
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  let offset = 0
  const chartStrokes = ['stroke-chart-1', 'stroke-chart-2', 'stroke-chart-3', 'stroke-chart-4', 'stroke-chart-5']
  return (
    <div className="relative aspect-square w-full max-w-48">
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} className="fill-none stroke-muted" strokeWidth={thickness} />
        {segments.map((seg, i) => {
          const len = (seg.value / total) * c
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              className={cx('fill-none', chartStrokes[i % chartStrokes.length])}
              strokeWidth={thickness}
              strokeDasharray={`${Math.max(0, len - 2)} ${c - Math.max(0, len - 2)}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          )
          offset += len
          return el
        })}
      </svg>
      <div className="absolute inset-0 center flex-col">{children}</div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Activity heatmap (profile)                                          */
/* ------------------------------------------------------------------ */

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function Heatmap({ grid, className }: { grid: number[][]; className?: string }) {
  const levels = ['bg-muted', 'bg-primary/20', 'bg-primary/40', 'bg-primary/60', 'bg-primary/80']
  return (
    <div className={cx('flex flex-col gap-1 overflow-x-auto pb-1', className)}>
      <div className="flex gap-8 pl-7 text-xs text-muted-foreground" aria-hidden>
        {MONTH_LABELS.map((m) => (
          <span key={m} className="w-7 shrink-0">
            {m}
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <div className="flex w-6 shrink-0 flex-col justify-between py-px text-xs text-muted-foreground" aria-hidden>
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
        </div>
        <div className="flex gap-1" role="grid" aria-label="Submission activity over the past year">
          {grid.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((level, di) => (
                <span
                  key={di}
                  title={`${level === 0 ? 'No' : level * 2} submissions`}
                  className={cx('size-3 rounded-sm', levels[Math.max(0, Math.min(levels.length - 1, level))])}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-1 flex items-center justify-end gap-2 text-xs text-muted-foreground">
        Less
        {[0, 1, 2, 3, 4].map((lvl) => (
          <span key={lvl} className={cx('size-3 rounded-sm', levels[lvl])} />
        ))}
        More
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Runtime distribution bell curve (submission details)                */
/* ------------------------------------------------------------------ */

export function DistributionCurve({ you }: { you: number }) {
  const W = 480
  const H = 120
  const pts: string[] = []
  for (let i = 0; i <= 100; i++) {
    const t = i / 100
    // Skewed bell: main mass around 0.35, secondary bump near 0.8.
    const y =
      Math.exp(-Math.pow(t - 0.36, 2) / 0.035) * 0.9 +
      Math.exp(-Math.pow(t - 0.78, 2) / 0.012) * 0.35
    pts.push(`${i === 0 ? 'M' : 'L'}${(t * W).toFixed(1)},${(H - 14 - y * (H - 34)).toFixed(1)}`)
  }
  const youX = Math.min(0.94, Math.max(0.06, you))
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Runtime distribution of accepted solutions">
      <path d={`${pts.join(' ')} L${W},${H - 12} L0,${H - 12} Z`} className="fill-muted/50" />
      <path d={pts.join(' ')} className="fill-none stroke-border" strokeWidth="1.5" />
      <line
        x1={youX * W}
        x2={youX * W}
        y1="8"
        y2={H - 12}
        className="stroke-primary"
        strokeDasharray="3 3"
      />
      <circle cx={youX * W} cy={H - 40} r="5" className="fill-primary stroke-card" strokeWidth="2" />
      <line x1="0" x2={W} y1={H - 12} y2={H - 12} className="stroke-border" />
    </svg>
  )
}
