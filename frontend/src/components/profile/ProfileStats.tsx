import { Progress } from '../ui'
import { difficultyLabel, formatPercent } from '../../lib/format'
import type { UserStats } from '../../hooks/stats/types'

type Props = {
  stats: UserStats | undefined
  loading: boolean
  /** Per-difficulty solved counts, derived from the solved set + catalogue. */
  breakdown: Array<{ label: string; done: number; total: number }>
}

/** Headline numbers backed by `GET /users/me/stats`. */
export default function ProfileStats({ stats, loading, breakdown }: Props) {
  const solved = stats?.solvedCount ?? 0
  const catalogueTotal = breakdown.reduce((sum, entry) => sum + entry.total, 0)
  const done = breakdown.reduce((sum, entry) => sum + entry.done, 0)
  const progress = catalogueTotal > 0 ? (done / catalogueTotal) * 100 : 0

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-muted-foreground">Problems Solved</p>
          <span className="rounded-md border border-border bg-secondary px-2 py-0.5 text-xs tabular-nums text-secondary-foreground">
            {progress.toFixed(1)}% of catalogue
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">{loading ? '—' : solved}</span>
          <span className="text-sm tabular-nums text-muted-foreground">/ {catalogueTotal || '—'}</span>
        </div>
        <Progress value={progress} />
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          {breakdown.map((entry) => (
            <div key={entry.label} className="flex flex-col gap-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{entry.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {entry.done} / {entry.total}
                </span>
              </div>
              <Progress
                value={entry.total > 0 ? (entry.done / entry.total) * 100 : 0}
                className="h-1.5"
                barClassName={entry.label === 'Easy' ? 'bg-chart-1' : entry.label === 'Medium' ? 'bg-chart-2' : 'bg-chart-3'}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm">
        <p className="text-sm font-semibold text-muted-foreground">Submissions</p>
        <span className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
          {loading ? '—' : (stats?.totalSubmissions ?? 0)}
        </span>
        <p className="text-xs text-muted-foreground">Judged full submissions across the catalogue.</p>
        <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-sm">
          <span className="text-muted-foreground">Accepted</span>
          <span className="font-medium tabular-nums text-foreground">{loading ? '—' : (stats?.acceptedSubmissions ?? 0)}</span>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm">
        <p className="text-sm font-semibold text-muted-foreground">Acceptance Rate</p>
        <span className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
          {loading ? '—' : formatPercent(stats?.acceptanceRate)}
        </span>
        <p className="text-xs text-muted-foreground">Share of your judged submissions the judge accepted.</p>
        <div className="mt-auto flex flex-col gap-2 border-t border-border pt-3">
          <Progress value={(stats?.acceptanceRate ?? 0) * 100} />
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm">
        <p className="text-sm font-semibold text-muted-foreground">Catalogue mix</p>
        <span className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">{breakdown.length}</span>
        <p className="text-xs text-muted-foreground">Difficulty bands tracked on your profile.</p>
        <div className="mt-auto flex flex-col gap-1.5 border-t border-border pt-3 text-sm">
          {breakdown.map((entry) => (
            <div key={entry.label} className="flex items-center justify-between">
              <span className="text-muted-foreground">{entry.label}</span>
              <span className="font-medium tabular-nums text-foreground">{entry.total}</span>
            </div>
          ))}
          <p className="mt-1 text-xs text-muted-foreground">{difficultyLabel('MEDIUM')} solved: {breakdown[1]?.done ?? 0}</p>
        </div>
      </section>
    </div>
  )
}