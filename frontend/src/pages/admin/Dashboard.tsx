import { useMemo, useState } from 'react'

import AdminLayout from './AdminLayout'
import { Icon } from '../../components/icons'
import { Donut } from '../../components/charts'
import { EmptyState, Progress, cx } from '../../components/ui'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import CustomLink from '../../components/CustomLink'
import PaginationBar from '../../components/problems/PaginationBar'
import ProblemFilters from '../../components/problems/ProblemFilters'
import type { ProblemFiltersValue } from '../../components/problems/ProblemFilters'
import { useAdminStats } from '../../hooks/admin/useAdminQueries'
import usePublicProblems from '../../hooks/problems/public/usePublicProblems'
import { formatPercent } from '../../lib/format'
import type { AdminStats } from '../../hooks/admin/types'

function StatCard({
  label,
  value,
  hint,
  icon,
  footer,
}: {
  label: string
  value: string
  hint?: string
  icon: Parameters<typeof Icon>[0]['name']
  footer: Array<{ k?: string; v: string }>
}) {
  return (
    <section className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">{label}</p>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <span className="center size-8 rounded-md bg-muted/40 text-muted-foreground">
          <Icon name={icon} size={16} />
        </span>
      </div>
      <span className="text-2xl font-semibold leading-10 tabular-nums tracking-tight text-foreground">{value}</span>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2.5">
        {footer.map((entry) => (
          <span key={entry.v} className="text-xs text-muted-foreground">
            {entry.k && <span className="text-muted-foreground">{entry.k} </span>}
            {entry.v}
          </span>
        ))}
      </div>
    </section>
  )
}

/** Difficulty composition derived from the published catalogue. */
function DifficultyMatrix() {
  const { problems, loading } = usePublicProblems({ page: 1, limit: 100 })

  const segments = useMemo(
    () =>
      (['EASY', 'MEDIUM', 'HARD'] as const).map((difficulty) => {
        const inBand = problems.filter((problem) => problem.difficulty === difficulty);
        const submissions = inBand.reduce((sum, problem) => sum + problem.totalSubmissions, 0);
        const accepted = inBand.reduce((sum, problem) => sum + problem.acceptedSubmissions, 0);
        return {
          difficulty,
          count: inBand.length,
          submissions,
          acceptance: submissions > 0 ? (accepted / submissions) * 100 : 0,
        };
      }),
    [problems],
  );

  const total = segments.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Difficulty Matrix</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Published catalogue composition</p>
        </div>
        <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium tabular-nums text-primary">
          {loading ? '—' : `${total} problems`}
        </span>
      </div>

      <div className="center py-1">
        <Donut
          size={168}
          thickness={16}
          segments={segments.map((entry) => ({ value: entry.count }))}
        >
          <span className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">{total}</span>
          <span className="text-sm font-semibold text-muted-foreground">Problems</span>
        </Donut>
      </div>

      <div className="flex flex-col gap-3">
        {segments.map((entry, index) => (
          <div key={entry.difficulty} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <span className={cx('size-2.5 rounded-sm', ['bg-chart-1', 'bg-chart-2', 'bg-chart-3'][index])} aria-hidden />
                {entry.difficulty}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                <span className="font-medium text-foreground">{entry.count}</span>
                {total > 0 && ` (${((entry.count / total) * 100).toFixed(0)}%)`}
              </span>
            </div>
            <Progress
              value={total > 0 ? (entry.count / total) * 100 : 0}
              className="h-1.5"
              barClassName={['bg-chart-1', 'bg-chart-2', 'bg-chart-3'][index]}
            />
            <div className="flex justify-between font-mono text-xs text-muted-foreground">
              <span>{entry.submissions} submits</span>
              <span>{entry.acceptance.toFixed(1)}% acc.</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** `GET /admin/stats` + `GET /problems` - the platform snapshot. */
export default function AdminDashboard() {
  const { stats, loading, error, refetch } = useAdminStats()
  const [filters, setFilters] = useState<ProblemFiltersValue>({ search: '', difficulty: 'ALL', tags: '' })

  const catalogueQuery = useMemo(
    () => ({
      search: filters.search || undefined,
      difficulty: filters.difficulty === 'ALL' ? undefined : filters.difficulty,
      tags: filters.tags || undefined,
      page: 1,
      limit: 8,
    }),
    [filters],
  )

  const { problems, pagination, loading: catalogueLoading } = usePublicProblems(catalogueQuery)

  const acceptance = useMemo(() => {
    if (!stats) return null;
    const { completed, accepted } = stats.submissions;
    return completed > 0 ? accepted / completed : null;
  }, [stats])

  if (error) {
    return (
      <AdminLayout>
        <EmptyState
          icon="alert"
          title="We could not load the dashboard"
          hint="Your account needs the user:manage permission."
          action={
            <Button type="button" variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        />
      </AdminLayout>
    )
  }

  const accounts: AdminStats['users'] = stats?.users ?? { total: 0, active: 0, pending: 0, deleted: 0 }
  const catalogue: AdminStats['problems'] = stats?.problems ?? { total: 0, published: 0 }
  const runs: AdminStats['submissions'] =
    stats?.submissions ?? { total: 0, queued: 0, processing: 0, completed: 0, failed: 0, accepted: 0 }

  return (
    <AdminLayout>
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-6 lg:px-8">
        <div className="flex flex-col gap-1">
          <p className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            ADMIN / DASHBOARD
            <span className="h-1 w-1 rounded-full bg-primary" aria-hidden />
            TELEMETRY LIVE
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">System Overview</h1>
            <div className="flex items-center gap-2.5">
              <Button variant="outline" type="button" disabled={loading} onClick={() => void refetch()}>
                <Icon name="refresh" size={14} />
                {loading ? 'Loading…' : 'Refresh'}
              </Button>
              <CustomLink variant="unstyled" to="/admin/submissions" className="btn btn-primary">
                <Icon name="terminal" size={14} />
                Submission stream
              </CustomLink>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total users"
            value={loading ? '—' : String(accounts.total)}
            hint="Accounts that are not soft-deleted"
            icon="users"
            footer={[
              { k: 'Active', v: String(accounts.active) },
              { k: 'Pending', v: String(accounts.pending) },
              { k: 'Deleted', v: String(accounts.deleted) },
            ]}
          />
          <StatCard
            label="Catalog problems"
            value={loading ? '—' : String(catalogue.total)}
            hint="Including unpublished drafts"
            icon="code"
            footer={[
              { k: 'Published', v: String(catalogue.published) },
              { k: 'Drafts', v: String(Math.max(0, catalogue.total - catalogue.published)) },
            ]}
          />
          <StatCard
            label="Submissions"
            value={loading ? '—' : String(runs.total)}
            hint="Every queued judging job"
            icon="terminal"
            footer={[
              { k: 'Accepted', v: String(runs.accepted) },
              { k: 'Acceptance', v: formatPercent(acceptance) },
            ]}
          />
          <StatCard
            label="Queue depth"
            value={loading ? '—' : String(runs.queued + runs.processing)}
            hint="Waiting or in a runner"
            icon="gauge"
            footer={[
              { k: 'Queued', v: String(runs.queued) },
              { k: 'Processing', v: String(runs.processing) },
              { k: 'Failed', v: String(runs.failed) },
            ]}
          />
        </div>

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
          <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5 pb-4">
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden />
                <h2 className="text-lg font-semibold text-foreground">Catalogue preview</h2>
              </div>
              <div className="flex items-center gap-2.5">
                <CustomLink to="/problems" className="link text-sm font-medium">
                  Public view
                </CustomLink>
              </div>
            </div>

            <ProblemFilters value={filters} onChange={setFilters} />

            {catalogueLoading ? (
              <div className="flex flex-col gap-2 p-4" aria-busy="true" aria-label="Loading problems">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-11 w-full animate-pulse rounded bg-muted" />
                ))}
              </div>
            ) : problems.length === 0 ? (
              <EmptyState icon="search" title="No problems found" hint="Adjust the catalogue filters." />
            ) : (
              <ul className="divide-y divide-border">
                {problems.map((problem) => (
                  <li key={problem.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <span className="min-w-0 grow truncate text-sm font-medium text-foreground">{problem.title}</span>
                    <Badge variant="secondary">{problem.difficulty}</Badge>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {problem.totalSubmissions} submits
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {formatPercent(problem.acceptanceRate)} acc.
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <PaginationBar
              pagination={pagination}
              page={1}
              onPageChange={() => undefined}
              noun="problems"
            />
          </section>

          <DifficultyMatrix />
        </div>
      </div>
    </AdminLayout>
  )
}