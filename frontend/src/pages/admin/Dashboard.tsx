import { useEffect, useMemo, useState } from 'react'

import AdminLayout from './AdminLayout'
import { Icon } from '../../components/icons'
import { AreaChart, Donut } from '../../components/charts'
import { Segmented, cx } from '../../components/ui'
import { ADMIN_SUBMISSIONS, DIFFICULTY_MATRIX, VOLUME_SERIES } from '../../data'
import type { SubmissionStatus } from '../../data'
import CustomButton from '../../components/ui/CustomButton'
import CustomLink from '../../components/ui/CustomLink'

function statusTone(status: SubmissionStatus) {
  if (status === 'Accepted') return 'pill-success'
  if (status === 'Time Limit Exceeded') return 'pill-warning'
  return 'pill-error'
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
    <section className="card stack gap-2.5 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="t-overline text-ink-3">{label}</p>
        <span className="flex items-center gap-2">
          {chip && (
            <span className="pill pill-warning t-code-tag h-6">
              <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden />
              {chip}
            </span>
          )}
          <span className="center h-8 w-8 rounded-md bg-wash text-ink-2">
            <Icon name={icon} size={16} />
          </span>
        </span>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="tnum font-bold text-ink" style={{ fontSize: 34, lineHeight: '40px', letterSpacing: '-0.02em' }}>
          {value}
        </span>
        {delta && (
          <span
            className={cx('t-caption tnum flex items-center gap-1', deltaTone === 'success' ? 'text-success' : 'text-ink-3')}
          >
            <Icon name="arrowUpRight" size={12} />
            {delta}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hair pt-2.5">
        {footer.map((f) => (
          <span key={f.v} className="t-caption text-ink-2">
            {f.k && <span className="text-ink-3">{f.k} </span>}
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
    const wave = Math.sin(i / 3.1) * 900 + Math.cos(i / 1.7) * 500
    // earlier.push({ label: `Feb ${String((i % 27) + 1).padStart(2, '0')}`, value: Math.round(5200 + i * 95 + wave) })
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
      <div className="mx-auto w-full max-w-[1440px] stack gap-5 px-4 py-6 lg:px-8">
        {/* Breadcrumb + title */}
        <div className="stack gap-1">
          <p className="t-code-tag flex items-center gap-2 text-ink-3">
            ADMIN / DASHBOARD
            <span className="h-1 w-1 rounded-full bg-accent" aria-hidden />
            TELEMETRY LIVE
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="t-page-title text-ink">System Overview &amp; Telemetry</h1>
              <span className="tag tag-gray t-code-tag">v2.14.0-edge</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CustomButton variant="unstyled"
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setSyncSeconds(0)
                  // push({ title: 'Telemetry refreshed', description: 'All panels pulled fresh cluster metrics.', tone: 'success' })
                }}
              >
                <Icon name="refresh" size={14} />
                Refresh Data
                <span className="t-code-tag text-ink-3">{syncSeconds}s ago</span>
              </CustomButton>
              <CustomButton variant="unstyled"
                type="button"
                className="btn btn-primary"
                // onClick={() => push({ title: 'Report exported', description: 'codeforge-telemetry.csv · 24 KB', tone: 'success' })}
              >
                <Icon name="download" size={14} />
                Export Report
                <span className="tag" style={{ background: 'rgba(255,255,255,0.18)', color: 'inherit' }}>
                  CSV
                </span>
              </CustomButton>
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
          <section className="card stack gap-4 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="t-h3 flex items-center gap-2 text-ink">
                  <Icon name="activity" size={17} className="text-accent" />
                  Submissions Volume
                </h2>
                <p className="t-caption mt-0.5 text-ink-2">
                  Execution throughput across all sandboxed test runners
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="tag tag-gray t-code-tag">
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

            <div className="rounded-md border border-hair bg-code p-3">
              <AreaChart data={series} yMax={25000} yStep={5000} peakLabel="22,410 submissions" />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-4">
                {[
                  { c: 'var(--accent)', l: 'Python (41.2%)' },
                  { c: 'var(--success)', l: 'C++ (28.4%)' },
                  { c: 'var(--warning)', l: 'Rust/TS (30.4%)' },
                ].map((x) => (
                  <span key={x.l} className="t-caption flex items-center gap-2 text-ink-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: x.c }} aria-hidden />
                    {x.l}
                  </span>
                ))}
              </div>
              <span className="t-code-tag text-ink-3">Avg Execution: 28.4ms</span>
            </div>
          </section>

          <section className="card stack gap-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="t-h3 text-ink">Difficulty Matrix</h2>
                <p className="t-caption mt-0.5 text-ink-2">Library composition</p>
              </div>
              <span className="pill pill-accent tnum">524 Active</span>
            </div>

            <div className="center py-1">
              <Donut
                size={168}
                thickness={16}
                segments={DIFFICULTY_MATRIX.map((d) => ({ value: d.percent, color: d.color }))}
              >
                <span className="t-page-title tnum text-ink">524</span>
                <span className="t-overline text-ink-3">Problems</span>
              </Donut>
            </div>

            <div className="stack gap-3">
              {DIFFICULTY_MATRIX.map((d) => (
                <div key={d.label} className="stack gap-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="t-ui-med flex items-center gap-2 text-ink">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} aria-hidden />
                      {d.label}
                    </span>
                    <span className="t-caption tnum text-ink-2">
                      <span className="font-medium text-ink">{d.count}</span> ({d.percent}%)
                    </span>
                  </div>
                  <div className="progress h-1.5">
                    <i style={{ width: `${d.percent}%`, background: d.color }} />
                  </div>
                  <div className="flex justify-between t-code-tag text-ink-3">
                    <span>{d.submits} submits</span>
                    <span>{d.accuracy} Acc.</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="t-caption border-t border-hair pt-3 text-ink-3">
              Pool Balance: Optimal for L4/L6 Interview Prep
            </p>
          </section>
        </div>

        {/* Recent submissions */}
        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hair p-5 pb-4">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-accent" aria-hidden />
              <h2 className="t-h3 text-ink">Recent Submissions</h2>
              <span className="pill pill-success h-6">
                <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
                Live Stream
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Icon
                  name="filter"
                  size={13}
                  className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-ink-3"
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
              <CustomLink to="/admin/submissions" className="link t-ui-med inline-flex items-center gap-1.5 px-1">
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
                    <td className="t-code-tag pl-5 text-ink-3">{s.id}</td>
                    <td>
                      <span className="flex items-center gap-2.5">
                        <span className="center h-6 w-6 flex-none rounded-full bg-accent-soft text-[10px] font-semibold text-accent">
                          {s.initials}
                        </span>
                        <span className="t-ui-med text-ink">{s.developer}</span>
                      </span>
                    </td>
                    <td>
                      <CustomLink to={`/problems/${s.problemNum === 1 ? 'two-sum' : 'two-sum'}/submissions`} className="flex items-center gap-2 hover:text-accent">
                        <span className="t-code-tag tnum text-ink-3">{s.problemNum}.</span>
                        <span className="t-ui-med text-ink">{s.problemTitle}</span>
                      </CustomLink>
                    </td>
                    <td className="hidden lg:table-cell">
                      <span className="tag tag-gray t-code-tag">{s.language}</span>
                    </td>
                    <td>
                      <span className={cx('pill', statusTone(s.status))}>{s.status}</span>
                    </td>
                    <td className="t-ui tnum hidden text-ink-2 md:table-cell">{s.runtime}</td>
                    <td className="t-ui tnum hidden text-ink-2 xl:table-cell">{s.memory}</td>
                    <td className="t-caption hidden text-ink-3 md:table-cell">{s.timestamp}</td>
                    <td className="pr-5 text-right">
                      <CustomButton variant="unstyled"
                        type="button"
                        className="icon-btn reveal inline-flex"
                        aria-label={`Inspect submission ${s.id}`}
                        // onClick={() =>
                        //   // push({ title: `Inspecting ${s.id}`, description: `${s.developer} · ${s.problemTitle}`, tone: 'neutral' })
                        // }
                      >
                        <Icon name="terminalSquare" size={16} />
                      </CustomButton>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-10 text-center">
                      <span className="t-ui text-ink-3">No submissions match this filter.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hair px-5 py-3">
            <span className="t-caption text-ink-3">
              Showing latest {rows.length} of{' '}
              <span className="tnum font-medium text-ink-2">14,382</span> submissions recorded today
            </span>
            <span className="t-caption flex items-center gap-4 text-ink-3">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
                MicroVM Sandboxes: Healthy
              </span>
              <span className="tnum">Page 1 of 2,397</span>
            </span>
          </div>
        </section>
      </div>
    </AdminLayout>
  )
}
