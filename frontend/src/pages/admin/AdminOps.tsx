import { useState } from 'react'
import AdminLayout from './AdminLayout'
import { Icon } from '../../components/icons'
import { EmptyState, Progress, cx } from '../../components/ui'
import { useTheme } from '../../theme'
import type { ThemeMode } from '../../theme'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Switch } from '../../components/ui/switch'

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
      <div className="mx-auto w-full max-w-[1440px] flex flex-col gap-5 px-4 py-6 lg:px-8">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-xs text-muted-foreground">ADMIN / SYSTEM HEALTH</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">System Health</h1>
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium bg-primary/10 text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                All systems operational
              </span>
            </div>
            <Button variant="outline"
              type="button"
              // onClick={() => push({ title: 'Health checks re-run', description: '6/6 probes answered.', tone: 'success' })}
            >
              <Icon name="refresh" size={14} />
              Run probes
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Runner pool', value: '98 / 100', meta: '2 draining', pct: 98 },
            { label: 'P95 latency', value: '112 ms', meta: 'budget 250 ms', pct: 45 },
            { label: 'Queue depth', value: '0 jobs', meta: 'drain rate 420/m', pct: 4 },
            { label: 'Error rate', value: '0.02%', meta: 'SLO 0.10%', pct: 20 },
          ].map((k) => (
            <section key={k.label} className="rounded-xl border border-border bg-card text-card-foreground shadow-sm flex flex-col gap-2.5 p-5">
              <p className="text-sm font-semibold text-muted-foreground">{k.label}</p>
              <p className="text-2xl font-semibold leading-9 tracking-tight tabular-nums text-foreground">
                {k.value}
              </p>
              <div className="flex flex-col gap-1.5">
                <Progress value={k.pct} className={k.pct > 92 ? 'h-1.5 [&>i]:bg-muted' : 'h-1.5'} />
                <span className="text-xs text-muted-foreground">{k.meta}</span>
              </div>
            </section>
          ))}
        </div>

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <section className="rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-lg font-semibold text-foreground">Services</h2>
              <p className="text-xs text-muted-foreground">Rolling 30-day uptime per dependency</p>
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
                        <span className="text-sm font-medium flex items-center gap-2.5 text-foreground">
                          <Icon name="database" size={15} className="text-muted-foreground" />
                          {s.name}
                        </span>
                      </td>
                      <td className="font-mono text-xs hidden text-muted-foreground md:table-cell">{s.region}</td>
                      <td className="tabular-nums text-sm text-muted-foreground">{s.uptime.toFixed(2)}%</td>
                      <td className="text-sm tabular-nums hidden text-muted-foreground md:table-cell">{s.latency}</td>
                      <td className="pr-5 text-right">
                        <span className={cx('inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium', s.status === 'Operational' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
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

          <div className="flex flex-col gap-4">
            <section className="rounded-xl border border-border bg-card text-card-foreground shadow-sm flex flex-col gap-4 p-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Region load</h2>
                <p className="text-xs text-muted-foreground">Runner utilization right now</p>
              </div>
              {REGIONS.map((r) => (
                <div key={r.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm truncate text-foreground">{r.name}</span>
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">{r.runners}</span>
                  </div>
                  <Progress
                    value={r.load}
                    className="h-1.5"
                    barClassName={r.load > 94 ? '[&]:bg-muted' : undefined}
                  />
                </div>
              ))}
            </section>

            <section className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
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
      <div className="mx-auto w-full max-w-[880px] flex flex-col gap-5 px-4 py-6 lg:px-8">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-xs text-muted-foreground">ADMIN / SETTINGS</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        </div>

        {/* General */}
        <section className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-lg font-semibold text-foreground">General</h2>
            <p className="text-xs text-muted-foreground">Workspace identity and defaults for new candidates</p>
          </div>
          <div className="flex flex-col gap-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="s-name">Site name</label>
                <Input id="s-name" className="h-9" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
              </div>
              <div>
                <label className="field-label" htmlFor="s-email">Support email</label>
                <Input
                  id="s-email"
                  className="h-9"
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="field-label" htmlFor="s-lang">Default editor language</label>
              <Select value={defaultLang} onValueChange={(value) => {
                if (value !== null) setDefaultLang(value)
              }}>
                <SelectTrigger id="s-lang" className="h-9 w-full sm:w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['Python3', 'TypeScript', 'Java', 'C++', 'Rust', 'Go'].map((language) => (
                    <SelectItem key={language} value={language}>{language}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
            <p className="text-xs text-muted-foreground">Applies to every admin session on this device</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <p className="text-sm font-medium text-foreground">Theme</p>
              <p className="text-xs text-muted-foreground">Light, dark, or follow the operating system.</p>
            </div>
            <div className="seg" role="radiogroup" aria-label="Theme">
              {(['light', 'dark', 'system'] as ThemeMode[]).map((m) => (
                <Button
                  key={m}
                  type="button"
                  variant={mode === m ? 'default' : 'outline'}
                  size="sm"
                  role="radio"
                  aria-checked={mode === m}
                  onClick={() => setMode(m)}
                >
                  <span className="flex items-center gap-1.5">
                    <Icon name={m === 'light' ? 'sun' : m === 'dark' ? 'moon' : 'grid'} size={13} />
                    {m}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Execution */}
        <section className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-lg font-semibold text-foreground">Execution policy</h2>
            <p className="text-xs text-muted-foreground">Sandbox limits applied to every submission</p>
          </div>
          <div className="flex flex-col gap-5 p-5">
            <div>
              <div className="flex items-baseline justify-between">
                <label className="field-label" htmlFor="s-timeout">Run timeout</label>
                <span className="font-mono text-xs -mt-4 mb-1.5 tabular-nums text-muted-foreground">{timeout}s</span>
              </div>
              <input
                id="s-timeout"
                type="range"
                min={2}
                max={30}
                value={timeout}
                className="w-full accent-primary"
                onChange={(e) => setTimeoutSec(Number(e.target.value))}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>2s</span>
                <span>30s</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-border pt-4">
              {(
                [
                  { key: 'registrations', label: 'Allow public registrations', hint: 'Visitors can self-serve sign up.' },
                  { key: 'digests', label: 'Weekly progress digests', hint: 'Email every active candidate on Monday.' },
                  { key: 'maintenance', label: 'Maintenance mode', hint: 'Blocks submissions cluster-wide.' },
                ] as const
              ).map((f) => (
                <label key={f.key} className="flex cursor-pointer items-center justify-between gap-4">
                  <span className="flex flex-col">
                    <span className={cx('text-sm font-medium', f.key === 'maintenance' && flags[f.key] ? 'text-destructive' : 'text-foreground')}>
                      {f.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{f.hint}</span>
                  </span>
                  <Switch
                    checked={flags[f.key]}
                    aria-label={f.label}
                    onCheckedChange={(checked) => setFlags((s) => ({ ...s, [f.key]: checked }))}
                  />
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* Danger zone */}
        <section className="rounded-xl border border-destructive bg-card text-card-foreground shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-destructive">
              <Icon name="alert" size={17} />
              Danger zone
            </h2>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <p className="text-sm font-medium text-foreground">Reset demo data</p>
              <p className="text-xs text-muted-foreground">Restores seeds for problems, users and submission history.</p>
            </div>
            <Button variant="destructive"
              type="button"
              // onClick={() => push({ title: 'Demo data reset', description: 'Seeds restored to factory state.', tone: 'error' })}
            >
              Reset data
            </Button>
          </div>
        </section>

        {/* Save bar */}
        <div className="flex justify-end gap-2.5 pb-6">
          <Button variant="outline" type="button"
            // onClick={() => push({ title: 'Changes discarded', tone: 'neutral' })}
            >
            Discard
          </Button>
          <Button
            type="button"
          // onClick={() =>
          //   push({
          //     title: 'Settings saved',
          //     description: `${siteName} · ${defaultLang} · ${timeout}s timeout`,
          //     tone: 'success',
          //   })
          // }
          >
            Save changes
          </Button>
        </div>
      </div>
    </AdminLayout>
  )
}
