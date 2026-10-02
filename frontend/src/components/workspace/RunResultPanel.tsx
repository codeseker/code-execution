import { Badge } from '../ui/badge'
import { CodeView } from '../Code'
import { StatusBadge } from '../ui'
import { formatKb, formatMs } from '../../lib/format'
import type { SubmissionResult } from '../../hooks/submissions/types'

type Props = {
  result: SubmissionResult | null
  /** Shown when the job failed before producing a result payload. */
  failureReason: string | null
}

/**
 * Verdict panel for a finished job. Per-testcase IO is only rendered when the
 * backend sent it - `SubmissionType.exposesIo()` keeps hidden full-submission
 * data server-side, so those rows arrive without stdout/expected/actual.
 */
export default function RunResultPanel({ result, failureReason }: Props) {
  if (failureReason) {
    return (
      <div className="space-y-3">
        <StatusBadge status="SYSTEM_ERROR" />
        <pre className="overflow-x-auto rounded-md border border-destructive/40 bg-destructive/10 p-3 font-mono text-[13px] leading-5 text-destructive">
          {failureReason}
        </pre>
      </div>
    )
  }

  if (!result) {
    return (
      <p className="text-sm text-muted-foreground">
        The judge finished without recording a result for this run.
      </p>
    )
  }

  const hasIo = result.testCaseResults.some((row) => row.actualOutput !== null || row.expectedOutput !== null)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <StatusBadge status={result.overallVerdict} />
        <Badge variant="secondary" className="tabular-nums">
          {result.passedTestCases} / {result.totalTestCases} test cases
        </Badge>
        <span className="grow" />
        <span className="font-mono text-xs text-muted-foreground">
          {formatMs(result.totalExecutionTimeMs)} · {formatKb(result.peakMemoryKb)}
        </span>
      </div>

      {result.compileErrorLogs && (
        <pre className="overflow-x-auto rounded-md border border-destructive/40 bg-destructive/10 p-3 font-mono text-[13px] leading-5 text-destructive">
          {result.compileErrorLogs}
        </pre>
      )}

      {result.testCaseResults.length > 0 && (
        <div className="space-y-3">
          {result.testCaseResults.map((row, index) => (
            <article key={`${row.testCaseId ?? 'case'}-${index}`} className="grid gap-3 rounded-lg border border-border bg-muted/50 p-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 sm:col-span-2">
                <StatusBadge status={row.status} />
                <span className="text-sm font-medium text-foreground">Test case {index + 1}</span>
                <span className="grow" />
                <span className="font-mono text-xs text-muted-foreground">
                  {formatMs(row.executionTimeMs)} · {formatKb(row.memoryUsedKb)}
                </span>
              </div>

              {row.stdout !== null && (
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Output</p>
                  <pre className="overflow-x-auto rounded bg-background/60 p-2 font-mono text-xs text-foreground">
                    <CodeView code={row.stdout} lang="generic" />
                  </pre>
                </div>
              )}

              {row.stderr !== null && row.stderr !== '' && (
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Stderr</p>
                  <pre className="overflow-x-auto rounded bg-destructive/10 p-2 font-mono text-xs text-destructive">
                    {row.stderr}
                  </pre>
                </div>
              )}

              {hasIo && (
                <>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Expected</p>
                    <pre className="overflow-x-auto rounded bg-background/60 p-2 font-mono text-xs text-foreground">
                      {row.expectedOutput ?? '—'}
                    </pre>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Received</p>
                    <pre className="overflow-x-auto rounded bg-background/60 p-2 font-mono text-xs text-foreground">
                      {row.actualOutput ?? '—'}
                    </pre>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}