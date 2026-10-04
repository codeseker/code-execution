import { Badge } from '../ui/badge'
import { StatusBadge } from '../ui'
import { formatKb, formatMs, verdictLabel } from '../../lib/format'
import type { RunCaseResult, RunSummary } from '../../hooks/submissions/useActiveSubmission'
import type { SubmissionResult } from '../../hooks/submissions/types'
import type { SampleTestCase } from '../../hooks/problems/types'
import type { SubmissionType, Verdict } from '../../types/domain'

type Props = {
  result: SubmissionResult | null
  /** Live `CASE_RESULT` rows, shown while the run streams. */
  cases: RunCaseResult[]
  summary: RunSummary | null
  /** Shown when the job failed before producing a result payload. */
  failureReason: string | null
  sampleTestCases: SampleTestCase[]
  submissionType: SubmissionType | null
}

/**
 * Verdict panel for a job in flight or finished. It renders the streamed
 * `CASE_RESULT` rows while they arrive and falls back to the authoritative
 * result document for anything the socket did not deliver.
 *
 * A failing case always says why: a public sample shows its input, expected
 * and actual output; a hidden case shows the verdict, its number and an
 * explicit note that its data stays on the judge. An empty output box is only
 * ever shown when the program genuinely printed nothing.
 */
export default function RunResultPanel({
  result,
  cases,
  summary,
  failureReason,
  sampleTestCases,
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

  const overallVerdict: Verdict | null = summary?.overallStatus ?? result?.overallVerdict ?? null
  const compileError = summary?.compileError ?? result?.compileErrorLogs ?? null
  const totalRuntimeMs = summary?.totalRuntimeMs ?? result?.totalExecutionTimeMs ?? 0
  const peakMemoryKb = summary?.peakMemoryKb ?? result?.peakMemoryKb ?? 0

  // Rows still running are shown as pending so the list is stable in length.
  const totalCases = summary?.totalCount ?? result?.totalTestCases ?? cases.length
  const rows: Array<RunCaseResult | null> = [
    ...cases,
    ...Array.from({ length: Math.max(0, totalCases - cases.length) }, () => null),
  ]

  const label = (index: number) => {
    const row = rows[index]
    if (row?.kind === 'CUSTOM') {
      const sampleCount = sampleTestCases.length
      return `Custom ${index - sampleCount + 1}`
    }
    if (submissionType === 'EXAMPLE_EVAL' || submissionType === 'CUSTOM_RUN') return `Case ${index + 1}`
    return `Testcase ${index + 1}`
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2.5">
        {overallVerdict ? <StatusBadge status={overallVerdict} /> : <StatusBadge status="Pending" />}
        {totalCases > 0 && (
          <Badge variant="secondary" className="tabular-nums">
            {summary?.passedCount ?? result?.passedTestCases ?? 0} / {totalCases} test cases
          </Badge>
        )}
        <span className="grow" />
        {(totalRuntimeMs > 0 || peakMemoryKb > 0) && (
          <span className="font-mono text-xs text-muted-foreground">
            {formatMs(totalRuntimeMs)} · {formatKb(peakMemoryKb)}
          </span>
        )}
      </div>

      {compileError && (
        <pre className="overflow-x-auto rounded-md border border-destructive/40 bg-destructive/10 p-3 font-mono text-sm leading-5 text-destructive">
          {compileError}
        </pre>
      )}

      {rows.length > 0 ? (
        <div className="min-w-0 space-y-3" aria-label="Testcase results">
          {rows.map((row, index) => (
            <CaseCard
              key={row?.caseId ?? `pending-${index}`}
              index={index}
              title={label(index)}
              row={row}
              sample={row?.kind === 'SAMPLE' ? sampleTestCases.find((item) => item.id === row.caseId) : undefined}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No testcase details were returned for this run.</p>
      )}
    </div>
  )
}

function CaseCard({
  index,
  title,
  row,
  sample,
}: {
  index: number
  title: string
  row: RunCaseResult | null
  sample: SampleTestCase | undefined
}) {
  if (!row) {
    return (
      <article className="min-w-0 space-y-2 rounded-lg border border-border bg-card p-3">
        <header className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          <StatusBadge status="Pending" />
        </header>
        <p className="text-xs text-muted-foreground">Waiting for this case to finish…</p>
      </article>
    )
  }

  const isCustom = row.kind === 'CUSTOM'
  const isHidden = row.kind === 'HIDDEN'
  // `CASE_RESULT` echoes the exact stdin the judge fed the program, so it is
  // authoritative for custom cases too.
  const input = row.input ?? sample?.input ?? ''
  // Empty string = printed nothing; null = not ours to show.
  const actual = row.actualOutput ?? row.stdout

  return (
    <article className="min-w-0 space-y-3 rounded-lg border border-border bg-card p-3">
      <header className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <StatusBadge status={row.status} />
        <span className="grow" />
        <span className="font-mono text-xs text-muted-foreground">
          {formatMs(row.runtimeMs)} · {formatKb(row.memoryKb)}
        </span>
      </header>

      {isHidden ? (
        <p className="text-sm text-muted-foreground">
          {row.status === 'ACCEPTED'
            ? `Hidden test case ${index + 1} passed.`
            : `Hidden test case ${index + 1}: ${verdictLabel(row.status)}. The judge keeps the input and expected output of hidden cases private.`}
        </p>
      ) : (
        <>
          <div className="min-w-0 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Input</p>
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 font-mono text-xs leading-5 text-foreground">
              {input || '—'}
            </pre>
          </div>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <div className="min-w-0 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Expected output</p>
              <pre className="max-h-40 min-h-12 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 font-mono text-xs leading-5 text-foreground">
                {isCustom ? 'No expected output for a custom testcase.' : (row.expectedOutput || '(empty)')}
              </pre>
            </div>
            <div className="min-w-0 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Actual output</p>
              <pre
                className={`max-h-40 min-h-12 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 font-mono text-xs leading-5 ${
                  row.status === 'ACCEPTED' ? 'text-foreground' : 'text-destructive'
                }`}
              >
                {actual === null ? 'Not available.' : actual === '' ? 'No output — the program printed nothing.' : actual}
              </pre>
            </div>
          </div>
        </>
      )}

      {row.stderr && (
        <div className="min-w-0 space-y-1.5">
          <p className="text-xs font-medium text-destructive">Stderr</p>
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-md bg-destructive/10 p-3 font-mono text-xs leading-5 text-destructive">{row.stderr}</pre>
        </div>
      )}
    </article>
  )
}