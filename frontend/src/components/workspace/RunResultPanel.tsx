import { Badge } from '../ui/badge'
import { StatusBadge } from '../ui'
import { formatKb, formatMs } from '../../lib/format'
import type { SubmissionResult } from '../../hooks/submissions/types'
import type { SampleTestCase } from '../../hooks/problems/types'
import type { SubmissionType } from '../../types/domain'

type Props = {
  result: SubmissionResult | null
  /** Shown when the job failed before producing a result payload. */
  failureReason: string | null
  sampleTestCases: SampleTestCase[]
  customCases: Array<{ id: string; input: string }>
  runCaseId: string | null
  submissionType: SubmissionType | null
}

/**
 * Verdict panel for a finished job. Per-testcase IO is only rendered when the
 * backend sent it - `SubmissionType.exposesIo()` keeps hidden full-submission
 * data server-side, so those rows arrive without stdout/expected/actual.
 */
export default function RunResultPanel({
  result,
  failureReason,
  sampleTestCases,
  customCases,
  runCaseId,
  submissionType,
}: Props) {
  if (failureReason) {
    return (
      <div className="space-y-3">
        <StatusBadge status="SYSTEM_ERROR" />
        <pre className="overflow-x-auto rounded-md border border-destructive/40 bg-destructive/10 p-3 font-mono text-sm leading-5 text-destructive">
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

  const displayRows = submissionType === 'EXAMPLE_EVAL' && sampleTestCases.length > 0
    ? (() => {
        const usedRows = new Set<number>()
        const samples = sampleTestCases.map((sample, index) => {
          const matchedIndex = result.testCaseResults.findIndex((item) => item.testCaseId === sample.id)
          const positionalRow = result.testCaseResults[index]
          const positionalIdBelongsToAnotherSample = positionalRow?.testCaseId != null
            && sampleTestCases.some((item) => item.id === positionalRow.testCaseId && item.id !== sample.id)
          const rowIndex = matchedIndex >= 0
            ? matchedIndex
            : positionalRow && !positionalIdBelongsToAnotherSample && !usedRows.has(index)
              ? index
              : -1
          if (rowIndex >= 0) usedRows.add(rowIndex)
          return { index, sample, row: rowIndex >= 0 ? result.testCaseResults[rowIndex] : null }
        })
        const extraRows = result.testCaseResults
          .map((row, index) => ({ index: samples.length + index, sample: undefined, row }))
          .filter((_, index) => !usedRows.has(index))
        return [...samples, ...extraRows]
      })()
    : result.testCaseResults.map((row, index) => ({ index, sample: undefined, row }))

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
        <pre className="overflow-x-auto rounded-md border border-destructive/40 bg-destructive/10 p-3 font-mono text-sm leading-5 text-destructive">
          {result.compileErrorLogs}
        </pre>
      )}

      {displayRows.length > 0 ? (
        <div className="min-w-0 space-y-3" aria-label="Testcase results">
          {displayRows.map(({ row, sample, index }) => {
            const resolvedSample = sample
              ?? (row ? sampleTestCases.find((item) => item.id === row.testCaseId) : undefined)
              ?? (submissionType === 'CUSTOM_RUN' && runCaseId?.startsWith('sample:')
                ? sampleTestCases.find((item) => `sample:${item.id}` === runCaseId)
                : undefined)
            const runCustomId = runCaseId?.startsWith('custom:') ? runCaseId.slice('custom:'.length) : null
            const custom = submissionType === 'CUSTOM_RUN' && runCustomId
              ? customCases.find((item) => item.id === runCustomId)
              : null
            const input = resolvedSample?.input ?? custom?.input
            const expected = row?.expectedOutput ?? resolvedSample?.output ?? 'Not provided for this run.'

            return (
              <article key={`${row?.testCaseId ?? resolvedSample?.id ?? 'case'}-${index}`} className="min-w-0 space-y-3 rounded-lg border border-border bg-card p-3">
                <header className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {submissionType === 'EXAMPLE_EVAL' ? `Sample ${index + 1}` : `Testcase ${index + 1}`}
                  </span>
                  {row ? <StatusBadge status={row.status} /> : <StatusBadge status="Pending" />}
                  <span className="grow" />
                  {row && (
                    <span className="font-mono text-xs text-muted-foreground">
                      {formatMs(row.executionTimeMs)} · {formatKb(row.memoryUsedKb)}
                    </span>
                  )}
                </header>
                {input !== undefined && (
                  <div className="min-w-0 space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Input</p>
                    <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 font-mono text-xs leading-5 text-foreground">{input || '—'}</pre>
                  </div>
                )}
                <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                  <div className="min-w-0 space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Expected output</p>
                    <pre className="max-h-40 min-h-12 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 font-mono text-xs leading-5 text-foreground">{expected}</pre>
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Actual output</p>
                    <pre className="max-h-40 min-h-12 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 font-mono text-xs leading-5 text-foreground">{row?.actualOutput ?? row?.stdout ?? (row ? 'No output returned.' : 'No result was returned for this sample.')}</pre>
                  </div>
                </div>
                {!row && submissionType === 'EXAMPLE_EVAL' && (
                  <p className="text-xs text-warning">This sample did not have a result in the example-evaluation response.</p>
                )}
                {row?.stderr && (
                  <div className="min-w-0 space-y-1.5">
                    <p className="text-xs font-medium text-destructive">Stderr</p>
                    <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-md bg-destructive/10 p-3 font-mono text-xs leading-5 text-destructive">{row.stderr}</pre>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No testcase details were returned for this run.</p>
      )}
    </div>
  )
}