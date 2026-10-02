import { useEffect, useMemo, useState } from 'react'

import AdminLayout from './AdminLayout'
import { Icon } from '../../components/icons'
import { AreaChart, Donut } from '../../components/charts'
import { Progress, Segmented, cx } from '../../components/ui'
import { ADMIN_SUBMISSIONS, DIFFICULTY_MATRIX, VOLUME_SERIES } from '../../data'
import type { SubmissionStatus } from '../../data'
import CustomLink from '../../components/CustomLink'
import { Button } from '../../components/ui/button'

function statusTone(status: SubmissionStatus) {
  if (status === 'Accepted') return 'bg-primary/10 text-primary'
  if (status === 'Time Limit Exceeded') return 'bg-muted text-muted-foreground'
  return 'bg-destructive/10 text-destructive'
}

function StatCard({
  label,
  value,
  delta,
  deltaTone = 'success',
  icon,
  chip,
  footer,
}: {
  label: string
  value: string
  delta?: string
  deltaTone?: 'success' | 'neutral'
  icon: Parameters<typeof Icon>[0]['name']
  chip?: string
  footer: Array<{ k?: string; v: string }>
}) {
  return (
    <section className="rounded-xl border border-border bg-card text-card-foreground shadow-sm flex flex-col gap-2.5 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <span className="flex items-center gap-2">
          {chip && (
            <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium bg-muted text-muted-foreground font-mono text-xs h-6">
              <span className="h-1.5 w-1.5 rounded-full bg-muted" aria-hidden />
              {chip}
            </span>
          )}
          <span className="center h-8 w-8 rounded-md bg-muted/40 text-muted-foreground">
            <Icon name={icon} size={16} />
          </span>
        </span>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-2xl font-semibold leading-10 tracking-tight tabular-nums text-foreground">
          {value}
        </span>
        {delta && (
          <span
            className={cx('text-xs tabular-nums flex items-center gap-1', deltaTone === 'success' ? 'text-primary' : 'text-muted-foreground')}
          >
            <Icon name="arrowUpRight" size={12} />
            {delta}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2.5">
        {footer.map((f) => (
          <span key={f.v} className="text-xs text-muted-foreground">
            {f.k && <span className="text-muted-foreground">{f.k} </span>}
            {f.v}
          </span>
        ))}
      </div>
    </section>
  )
}

/** Synthesize a longer trailing series so the 90D range has its own shape. */
function build90() {
  const earlier: Array<{ label: string; value: number }> = []
  for (let i = 0; i < 36; i++) {
    // earlier.push({ label: `Feb ${String((i % 27) + 1).padStart(2, '0')}`, value: Math.round(5200 + i * 95 + Math.sin(i / 3.1) * 900 + Math.cos(i / 1.7) * 500) })
  }
  return [...earlier, ...VOLUME_SERIES]
}

export default function AdminDashboard() {
  
  const [range, setRange] = useState<'7D' | '30D' | '90D'>('30D')
  const [syncSeconds, setSyncSeconds] = useState(0)
  const [filter, setFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('All statuses')

  useEffect(() => {
    const t = window.setInterval(() => setSyncSeconds((s) => s + 1), 1000)
    return () => window.clearInterval(t)
  }, [])

  const series = useMemo(() => {
    if (range === '7D') return VOLUME_SERIES.slice(-7)
    if (range === '90D') return build90()
    return VOLUME_SERIES
  }, [range])

  const rows = ADMIN_SUBMISSIONS.filter(
    (s) =>
      (statusFilter === 'All statuses' || s.status === statusFilter) &&
      (!filter.trim() ||
        s.developer.toLowerCase().includes(filter.toLowerCase()) ||
        s.problemTitle.toLowerCase().includes(filter.toLowerCase()) ||
        s.id.includes(filter)),
  )

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-[1440px] flex flex-col gap-5 px-4 py-6 lg:px-8">
        {/* Breadcrumb + title */}
        <div className="flex flex-col gap-1">
          <p className="font-mono text-xs flex items-center gap-2 text-muted-foreground">
            ADMIN / DASHBOARD
            <span className="h-1 w-1 rounded-full bg-primary" aria-hidden />
            TELEMETRY LIVE
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">System Overview &amp; Telemetry</h1>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-0.5 text-xs text-secondary-foreground font-mono text-xs">v2.14.0-edge</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Button variant="outline"
                type="button"
                onClick={() => {
                  setSyncSeconds(0)
                  // push({ title: 'Telemetry refreshed', description: 'All panels pulled fresh cluster metrics.', tone: 'success' })
                }}
              >
                <Icon name="refresh" size={14} />
                Refresh Data
                <span className="font-mono text-xs text-muted-foreground">{syncSeconds}s ago</span>
              </Button>
              <Button
                type="button"
                // onClick={() => push({ title: 'Report exported', description: 'codeforge-telemetry.csv · 24 KB', tone: 'success' })}
              >
                <Icon name="download" size={14} />
                Export Report
                <span className="rounded-sm bg-primary-foreground/15 px-1.5 py-0.5 text-xs text-primary-foreground">
                  CSV
                </span>
              </Button>
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total users"
            value="48,290"
            delta="12.4%"
            icon="users"
            footer={[
              { k: 'Active Today', v: '3,812 concurrent' },
            ]}
          />
          <StatCard
            label="Catalog problems"
            value="524"
            delta="+8 this week"
            deltaTone="neutral"
            icon="code"
            footer={[{ v: '148 E · 274 M · 102 H' }]}
          />
          <StatCard
            label="Submissions"
            value="1,842,910"
            delta="24.8%"
            icon="terminal"
            footer={[{ k: 'Acceptance Rate', v: '64.2% average' }]}
          />
          <StatCard
            label="Today's load"
            value="14,382"
            delta="+18.2%"
            deltaTone="neutral"
            icon="gauge"
            chip="98% CAP"
            footer={[
              { k: 'Runners', v: '98/100' },
              { v: '420 req/m peak' },
            ]}
          />
        </div>

        {/* Chart + matrix */}
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
          <section className="rounded-xl border border-border bg-card text-card-foreground shadow-sm flex flex-col gap-4 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                  <Icon name="activity" size={17} className="text-primary" />
                  Submissions Volume
                </h2>
                <p className="text-xs mt-0.5 text-muted-foreground">
                  Execution throughput across all sandboxed test runners
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-0.5 text-xs text-secondary-foreground font-mono text-xs">
                  Peak: {Math.max(...series.map((p) => p.value)).toLocaleString()} on May 12
                </span>
                <Segmented
                  ariaLabel="Chart range"
                  value={range}
                  onChange={setRange}
                  options={[
                    { value: '7D', label: '7D' },
                    { value: '30D', label: '30D' },
                    { value: '90D', label: '90D' },
                  ]}
                />
              </div>
            </div>

            <div className="rounded-md border border-border bg-muted/50 p-3">
              <AreaChart data={series} yMax={25000} yStep={5000} peakLabel="22,410 submissions" />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-4">
                {[
                  { color: 'bg-chart-1', l: 'Python (41.2%)' },
                  { color: 'bg-chart-2', l: 'C++ (28.4%)' },
                  { color: 'bg-chart-3', l: 'Rust/TS (30.4%)' },
                ].map((x) => (
                  <span key={x.l} className="text-xs flex items-center gap-2 text-muted-foreground">
                    <span className={cx('size-2 rounded-full', x.color)} aria-hidden />
                    {x.l}
                  </span>
                ))}
              </div>
              <span className="font-mono text-xs text-muted-foreground">Avg Execution: 28.4ms</span>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card text-card-foreground shadow-sm flex flex-col gap-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Difficulty Matrix</h2>
                <p className="text-xs mt-0.5 text-muted-foreground">Library composition</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium bg-primary/10 text-primary tabular-nums">524 Active</span>
            </div>

            <div className="center py-1">
              <Donut
                size={168}
                thickness={16}
                segments={DIFFICULTY_MATRIX.map((d) => ({ value: d.percent }))}
              >
                <span className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">524</span>
                <span className="text-sm font-semibold text-muted-foreground">Problems</span>
              </Donut>
            </div>

            <div className="flex flex-col gap-3">
              {DIFFICULTY_MATRIX.map((d, index) => (
                <div key={d.label} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium flex items-center gap-2 text-foreground">
                      <span className={cx('size-2.5 rounded-sm', ['bg-chart-1', 'bg-chart-2', 'bg-chart-3'][index])} aria-hidden />
                      {d.label}
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      <span className="font-medium text-foreground">{d.count}</span> ({d.percent}%)
                    </span>
                  </div>
                  <Progress value={d.percent} className="h-1.5" barClassName={['bg-chart-1', 'bg-chart-2', 'bg-chart-3'][index]} />
                  <div className="flex justify-between font-mono text-xs text-muted-foreground">
                    <span>{d.submits} submits</span>
                    <span>{d.accuracy} Acc.</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs border-t border-border pt-3 text-muted-foreground">
              Pool Balance: Optimal for L4/L6 Interview Prep
            </p>
          </section>
        </div>

        {/* Recent submissions */}
        <section className="rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5 pb-4">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden />
              <h2 className="text-lg font-semibold text-foreground">Recent Submissions</h2>
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium bg-primary/10 text-primary h-6">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                Live Stream
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Icon
                  name="filter"
                  size={13}
                  className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  className="input h-8 w-[220px] pl-8 text-[13px]"
                  placeholder="Filter submissions or users…"
                  aria-label="Filter submissions"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>
              <select
                className="input select h-8 w-[150px] text-[13px]"
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {['All statuses', 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Memory Limit Exceeded'].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <CustomLink to="/admin/submissions" className="link text-sm font-medium inline-flex items-center gap-1.5 px-1">
                View all
                <Icon name="arrowRight" size={13} />
              </CustomLink>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="ntable">
              <thead>
                <tr>
                  <th className="pl-5">ID</th>
                  <th>Developer</th>
                  <th>Problem</th>
                  <th className="hidden lg:table-cell">Language</th>
                  <th>Status</th>
                  <th className="hidden md:table-cell">Runtime</th>
                  <th className="hidden xl:table-cell">Memory</th>
                  <th className="hidden md:table-cell">Timestamp</th>
                  <th className="pr-5 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td className="font-mono text-xs pl-5 text-muted-foreground">#{s.id}</td>
                    <td>
                      <span className="flex items-center gap-2.5">
                        <span className="center h-6 w-6 flex-none rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                          {s.initials}
                        </span>
                        <span className="text-sm font-medium text-foreground">{s.developer}</span>
                      </span>
                    </td>
                    <td>
                      <CustomLink to={`/problems/${s.problemNum === 1 ? 'two-sum' : 'two-sum'}/submissions`} className="flex items-center gap-2 hover:text-primary">
                        <span className="font-mono text-xs tabular-nums text-muted-foreground">{s.problemNum}.</span>
                        <span className="text-sm font-medium text-foreground">{s.problemTitle}</span>
                      </CustomLink>
                    </td>
                    <td className="hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-0.5 text-xs text-secondary-foreground font-mono text-xs">{s.language}</span>
                    </td>
                    <td>
                      <span className={cx('inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium', statusTone(s.status))}>{s.status}</span>
                    </td>
                    <td className="text-sm tabular-nums hidden text-muted-foreground md:table-cell">{s.runtime}</td>
                    <td className="text-sm tabular-nums hidden text-muted-foreground xl:table-cell">{s.memory}</td>
                    <td className="text-xs hidden text-muted-foreground md:table-cell">{s.timestamp}</td>
                    <td className="pr-5 text-right">
                      <Button variant="ghost" size="icon"
                        type="button"
                        className="reveal inline-flex h-8 w-8"
                        aria-label={`Inspect submission ${s.id}`}
                        // onClick={() =>
                        //   // push({ title: `Inspecting ${s.id}`, description: `${s.developer} · ${s.problemTitle}`, tone: 'neutral' })
                        // }
                      >
                        <Icon name="terminalSquare" size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-10 text-center">
                      <span className="text-sm text-muted-foreground">No submissions match this filter.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
            <span className="text-xs text-muted-foreground">
              Showing latest {rows.length} of{' '}
              <span className="tabular-nums font-medium text-muted-foreground">14,382</span> submissions recorded today
            </span>
            <span className="text-xs flex items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                MicroVM Sandboxes: Healthy
              </span>
              <span className="tabular-nums">Page 1 of 2,397</span>
            </span>
          </div>
        </section>
      </div>
    </AdminLayout>
  )
}
