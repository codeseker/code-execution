import { CodeView } from '../Code'
import { Icon } from '../icons'
import { Spinner, StatusBadge } from '../ui'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { Skeleton } from '../ui/skeleton'
import { EmptyState } from '../ui'
import {
  formatDateTime,
  formatKb,
  formatMs,
  languageLabel,
  relativeTime,
  submissionTypeLabel,
  statusToneClass,
  statusLabel,
  verdictLabel,
} from '../../lib/format'
import type { SubmissionDetail } from '../../hooks/submissions/types'
import type { Language } from '../../types/domain'

const MONACO_LANG: Record<Language, 'python' | 'js' | 'rust' | 'generic'> = {
  python: 'python',
  javascript: 'js',
  cpp: 'generic',
  java: 'generic',
}

type Props = {
  submission: SubmissionDetail | undefined
  loading: boolean
  onClose: () => void
}

/**
 * Inspector for one submission. `GET /submissions/{id}` is owner-scoped and
 * exposes per-testcase IO only for the run types the backend allows
 * (`SubmissionType.exposesIo`).
 */
export default function SubmissionDetailPanel({ submission, loading, onClose }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading submission">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <EmptyState
          icon="search"
          title="No submission selected"
          hint="Pick a row from the list to inspect its result, timings and test cases."
        />
      </div>
    )
  }

  const { result } = submission
  const verdict = result?.overallVerdict ?? null
  const statusValue = verdict ?? submission.status

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">Submission Details</h2>
        <button
          type="button"
          className="btn btn-ghost btn-sm h-7"
          onClick={onClose}
          aria-label="Close submission details"
        >
          <span className="kbd">ESC</span>
          <Icon name="x" size={13} />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${statusToneClass(statusValue)}`}>
          <StatusBadge status={statusValue} />
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-0.5 font-mono text-xs text-secondary-foreground">
          #{submission.id.slice(-8)}
        </span>
        <span className="text-xs text-muted-foreground">
          {languageLabel(submission.language)} · {submissionTypeLabel(submission.type)} ·{' '}
          {relativeTime(submission.createdAt)}
        </span>
      </div>

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`center size-8 rounded-full ${statusToneClass(statusValue)}`}>
            <Icon
              name={submission.status === 'COMPLETED' ? (verdict === 'ACCEPTED' ? 'checkCircle' : 'xCircle') : 'timer'}
              size={17}
            />
          </span>
          <span className="text-xl font-semibold leading-7 text-foreground">
            {verdict ? verdictLabel(verdict) : statusLabel(submission.status)}
          </span>
          <span className="grow" />
          {submission.status === 'QUEUED' || submission.status === 'PROCESSING' ? (
            <Spinner size={16} className="text-muted-foreground" />
          ) : result ? (
            <span className="rounded-sm bg-muted/40 px-2 py-1 font-mono text-xs text-muted-foreground">
              {formatMs(result.totalExecutionTimeMs)} · {formatKb(result.peakMemoryKb)}
            </span>
          ) : null}
        </div>

        {!result && (
          <p className="text-sm text-muted-foreground">
            {submission.status === 'FAILED'
              ? 'The judge could not finish this run.'
              : 'The judge has not recorded a result for this run yet.'}
          </p>
        )}

        {result && (
          <>
            <p className="text-sm tabular-nums text-muted-foreground">
              {result.passedTestCases} / {result.totalTestCases} Test Cases Passed
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-border bg-muted/50 px-3.5 py-3">
                <p className="text-sm font-semibold text-muted-foreground">Runtime</p>
                <p className="mt-1 text-sm font-medium tabular-nums text-foreground">
                  {formatMs(result.totalExecutionTimeMs)}
                </p>
              </div>
              <div className="rounded-md border border-border bg-muted/50 px-3.5 py-3">
                <p className="text-sm font-semibold text-muted-foreground">Peak memory</p>
                <p className="mt-1 text-sm font-medium tabular-nums text-foreground">{formatKb(result.peakMemoryKb)}</p>
              </div>
            </div>

            {result.compileErrorLogs && (
              <pre className="overflow-x-auto rounded-md border border-destructive/40 bg-destructive/10 p-3 font-mono text-sm leading-5 text-destructive">
                {result.compileErrorLogs}
              </pre>
            )}

            {result.testCaseResults.map((row, index) => (
              <div key={`${row.testCaseId ?? 'case'}-${index}`} className="rounded-md border border-border bg-muted/50 p-3">
                <div className="flex items-center gap-2">
                  <StatusBadge status={row.status} />
                  <span className="text-sm font-medium text-foreground">Case {index + 1}</span>
                  <span className="grow" />
                  <span className="font-mono text-xs text-muted-foreground">{formatMs(row.executionTimeMs)}</span>
                </div>
                {row.actualOutput !== null && (
                  <>
                    <Separator className="my-2" />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Expected</p>
                        <pre className="mt-1 overflow-x-auto font-mono text-xs text-foreground">{row.expectedOutput ?? '—'}</pre>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Received</p>
                        <pre className="mt-1 overflow-x-auto font-mono text-xs text-foreground">{row.actualOutput}</pre>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-border px-3 py-2.5">
          <Badge variant="secondary">{languageLabel(submission.language)}</Badge>
          <span className="font-mono text-xs text-muted-foreground">
            submission.{submission.language === 'python' ? 'py' : submission.language}
          </span>
          <span className="grow" />
          <span className="font-mono text-xs text-muted-foreground">{formatDateTime(submission.createdAt)}</span>
        </div>
        <div className="bg-muted/50">
          {result?.testCaseResults.some((row) => row.stdout) ? (
            <CodeView code={result.testCaseResults.find((row) => row.stdout)?.stdout ?? ''} lang={MONACO_LANG[submission.language]} />
          ) : (
            <p className="p-4 text-sm text-muted-foreground">
              Source code is not part of the submission payload.
            </p>
          )}
        </div>
      </section>
    </>
  )
}