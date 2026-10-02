import { Icon } from '../icons'
import { Badge } from '../ui/badge'
import { StatusBadge } from '../ui'
import { Skeleton } from '../ui/skeleton'
import { EmptyState } from '../ui'
import { languageLabel, relativeTime } from '../../lib/format'
import { statusToneClass, verdictLabel } from '../../lib/format'
import CustomLink from '../CustomLink'
import type { SubmissionSummary } from '../../hooks/submissions/types'

type Props = {
  submissions: SubmissionSummary[]
  loading: boolean
  isAuthenticated: boolean
  problemId: string
  problemSlug: string
}

/** History scoped to the current problem, newest first. */
export default function WorkspaceSubmissionsTab({
  submissions,
  loading,
  isAuthenticated,
  problemId,
  problemSlug,
}: Props) {
  if (!isAuthenticated) {
    return (
      <EmptyState
        icon="lock"
        title="Sign in to track your runs"
        hint="Your submission history, verdicts and stats are tied to your account."
        action={
          <CustomLink variant="unstyled" to="/login" className="btn btn-primary">
            Log in
          </CustomLink>
        }
      />
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading submissions">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-11 w-full" />
        ))}
      </div>
    )
  }

  if (submissions.length === 0) {
    return (
      <EmptyState
        icon="history"
        title="No submissions yet"
        hint="Run your first solution for this problem — it will show up here."
      />
    )
  }

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-foreground">Your submissions</h2>
        <CustomLink variant="unstyled" to={`/problems/${problemSlug}/submissions`} className="btn btn-ghost btn-sm">
          View all
          <Icon name="arrowRight" size={16} />
        </CustomLink>
      </div>

      <ul className="overflow-hidden rounded-lg border border-border">
        {submissions.map((submission) => (
          <li key={submission.id} className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
            <StatusBadge status={submission.verdict ?? submission.status} />
            <Badge variant="secondary">{languageLabel(submission.language)}</Badge>
            <span className="text-xs text-muted-foreground">{relativeTime(submission.createdAt)}</span>
            <span className="grow" />
            <span
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${statusToneClass(submission.verdict ?? submission.status)}`}
            >
              {submission.verdict ? verdictLabel(submission.verdict) : submission.status.toLowerCase()}
            </span>
            <span className="font-mono text-xs text-muted-foreground" title={problemId}>
              #{submission.id.slice(-8)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}