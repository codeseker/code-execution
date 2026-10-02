import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { EngineStatusBar } from '../components/shell'
import { EmptyState, Spinner, cx } from '../components/ui'
import { DifficultyBadge } from '../components/ui'
import { Icon } from '../components/icons'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'
import CustomLink from '../components/CustomLink'
import PaginationBar from '../components/problems/PaginationBar'
import SubmissionFilters from '../components/submissions/SubmissionFilters'
import type { SubmissionFiltersValue } from '../components/submissions/SubmissionFilters'
import SubmissionDetailPanel from '../components/submissions/SubmissionDetailPanel'
import usePublicProblemDetail from '../hooks/problems/public/usePublicProblemDetail'
import { useMySubmissions } from '../hooks/submissions/useSubmissions'
import useSubmission from '../hooks/submissions/useSubmissions'
import { formatDateTime, languageLabel, relativeTime, statusToneClass, statusLabel } from '../lib/format'
import type { Language, SubmissionStatus } from '../types/domain'
import { useAuthStore } from '../stores/auth'

const PAGE_SIZE = 10

const EMPTY_FILTERS: SubmissionFiltersValue = { language: 'ALL', status: 'ALL' }

/**
 * Submission history for one problem (`GET /users/me/submissions?problemId=`),
 * with the inspector reading `GET /submissions/{id}` for the selected row.
 */
export default function Submissions() {
  const { id: slug } = useParams()
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.auth.isAuthenticated)

  const [filters, setFilters] = useState<SubmissionFiltersValue>(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { problem } = usePublicProblemDetail(slug)

  const query = useMemo(
    () => ({
      problemId: problem?.id,
      language: filters.language === 'ALL' ? undefined : (filters.language as Language),
      status: filters.status === 'ALL' ? undefined : (filters.status as SubmissionStatus),
      page,
      limit: PAGE_SIZE,
    }),
    [problem?.id, filters, page],
  )

  const { submissions, pagination, loading, error } = useMySubmissions(query, { enabled: isAuthenticated })

  // The inspector polls while the selected job is still in the queue.
  const detail = useSubmission(selectedId ?? undefined, { live: true })

  const acceptedCount = submissions.filter((item) => item.verdict === 'ACCEPTED').length

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-background">
        <EmptyState
          icon="lock"
          title="Sign in to see your submissions"
          hint="Submission history, verdicts and stats are tied to your account."
          action={
            <CustomLink variant="unstyled" to="/login" className="btn btn-primary">
              Log in
            </CustomLink>
          }
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-background">
      <header className="flex h-11 flex-none items-center gap-3 border-b border-border px-3">
        <Button variant="ghost" size="icon" className="size-7" type="button" aria-label="Back to problem" onClick={() => navigate(`/problems/${slug ?? ''}`)}>
          <Icon name="chevronLeft" size={15} />
        </Button>
        <CustomLink variant="unstyled" to={`/problems/${slug ?? ''}`} className="flex items-center gap-1.5 rounded px-1.5 py-1 hover:bg-muted/40">
          <span className="text-sm font-medium text-foreground">{problem?.title ?? 'Problem'}</span>
          <Icon name="chevronDown" size={13} className="text-muted-foreground" />
        </CustomLink>
        {problem && <DifficultyBadge difficulty={problem.difficulty} className="hidden sm:inline-flex" />}
        <nav className="ml-2 hidden items-center gap-1 lg:flex" aria-label="Problem views">
          <CustomLink variant="unstyled" to={`/problems/${slug ?? ''}`} className="rounded px-2.5 py-1 text-[14px] text-muted-foreground hover:bg-muted/40 hover:text-foreground">
            Problem
          </CustomLink>
          <span className="rounded bg-muted/40 px-2.5 py-1 text-[14px] font-medium text-foreground">Submissions</span>
        </nav>
        <span className="grow" />
        <CustomLink variant="unstyled" to={`/problems/${slug ?? ''}`} className="btn btn-primary">
          Back to workspace
          <Icon name="arrowRight" size={13} />
        </CustomLink>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <CustomLink to="/problems" className="hover:text-foreground">
            Problems
          </CustomLink>
          <span>/</span>
          <CustomLink to={`/problems/${slug ?? ''}`} className="hover:text-foreground">
            {problem?.title ?? 'Problem'}
          </CustomLink>
          <span>/</span>
          <span className="text-foreground">Submissions</span>
        </nav>
        <SubmissionFilters
          value={filters}
          onChange={(next) => {
            setFilters(next)
            setPage(1)
            setSelectedId(null)
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border px-4 py-2.5">
        <span className="flex items-center gap-2 text-sm font-medium tabular-nums text-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
          {pagination?.totalElements ?? 0} Total Submissions
        </span>
        <span className="text-sm tabular-nums text-muted-foreground">
          <span className="font-medium text-foreground">{acceptedCount}</span> Accepted on this page
        </span>
      </div>

      <main className="mx-auto grid w-full max-w-[1460px] grow items-start gap-5 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_460px] lg:px-8">
        <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card" aria-label="Submissions list">
          {loading ? (
            <div className="flex flex-col gap-2 p-4" aria-busy="true" aria-label="Loading submissions">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-11 w-full" />
              ))}
            </div>
          ) : error ? (
            <EmptyState icon="alert" title="We could not load your submissions" hint="Please retry in a moment." />
          ) : submissions.length === 0 ? (
            <EmptyState
              icon="history"
              title="No submissions match these filters"
              hint="Clear the language or status filter to see your full history."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="ntable">
                <thead>
                  <tr>
                    <th className="pl-4">Status</th>
                    <th>Type</th>
                    <th>Language</th>
                    <th className="hidden sm:table-cell">Submitted</th>
                    <th className="pr-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => {
                    const isSelected = submission.id === selectedId;
                    return (
                      <tr
                        key={submission.id}
                        className={cx('cursor-pointer', isSelected && 'bg-muted/40')}
                        tabIndex={0}
                        aria-selected={isSelected}
                        onClick={() => setSelectedId(submission.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') setSelectedId(submission.id)
                        }}
                      >
                        <td className="pl-4">
                          <span
                            className={cx(
                              'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium',
                              statusToneClass(submission.verdict ?? submission.status),
                            )}
                          >
                            {submission.verdict ?? statusLabel(submission.status)}
                          </span>
                        </td>
                        <td className="text-xs text-muted-foreground">
                          {submission.type === 'FULL_SUBMISSION'
                            ? 'Submit'
                            : submission.type === 'EXAMPLE_EVAL'
                              ? 'Samples'
                              : 'Run'}
                        </td>
                        <td className="text-sm text-muted-foreground">{languageLabel(submission.language)}</td>
                        <td className="hidden text-xs text-muted-foreground sm:table-cell" title={formatDateTime(submission.createdAt)}>
                          {relativeTime(submission.createdAt)}
                        </td>
                        <td className="pr-4 text-right">
                          {isSelected ? (
                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                              Inspecting
                              <Icon name="arrowRight" size={13} />
                            </span>
                          ) : (
                            <span className="icon-btn reveal inline-flex" aria-hidden>
                              <Icon name="eye" size={15} />
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {submissions.length > 0 && (
            <PaginationBar pagination={pagination} page={page} onPageChange={setPage} noun="submissions" />
          )}
        </section>

        <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-4" aria-label="Submission details">
          {detail.loading && !selectedId && <Spinner className="text-muted-foreground" />}
          <SubmissionDetailPanel
            submission={detail.submission}
            loading={detail.loading && Boolean(selectedId)}
            onClose={() => setSelectedId(null)}
          />
        </aside>
      </main>

      <EngineStatusBar />
    </div>
  )
}