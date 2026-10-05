import { StatusBadge } from '../ui'
import { TestcaseBlock } from '../TestcaseBlock'
import { formatKb, formatMs, verdictLabel } from '../../lib/format'
import type { RunCaseResult, RunSummary } from '../../hooks/submissions/useActiveSubmission'
import type { SubmissionResult } from '../../hooks/submissions/types'
import type { SampleTestCase } from '../../hooks/problems/types'
import type { SubmissionType } from '../../types/domain'

/** Shown instead of a pass/fail verdict when nothing was expected. */
const NO_EXPECTED_OUTPUT = 'No expected output provided'

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
 * Per-case detail for a finished or in-flight run. The verdict/count headline
 * is rendered by `RunConsole` directly above this, so this component only lists
 * the cases themselves.
 *
 * A failing case always says why: a public sample shows its input, expected and
 * actual output; a custom case shows what the caller typed next to what the
 * program printed; a hidden case shows the verdict and an explicit note that its
 * data stays on the judge. A custom case the caller left without an expected
 * output is labelled as such instead of being reported as a pass.
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
        <pre className="overflow-x-auto rounded-lg border border-destructive/40 bg-destructive/10 p-3 font-mono text-sm leading-5 text-destructive">
          {failureReason}
        </pre>
      </div>
    )
  }

  const compileError = summary?.compileError ?? result?.compileErrorLogs ?? null
  const totalCases = summary?.totalCount ?? result?.totalTestCases ?? cases.length

  // Rows still running are shown as pending so the list stays stable in length.
  const rows: Array<RunCaseResult | null> = [
    ...cases,
    ...Array.from({ length: Math.max(0, totalCases - cases.length) }, () => null),
  ]

  /**
   * Samples run first and in storage order, so the custom cases that follow are
   * numbered from the sample count. The judge labels them `custom-1..N`.
   */
  const label = (index: number) => {
    if (rows[index]?.kind === 'CUSTOM') return `Custom Case ${index - sampleTestCases.length + 1}`
    if (submissionType === 'EXAMPLE_EVAL' || submissionType === 'CUSTOM_RUN') return `Case ${index + 1}`
    return `Testcase ${index + 1}`
  }

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No testcase details were returned for this run.</p>
  }

  return (
    <div className="min-w-0 space-y-3" aria-label="Testcase results">
      {compileError && (
        <pre className="overflow-x-auto rounded-lg border border-destructive/40 bg-destructive/10 p-3 font-mono text-sm leading-5 text-destructive">
          {compileError}
        </pre>
      )}
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
  // A custom case the caller did not grade has no expected output at all; that
  // is not a pass, so it gets its own wording instead of a verdict badge.
  const ungraded = isCustom && row.status === 'ACCEPTED' && row.expectedOutput === null
  const actualText =
    actual === null
      ? 'Not available.'
      : actual === ''
        ? 'No output — the program printed nothing.'
        : actual

  return (
    <article className="min-w-0 space-y-3 rounded-lg border border-border bg-card p-3">
      <header className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        {ungraded ? (
          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground">
            {NO_EXPECTED_OUTPUT}
          </span>
        ) : (
          <StatusBadge status={row.status} />
        )}
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
          <TestcaseBlock
            label="Input"
            value={input}
            placeholder="No input provided"
            maxHeightClassName="max-h-40"
          />
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <TestcaseBlock
              label="Expected Output"
              value={row.expectedOutput}
              tone="muted"
              placeholder={NO_EXPECTED_OUTPUT}
              maxHeightClassName="max-h-40"
            />
            <TestcaseBlock
              label="Actual Output"
              value={actualText}
              tone={ungraded || row.status === 'ACCEPTED' ? 'default' : 'destructive'}
              maxHeightClassName="max-h-40"
            />
          </div>
        </>
      )}

      {row.stderr && (
        <TestcaseBlock label="Stderr" value={row.stderr} tone="destructive" maxHeightClassName="max-h-40" />
      )}
    </article>
  )
}