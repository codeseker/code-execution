import { useState } from 'react'
import AdminLayout from './AdminLayout'
import { Icon } from '../../components/icons'
import { EmptyState, Progress, cx } from '../../components/ui'
import { useTheme } from '../../theme'
import type { ThemeMode } from '../../theme'
import CustomButton from '../../components/ui/CustomButton'

/* ================================================================== */
/* Admin · System Health                                               */
/* ================================================================== */

const SERVICES = [
  { name: 'API Gateway', region: 'us-east-1', uptime: 99.99, latency: '34ms', status: 'Operational' },
  { name: 'Judge Workers', region: 'us-east-1', uptime: 99.95, latency: '112ms', status: 'Operational' },
  { name: 'Sandbox Pool (gVisor)', region: 'multi-region', uptime: 99.98, latency: '48ms', status: 'Operational' },
  { name: 'Postgres Primary', region: 'us-east-1', uptime: 99.99, latency: '6ms', status: 'Operational' },
  { name: 'Redis Cache', region: 'us-east-1', uptime: 99.97, latency: '2ms', status: 'Degraded' },
  { name: 'Artifact Storage (S3)', region: 'global', uptime: 100, latency: '61ms', status: 'Operational' },
]

const REGIONS = [
  { name: 'US East (N. Virginia)', runners: '48 / 50', load: 96 },
  { name: 'EU Central (Frankfurt)', runners: '32 / 34', load: 88 },
  { name: 'AP South (Singapore)', runners: '18 / 16', load: 74 },
]

export function AdminHealth() {

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-[1440px] stack gap-5 px-4 py-6 lg:px-8">
        <div className="stack gap-1">
          <p className="t-code-tag text-ink-3">ADMIN / SYSTEM HEALTH</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="t-page-title text-ink">System Health</h1>
              <span className="pill pill-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
                All systems operational
              </span>
            </div>
            <CustomButton variant="unstyled"
              type="button"
              className="btn btn-secondary"
              // onClick={() => push({ title: 'Health checks re-run', description: '6/6 probes answered.', tone: 'success' })}
            >
              <Icon name="refresh" size={14} />
              Run probes
            </CustomButton>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Runner pool', value: '98 / 100', meta: '2 draining', pct: 98 },
            { label: 'P95 latency', value: '112 ms', meta: 'budget 250 ms', pct: 45 },
            { label: 'Queue depth', value: '0 jobs', meta: 'drain rate 420/m', pct: 4 },
            { label: 'Error rate', value: '0.02%', meta: 'SLO 0.10%', pct: 20 },
          ].map((k) => (
            <section key={k.label} className="card stack gap-2.5 p-5">
              <p className="t-overline text-ink-3">{k.label}</p>
              <p className="tnum font-bold text-ink" style={{ fontSize: 30, lineHeight: '36px', letterSpacing: '-0.02em' }}>
                {k.value}
              </p>
              <div className="stack gap-1.5">
                <Progress value={k.pct} className={k.pct > 92 ? 'h-1.5 [&>i]:bg-warning' : 'h-1.5'} />
                <span className="t-caption text-ink-3">{k.meta}</span>
              </div>
            </section>
          ))}
        </div>

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <section className="card overflow-hidden">
            <div className="border-b border-hair px-5 py-4">
              <h2 className="t-h3 text-ink">Services</h2>
              <p className="t-caption text-ink-2">Rolling 30-day uptime per dependency</p>
            </div>
            <div className="overflow-x-auto">
              <table className="ntable">
                <thead>
                  <tr>
                    <th className="pl-5">Service</th>
                    <th className="hidden md:table-cell">Region</th>
                    <th>Uptime</th>
                    <th className="hidden md:table-cell">Latency</th>
                    <th className="pr-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {SERVICES.map((s) => (
                    <tr key={s.name}>
                      <td className="pl-5">
                        <span className="t-ui-med flex items-center gap-2.5 text-ink">
                          <Icon name="database" size={15} className="text-ink-3" />
                          {s.name}
                        </span>
                      </td>
                      <td className="t-code-tag hidden text-ink-3 md:table-cell">{s.region}</td>
                      <td className="tnum t-ui text-ink-2">{s.uptime.toFixed(2)}%</td>
                      <td className="t-ui tnum hidden text-ink-2 md:table-cell">{s.latency}</td>
                      <td className="pr-5 text-right">
                        <span className={cx('pill', s.status === 'Operational' ? 'pill-success' : 'pill-warning')}>
                          <Icon name={s.status === 'Operational' ? 'checkCircle' : 'alert'} size={12} />
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="stack gap-4">
            <section className="card stack gap-4 p-5">
              <div>
                <h2 className="t-h3 text-ink">Region load</h2>
                <p className="t-caption text-ink-2">Runner utilization right now</p>
              </div>
              {REGIONS.map((r) => (
                <div key={r.name} className="stack gap-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="t-ui truncate text-ink">{r.name}</span>
                    <span className="t-code-tag tnum text-ink-3">{r.runners}</span>
                  </div>
                  <Progress
                    value={r.load}
                    className="h-1.5"
                    barClassName={r.load > 94 ? '[&]:bg-warning' : undefined}
                  />
                </div>
              ))}
            </section>

            <section className="card">
              <EmptyState
                icon="shield"
                title="No incidents in 30 days"
                hint="Post-mortems and uptime history will appear here when something breaks."
              />
            </section>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

/* ================================================================== */
/* Admin · Settings                                                    */
/* ================================================================== */

export function AdminSettings() {

  const { mode, setMode } = useTheme()
  const [siteName, setSiteName] = useState('CodeForge')
  const [supportEmail, setSupportEmail] = useState('support@codeforge.io')
  const [defaultLang, setDefaultLang] = useState('Python3')
  const [timeout, setTimeoutSec] = useState(10)
  const [flags, setFlags] = useState({ registrations: true, digests: true, maintenance: false })

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-[880px] stack gap-5 px-4 py-6 lg:px-8">
        <div className="stack gap-1">
          <p className="t-code-tag text-ink-3">ADMIN / SETTINGS</p>
          <h1 className="t-page-title text-ink">Settings</h1>
        </div>

        {/* General */}
        <section className="card">
          <div className="border-b border-hair px-5 py-4">
            <h2 className="t-h3 text-ink">General</h2>
            <p className="t-caption text-ink-2">Workspace identity and defaults for new candidates</p>
          </div>
          <div className="stack gap-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="s-name">Site name</label>
                <input id="s-name" className="input h-9" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
              </div>
              <div>
                <label className="field-label" htmlFor="s-email">Support email</label>
                <input
                  id="s-email"
                  className="input h-9"
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="field-label" htmlFor="s-lang">Default editor language</label>
              <select
                id="s-lang"
                className="input select h-9 w-full sm:w-[220px]"
                value={defaultLang}
                onChange={(e) => setDefaultLang(e.target.value)}
              >
                {['Python3', 'TypeScript', 'Java', 'C++', 'Rust', 'Go'].map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="card">
          <div className="border-b border-hair px-5 py-4">
            <h2 className="t-h3 text-ink">Appearance</h2>
            <p className="t-caption text-ink-2">Applies to every admin session on this device</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <p className="t-ui-med text-ink">Theme</p>
              <p className="t-caption text-ink-2">Light, dark, or follow the operating system.</p>
            </div>
            <div className="seg" role="radiogroup" aria-label="Theme">
              {(['light', 'dark', 'system'] as ThemeMode[]).map((m) => (
                <CustomButton variant="unstyled"
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={mode === m}
                  className={cx('seg-btn capitalize', mode === m && 'is-active')}
                  onClick={() => setMode(m)}
                >
                  <span className="flex items-center gap-1.5">
                    <Icon name={m === 'light' ? 'sun' : m === 'dark' ? 'moon' : 'grid'} size={13} />
                    {m}
                  </span>
                </CustomButton>
              ))}
            </div>
          </div>
        </section>

        {/* Execution */}
        <section className="card">
          <div className="border-b border-hair px-5 py-4">
            <h2 className="t-h3 text-ink">Execution policy</h2>
            <p className="t-caption text-ink-2">Sandbox limits applied to every submission</p>
          </div>
          <div className="stack gap-5 p-5">
            <div>
              <div className="flex items-baseline justify-between">
                <label className="field-label" htmlFor="s-timeout">Run timeout</label>
                <span className="t-code-tag -mt-4 mb-1.5 tnum text-ink-3">{timeout}s</span>
              </div>
              <input
                id="s-timeout"
                type="range"
                min={2}
                max={30}
                value={timeout}
                className="w-full accent-[var(--accent)]"
                onChange={(e) => setTimeoutSec(Number(e.target.value))}
              />
              <div className="flex justify-between t-caption text-ink-3">
                <span>2s</span>
                <span>30s</span>
              </div>
            </div>

            <div className="stack gap-3 border-t border-hair pt-4">
              {(
                [
                  { key: 'registrations', label: 'Allow public registrations', hint: 'Visitors can self-serve sign up.' },
                  { key: 'digests', label: 'Weekly progress digests', hint: 'Email every active candidate on Monday.' },
                  { key: 'maintenance', label: 'Maintenance mode', hint: 'Blocks submissions cluster-wide.' },
                ] as const
              ).map((f) => (
                <label key={f.key} className="flex cursor-pointer items-center justify-between gap-4">
                  <span className="stack">
                    <span className={cx('t-ui-med', f.key === 'maintenance' && flags[f.key] ? 'text-error' : 'text-ink')}>
                      {f.label}
                    </span>
                    <span className="t-caption text-ink-2">{f.hint}</span>
                  </span>
                  <input
                    type="checkbox"
                    className="switch"
                    checked={flags[f.key]}
                    onChange={(e) => setFlags((s) => ({ ...s, [f.key]: e.target.checked }))}
                  />
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* Danger zone */}
        <section className="card border-[var(--error)]">
          <div className="border-b border-hair px-5 py-4">
            <h2 className="t-h3 flex items-center gap-2 text-error">
              <Icon name="alert" size={17} />
              Danger zone
            </h2>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <p className="t-ui-med text-ink">Reset demo data</p>
              <p className="t-caption text-ink-2">Restores seeds for problems, users and submission history.</p>
            </div>
            <CustomButton variant="unstyled"
              type="button"
              className="btn btn-destructive-solid"
              // onClick={() => push({ title: 'Demo data reset', description: 'Seeds restored to factory state.', tone: 'error' })}
            >
              Reset data
            </CustomButton>
          </div>
        </section>

        {/* Save bar */}
        <div className="flex justify-end gap-2.5 pb-6">
          <CustomButton variant="unstyled" type="button" className="btn btn-secondary"
            // onClick={() => push({ title: 'Changes discarded', tone: 'neutral' })}
            >
            Discard
          </CustomButton>
          <CustomButton variant="unstyled"
            type="button"
            className="btn btn-primary"
          // onClick={() =>
          //   push({
          //     title: 'Settings saved',
          //     description: `${siteName} · ${defaultLang} · ${timeout}s timeout`,
          //     tone: 'success',
          //   })
          // }
          >
            Save changes
          </CustomButton>
        </div>
      </div>
    </AdminLayout>
  )
}
