import { CodeWindow } from '../Code'
import { Icon } from '../icons'
import { Spinner, StatusBadge } from '../ui'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Kbd } from '../Kbd'
import { Skeleton } from '../ui/skeleton'
import { EmptyState } from '../ui'
import { TestcaseBlock } from '../TestcaseBlock'
import {
  formatDateTime,
  formatKb,
  formatMs,
  languageLabel,
  relativeTime,
  statusToneClass,
  statusLabel,
  submissionTypeLabel,
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

const EXT: Record<Language, string> = {
  python: 'py',
  javascript: 'js',
  cpp: 'cpp',
  java: 'java',
}

type Props = {
  submission: SubmissionDetail | undefined
  loading: boolean
  onClose: () => void
}

/**
 * Inspector for one submission. `GET /submissions/{id}` is owner-scoped, returns
 * the submitted `code` alongside the result document, and only exposes
 * per-testcase IO for the run types the backend allows
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
      <div className="rounded-lg border border-border bg-card">
        <EmptyState
          icon="search"
          title="No submission selected"
          hint="Pick a row from the list to inspect its code, result and test cases."
        />
      </div>
    )
  }

  const { result } = submission
  const verdict = result?.overallVerdict ?? null
  const statusValue = verdict ?? submission.status
  const isRunning = submission.status === 'QUEUED' || submission.status === 'PROCESSING'

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex min-w-0 flex-col">
          <span className="truncate text-base font-semibold text-foreground">
            {submission.problemTitle ?? 'Problem removed'}
          </span>
          <span className="font-mono text-xs text-muted-foreground">#{submission.id.slice(-8)}</span>
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close submission details">
          <Kbd>ESC</Kbd>
          <Icon name="x" size={13} />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${statusToneClass(statusValue)}`}
        >
          <StatusBadge status={statusValue} />
        </span>
        <Badge variant="secondary">{languageLabel(submission.language)}</Badge>
        <Badge variant="outline">{submissionTypeLabel(submission.type)}</Badge>
        <span className="text-xs text-muted-foreground">{relativeTime(submission.createdAt)}</span>
      </div>

      <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`flex size-8 items-center justify-center rounded-full ${statusToneClass(statusValue)}`}
          >
            <Icon
              name={submission.status === 'COMPLETED' ? (verdict === 'ACCEPTED' ? 'checkCircle' : 'xCircle') : 'timer'}
              size={17}
            />
          </span>
          <span className="text-lg font-semibold text-foreground">
            {verdict ? verdictLabel(verdict) : statusLabel(submission.status)}
          </span>
          <span className="grow" />
          {isRunning ? (
            <Spinner size={16} className="text-muted-foreground" />
          ) : result ? (
            <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
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
              <div className="rounded-lg border border-border bg-muted/50 px-3.5 py-3">
                <p className="text-sm font-medium text-muted-foreground">Runtime</p>
                <p className="mt-1 font-mono text-sm tabular-nums text-foreground">
                  {formatMs(result.totalExecutionTimeMs)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/50 px-3.5 py-3">
                <p className="text-sm font-medium text-muted-foreground">Peak memory</p>
                <p className="mt-1 font-mono text-sm tabular-nums text-foreground">
                  {formatKb(result.peakMemoryKb)}
                </p>
              </div>
            </div>

            {result.compileErrorLogs && (
              <pre className="overflow-x-auto rounded-lg border border-destructive/40 bg-destructive/10 p-3 font-mono text-sm leading-5 text-destructive">
                {result.compileErrorLogs}
              </pre>
            )}

            {result.testCaseResults.map((row, index) => (
              <div
                key={`${row.testCaseId ?? 'case'}-${index}`}
                className="min-w-0 space-y-2 rounded-lg border border-border bg-muted/50 p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={row.status} />
                  <span className="text-sm font-medium text-foreground">Testcase {index + 1}</span>
                  <span className="grow" />
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatMs(row.executionTimeMs)}
                  </span>
                </div>
                {row.actualOutput !== null && (
                  <div className="grid min-w-0 gap-2 sm:grid-cols-2">
                    <TestcaseBlock
                      label="Expected"
                      value={row.expectedOutput}
                      tone="muted"
                      maxHeightClassName="max-h-32"
                    />
                    <TestcaseBlock
                      label="Received"
                      value={row.actualOutput}
                      tone={row.status === 'ACCEPTED' ? 'default' : 'destructive'}
                      maxHeightClassName="max-h-32"
                    />
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-border px-3 py-2">
          <span className="truncate font-mono text-xs text-muted-foreground">
            submission.{EXT[submission.language]}
          </span>
          <span className="grow" />
          <span className="font-mono text-xs text-muted-foreground">
            {formatDateTime(submission.createdAt)}
          </span>
        </div>
        {submission.code ? (
          <CodeWindow
            title={`submission.${EXT[submission.language]}`}
            code={submission.code}
            lang={MONACO_LANG[submission.language]}
            copyable
          />
        ) : (
          <p className="p-4 text-sm text-muted-foreground">
            The source code for this submission is no longer stored.
          </p>
        )}
      </section>
    </>
  )
}