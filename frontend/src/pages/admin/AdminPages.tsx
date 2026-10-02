import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import AdminLayout from './AdminLayout'
import { Icon } from '../../components/icons'
import { EmptyState } from '../../components/ui'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import CustomLink from '../../components/CustomLink'
import PaginationBar from '../../components/problems/PaginationBar'
import { CatalogueHealth, ProblemTable } from '../../components/admin/ProblemTable'
import ProblemEditorDialog from '../../components/admin/ProblemEditorDialog'
import ConfirmDeleteDialog from '../../components/admin/ConfirmDeleteDialog'
import { SubmissionStreamTable, UserTable } from '../../components/admin/AdminTables'
import SubmissionFilters from '../../components/submissions/SubmissionFilters'
import type { SubmissionFiltersValue } from '../../components/submissions/SubmissionFilters'
import useAdminProblems from '../../hooks/problems/admin/useAdminProblems'
import { useDeleteProblem } from '../../hooks/problems/admin/useTestCaseMutations'
import { useAdminStats, useAdminUsers } from '../../hooks/admin/useAdminQueries'
import { useMySubmissions } from '../../hooks/submissions/useSubmissions'
import { DIFFICULTIES, type Difficulty, type Language, type SubmissionStatus, type UserStatus } from '../../types/domain'
import { difficultyLabel, userStatusLabel } from '../../lib/format'
import type { AdminProblem } from '../../hooks/problems/types'

/** `UserStatus` filter sent to `GET /admin/users`. */
type UserStatusFilter = UserStatus | 'ALL';

function PageHead({ crumbs, title, meta, actions }: { crumbs: string; title: string; meta?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="font-mono text-xs text-muted-foreground">{crumbs}</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {meta && (
            <span className="rounded-md border border-border bg-secondary px-2 py-0.5 font-mono text-xs text-secondary-foreground">
              {meta}
            </span>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
      </div>
    </div>
  )
}

const SEARCH_DEBOUNCE_MS = 300

/* ================================================================== */
/* Admin · Problems                                                    */
/* ================================================================== */

/** `/admin/problems` - the full catalogue, including unpublished drafts. */
export function AdminProblems() {
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty | 'ALL'>('ALL')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<AdminProblem | null>(null)
  const [pendingDelete, setPendingDelete] = useState<AdminProblem | null>(null)

  const query = useMemo(
    () => ({
      search: search || undefined,
      difficulty: difficulty === 'ALL' ? undefined : difficulty,
      page,
      limit: 10,
    }),
    [search, difficulty, page],
  )

  const { problems, pagination, loading, error, refetch } = useAdminProblems(query)
  const { deleteProblem, loading: deleting } = useDeleteProblem()

  const applySearch = useCallback((value: string) => {
    setSearchDraft(value)
    window.setTimeout(() => {
      setSearch(value)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
  }, [])

  return (
    <AdminLayout>
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-6 lg:px-8">
        <PageHead
          crumbs="ADMIN / PROBLEMS"
          title="Problem Catalog"
          meta={`${pagination?.totalElements ?? 0} problems`}
          actions={
            <CustomLink variant="unstyled" to="/admin/problems/new" className="btn btn-primary">
              <Icon name="plus" size={14} />
              New Problem
            </CustomLink>
          }
        />

        <div className="flex flex-wrap items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5">
          <div className="relative min-w-[220px] grow">
            <Icon name="search" size={14} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8 pl-8"
              placeholder="Search title, description or slug…"
              aria-label="Search catalog"
              value={searchDraft}
              onChange={(event) => applySearch(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-1" role="group" aria-label="Filter by difficulty">
            <Button
              variant={difficulty === 'ALL' ? 'default' : 'ghost'}
              size="sm"
              type="button"
              aria-pressed={difficulty === 'ALL'}
              onClick={() => {
                setDifficulty('ALL')
                setPage(1)
              }}
            >
              All
            </Button>
            {DIFFICULTIES.map((option) => (
              <Button
                key={option}
                variant={difficulty === option ? 'default' : 'ghost'}
                size="sm"
                type="button"
                aria-pressed={difficulty === option}
                onClick={() => {
                  setDifficulty(difficulty === option ? 'ALL' : option)
                  setPage(1)
                }}
              >
                {difficultyLabel(option)}
              </Button>
            ))}
          </div>
        </div>

        <CatalogueHealth problems={problems} />

        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {error ? (
            <EmptyState
              icon="alert"
              title="We could not load the catalogue"
              hint="Your account needs the problem:read permission."
              action={
                <Button type="button" variant="outline" onClick={() => void refetch()}>
                  Retry
                </Button>
              }
            />
          ) : (
            <ProblemTable
              problems={problems}
              loading={loading}
              onOpen={setEditing}
              onArchive={setPendingDelete}
            />
          )}
          <PaginationBar pagination={pagination} page={page} onPageChange={setPage} noun="problems" />
        </section>
      </div>

      {editing && <ProblemEditorDialog problem={editing} onClose={() => setEditing(null)} />}

      {pendingDelete && (
        <ConfirmDeleteDialog
          title={`Delete “${pendingDelete.title}”?`}
          description="The problem is soft-deleted: it leaves the public catalogue while its test cases and files are kept for history."
          loading={deleting}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            const target = pendingDelete
            setPendingDelete(null)
            void deleteProblem(target._id)
          }}
        />
      )}
    </AdminLayout>
  )
}

/* ================================================================== */
/* Admin · Users                                                       */
/* ================================================================== */

/** `GET /admin/users` - requires the `user:manage` permission. */
export function AdminUsers() {
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<UserStatusFilter>('ALL')
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [page, setPage] = useState(1)

  const query = useMemo(
    () => ({
      search: search || undefined,
      status: status === 'ALL' ? undefined : status,
      includeDeleted,
      page,
      limit: 10,
    }),
    [search, status, includeDeleted, page],
  )

  const { users, pagination, loading, error, refetch } = useAdminUsers(query)

  const applySearch = useCallback((value: string) => {
    setSearchDraft(value)
    window.setTimeout(() => {
      setSearch(value)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
  }, [])

  return (
    <AdminLayout>
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-6 lg:px-8">
        <PageHead crumbs="ADMIN / USERS" title="User Management" meta={`${pagination?.totalElements ?? 0} accounts`} />

        <div className="flex flex-wrap items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5">
          <div className="relative min-w-[220px] grow">
            <Icon name="search" size={14} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8 pl-8"
              placeholder="Search username or email…"
              aria-label="Search users"
              value={searchDraft}
              onChange={(event) => applySearch(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-1" role="group" aria-label="Filter by status">
            {(['ALL', 'ACTIVE', 'PENDING'] as const).map((option) => (
              <Button
                key={option}
                variant={status === option ? 'default' : 'ghost'}
                size="sm"
                type="button"
                aria-pressed={status === option}
                onClick={() => {
                  setStatus(option)
                  setPage(1)
                }}
              >
                {option === 'ALL' ? 'All statuses' : userStatusLabel(option)}
              </Button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(event) => {
                setIncludeDeleted(event.target.checked)
                setPage(1)
              }}
            />
            Include soft-deleted
          </label>
        </div>

        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {error ? (
            <EmptyState
              icon="alert"
              title="We could not load the user directory"
              hint="Your account needs the user:manage permission."
              action={
                <Button type="button" variant="outline" onClick={() => void refetch()}>
                  Retry
                </Button>
              }
            />
          ) : (
            <UserTable users={users} loading={loading} />
          )}
          <PaginationBar pagination={pagination} page={page} onPageChange={setPage} noun="accounts" />
        </section>
      </div>
    </AdminLayout>
  )
}

/* ================================================================== */
/* Admin · Submissions                                                 */
/* ================================================================== */

/**
 * Global judge throughput. `GET /admin/submissions` does not exist, so this
 * view is scoped to the caller's own runs plus the platform counters from
 * `GET /admin/stats`.
 */
export function AdminSubmissions() {
  const [filters, setFilters] = useState<SubmissionFiltersValue>({ language: 'ALL', status: 'ALL' })
  const [page, setPage] = useState(1)

  const query = useMemo(
    () => ({
      language: filters.language === 'ALL' ? undefined : (filters.language as Language),
      status: filters.status === 'ALL' ? undefined : (filters.status as SubmissionStatus),
      page,
      limit: 10,
    }),
    [filters, page],
  )

  const { submissions, pagination, loading } = useMySubmissions(query)
  const { stats } = useAdminStats()

  return (
    <AdminLayout>
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-6 lg:px-8">
        <PageHead
          crumbs="ADMIN / SUBMISSIONS"
          title="Judge Throughput"
          meta={`${stats?.submissions.total ?? 0} total runs`}
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: 'Queued', value: stats?.submissions.queued },
            { label: 'Processing', value: stats?.submissions.processing },
            { label: 'Completed', value: stats?.submissions.completed },
            { label: 'Failed', value: stats?.submissions.failed },
            { label: 'Accepted', value: stats?.submissions.accepted },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <p className="text-xs font-semibold text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{card.value ?? '—'}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5">
          <span className="grow text-xs text-muted-foreground">
            Your own runs — the backend exposes a per-user history endpoint, not a platform-wide feed.
          </span>
          <SubmissionFilters
            value={filters}
            onChange={(next) => {
              setFilters(next)
              setPage(1)
            }}
          />
        </div>

        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <SubmissionStreamTable submissions={submissions} loading={loading} />
          <PaginationBar pagination={pagination} page={page} onPageChange={setPage} noun="runs" />
        </section>
      </div>
    </AdminLayout>
  )
}