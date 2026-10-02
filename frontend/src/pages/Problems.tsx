import { useCallback, useMemo, useState } from 'react'
import { Card } from '../components/ui/card'
import ProblemFilters from '../components/problems/ProblemFilters'
import type { ProblemFiltersValue } from '../components/problems/ProblemFilters'
import ProblemRow from '../components/problems/ProblemRow'
import PaginationBar from '../components/problems/PaginationBar'
import { ProblemListEmpty, ProblemListError, ProblemListSkeleton } from '../components/problems/ProblemListStates'
import usePublicProblems from '../hooks/problems/public/usePublicProblems'
import useToggleBookmark from '../hooks/lists/useToggleBookmark'
import useMyStats from '../hooks/stats/useMyStats'
import { useAuthStore } from '../stores/auth'
import type { Difficulty } from '../types/domain'
import type { ProblemStatus } from '../data'

const PAGE_SIZE = 20

const EMPTY_FILTERS: ProblemFiltersValue = { search: '', difficulty: 'ALL', tags: '' }

/**
 * Public catalogue (`GET /problems`). The page only orchestrates: filter and
 * page state, the three queries behind it, and the layout. Each row and the
 * filter bar own their own presentation concerns.
 */
export default function Problems() {
  const isAuthenticated = useAuthStore((state) => state.auth.isAuthenticated)
  const [filters, setFilters] = useState<ProblemFiltersValue>(EMPTY_FILTERS)
  const [page, setPage] = useState(1)

  const query = useMemo(
    () => ({
      search: filters.search || undefined,
      difficulty: filters.difficulty === 'ALL' ? undefined : (filters.difficulty as Difficulty),
      tags: filters.tags || undefined,
      page,
      limit: PAGE_SIZE,
    }),
    [filters, page],
  )

  const { problems, pagination, loading, error, refetch } = usePublicProblems(query)

  // Solved ids come from `/users/me/stats`, so they are only requested for a
  // signed-in caller; anonymous visitors see no status glyph.
  const { stats } = useMyStats({ enabled: isAuthenticated })
  const { isBookmarked, toggle, loading: bookmarkPending } = useToggleBookmark()

  const solvedIds = useMemo(() => new Set(stats?.solvedProblemIds ?? []), [stats])

  const statusOf = useCallback(
    (problemId: string): ProblemStatus => {
      if (!isAuthenticated) return 'todo'
      if (solvedIds.has(problemId)) return 'solved'
      return 'todo'
    },
    [isAuthenticated, solvedIds],
  )

  const tagSuggestions = useMemo(
    () => Array.from(new Set(problems.flatMap((problem) => problem.tags))),
    [problems],
  )

  const applyFilters = useCallback((next: ProblemFiltersValue) => {
    setFilters(next)
    setPage(1)
  }, [])

  const hasFilters = Boolean(filters.search || filters.tags || filters.difficulty !== 'ALL')
  const total = pagination?.totalElements ?? 0

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="mx-auto w-full max-w-[1040px] px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Practice</p>
            <h1 className="mt-1 text-3xl font-semibold text-foreground">Problems</h1>
            <p className="mt-1 text-sm text-muted-foreground">Search the problem set and open one to start coding.</p>
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">
            {loading ? 'Loading…' : `${total} problems`}
          </span>
        </header>

        <Card className="overflow-hidden rounded-lg border-border bg-card p-0 shadow-none" aria-label="Problem list">
          <ProblemFilters value={filters} onChange={applyFilters} tagSuggestions={tagSuggestions} />

          <div className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 bg-muted px-4 py-2 text-xs font-semibold uppercase text-muted-foreground sm:grid-cols-[40px_minmax(0,1fr)_120px_120px_100px] sm:px-5">
            <span className="text-right">#</span>
            <span>Title</span>
            <span>Difficulty</span>
            <span className="hidden sm:block">Acceptance</span>
            <span className="hidden justify-self-end sm:block">Status</span>
          </div>

          {loading ? (
            <ProblemListSkeleton />
          ) : error ? (
            <ProblemListError error={error} onRetry={() => void refetch()} />
          ) : problems.length === 0 ? (
            <ProblemListEmpty hasFilters={hasFilters} onClear={() => applyFilters(EMPTY_FILTERS)} />
          ) : (
            problems.map((problem, index) => (
              <ProblemRow
                key={problem.id}
                problem={problem}
                position={(page - 1) * PAGE_SIZE + index + 1}
                status={statusOf(problem.id)}
                bookmarked={isBookmarked(problem.id)}
                bookmarkPending={bookmarkPending}
                onToggleBookmark={(id) => void toggle(id)}
              />
            ))
          )}

          <PaginationBar pagination={pagination} page={page} onPageChange={setPage} />
        </Card>
      </div>
    </main>
  )
}