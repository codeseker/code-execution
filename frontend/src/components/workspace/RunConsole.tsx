import { useEffect, useId, useRef } from 'react'
import { Icon } from '../icons'
import { Spinner } from '../ui'
import { BaseTabs, BaseTabsList, BaseTabsPanel, BaseTabsTrigger } from '../BaseTabs'
import { ScrollArea } from '../ui/scroll-area'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { BaseTooltip } from '../BaseTooltip'
import RunResultPanel from './RunResultPanel'
import type { SampleTestCase } from '../../hooks/problems/types'
import type { RunCaseResult, RunPhase, RunProgress, RunSummary } from '../../hooks/submissions/useActiveSubmission'
import type { SubmissionResult } from '../../hooks/submissions/types'
import type { SubmissionType, Verdict } from '../../types/domain'
import { verdictLabel } from '../../lib/format'

type Props = {
  open: boolean
  onToggle: () => void
  sampleTestCases: SampleTestCase[]
  phase: RunPhase
  result: SubmissionResult | null
  /** Live `CASE_RESULT` rows of the current run, in run order. */
  cases: RunCaseResult[]
  /** Terminal `RUN_FINISHED` summary of the current run. */
  summary: RunSummary | null
  failureReason: string | null
  progress: RunProgress | null
  queuePosition: number | null
  /** `POST /problems/{id}/example-eval` - judges the public samples. */
  onRunSamples: () => void
  isAuthenticated: boolean
  submissionType?: SubmissionType | null
  requestPending?: boolean
  view: 'testcase' | 'result'
  onViewChange: (view: 'testcase' | 'result') => void
  customCases: CustomTestCase[]
  activeCaseId: string
  onActiveCaseChange: (id: string) => void
  onAddCustomCase: () => void
  onRemoveCustomCase: (id: string) => void
  onCustomCaseInputChange: (id: string, input: string) => void
  focusCustomCaseId: string | null
}

export type CustomTestCase = { id: string; input: string }

const PHASE_LABEL: Record<RunPhase, string> = {
  idle: 'Ready',
  queued: 'Queued',
  processing: 'Running',
  completed: 'Judged',
  failed: 'Failed',
}

/** Status dot tone for one tab: muted while pending, green/red once judged. */
function dotClass(verdict: Verdict | null | undefined): string {
  if (!verdict) return 'bg-muted-foreground/40'
  if (verdict === 'ACCEPTED') return 'bg-verdict-accepted'
  if (verdict === 'WRONG_ANSWER') return 'bg-verdict-wrong-answer'
  if (verdict === 'TIME_LIMIT_EXCEEDED' || verdict === 'MEMORY_LIMIT_EXCEEDED') return 'bg-warning'
  return 'bg-destructive'
}

function dotLabel(verdict: Verdict | null | undefined): string {
  if (!verdict) return 'Not run'
  return verdict === 'ACCEPTED' ? 'Passed' : verdictLabel(verdict)
}

/**
 * Console pane: the verdict for whichever job is active plus the tab strip of
 * testcases.
 *
 * The sample cases come from the problem detail and are judged by the server,
 * so a tab lights up as its `CASE_RESULT` streams in. Custom tabs are the
 * caller's own inputs; they are sent with the run and have no expected output.
 */
export default function RunConsole({
  open,
  onToggle,
  sampleTestCases,
  phase,
  result,
  cases,
  summary,
  failureReason,
  progress,
  queuePosition,
  onRunSamples,
  isAuthenticated,
  submissionType = null,
  requestPending = false,
  view,
  onViewChange,
  customCases,
  activeCaseId,
  onActiveCaseChange,
  onAddCustomCase,
  onRemoveCustomCase,
  onCustomCaseInputChange,
  focusCustomCaseId,
}: Props) {
  const instanceId = useId()
  const inputRefs = useRef(new Map<string, HTMLTextAreaElement>())
  const tabRefs = useRef(new Map<string, HTMLButtonElement>())
  const busy = requestPending || phase === 'queued' || phase === 'processing'
  const caseCount = sampleTestCases.length + customCases.length
  const activeCustomCase = customCases.find((item) => `custom:${item.id}` === activeCaseId)

  // Jump to the result as soon as a job is in flight or finished.
  useEffect(() => {
    if (phase !== 'idle') onViewChange('result')
  }, [onViewChange, phase])

  useEffect(() => {
    if (focusCustomCaseId) inputRefs.current.get(focusCustomCaseId)?.focus()
  }, [customCases, focusCustomCaseId])

  useEffect(() => {
    const activeTab = tabRefs.current.get(activeCaseId)
    activeTab?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [activeCaseId])

  /**
   * Per-case result for a tab. Samples run first and in storage order, so a
   * sample tab maps to the same run index; custom tabs follow the samples in
   * the order they were sent.
   */
  const caseResult = (index: number): RunCaseResult | null => {
    const byRunIndex = cases.find((item) => item.caseIndex === index + 1)
    if (byRunIndex) return byRunIndex
    // Fall back to the persisted row when the socket never delivered it.
    const row = result?.testCaseResults.find(
      (item) => item.caseIndex === index + 1 || (item.caseIndex == null && item.testCaseId === sampleTestCases[index]?.id),
    )
    if (!row) return null
    return {
      caseIndex: index + 1,
      caseId: row.testCaseId ?? '',
      kind: row.kind ?? 'SAMPLE',
      status: row.status,
      input: sampleTestCases[index]?.input ?? null,
      expectedOutput: row.expectedOutput,
      actualOutput: row.actualOutput,
      stdout: row.stdout,
      stderr: row.stderr,
      runtimeMs: row.executionTimeMs,
      memoryKb: row.memoryUsedKb,
    }
  }

  const customCaseResult = (index: number): RunCaseResult | null => {
    const sampleCount = sampleTestCases.length
    const byRunIndex = cases.find((item) => item.kind === 'CUSTOM' && item.caseIndex === sampleCount + index + 1)
    if (byRunIndex) return byRunIndex
    const row = result?.testCaseResults.filter((item) => item.kind === 'CUSTOM')[index]
    if (!row) return null
    return {
      caseIndex: sampleCount + index + 1,
      caseId: row.testCaseId ?? `custom-${index + 1}`,
      kind: 'CUSTOM',
      status: row.status,
      input: customCases[index]?.input ?? null,
      expectedOutput: row.expectedOutput,
      actualOutput: row.actualOutput,
      stdout: row.stdout,
      stderr: row.stderr,
      runtimeMs: row.executionTimeMs,
      memoryKb: row.memoryUsedKb,
    }
  }

  const passedCount = summary?.passedCount ?? cases.filter((item) => item.status === 'ACCEPTED').length
  const judgedCount = summary?.totalCount ?? cases.length
  const overallVerdict = summary?.overallStatus ?? result?.overallVerdict ?? null
  const isSampleRun = submissionType === 'EXAMPLE_EVAL' || submissionType === 'CUSTOM_RUN'

  const renderOutputBlock = (label: string, value: string, tone = 'text-foreground') => (
    <div className="min-w-0 space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <pre className={`max-h-40 min-h-12 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 font-mono text-xs leading-5 ${tone}`}>{value || '—'}</pre>
    </div>
  )

  /**
   * Never show an empty box next to a failing verdict: an empty string means
   * the program printed nothing, null means the data is not ours to show.
   */
  const outputText = (row: RunCaseResult | null): { text: string; tone: string } => {
    if (!row) return { text: 'Run this testcase to see output.', tone: 'text-muted-foreground' }
    const actual = row.actualOutput ?? row.stdout
    if (actual === null) {
      return {
        text: 'Hidden test case — the judge keeps its input and expected output private.',
        tone: 'text-muted-foreground',
      }
    }
    if (actual === '') {
      return { text: 'No output — the program printed nothing.', tone: 'text-destructive' }
    }
    return {
      text: actual,
      tone: row.status === 'ACCEPTED' ? 'text-foreground' : 'text-destructive',
    }
  }

  const expectedText = (row: RunCaseResult | null, isCustom: boolean): { text: string; tone: string } => {
    if (isCustom) return { text: 'No expected output for a custom testcase.', tone: 'text-muted-foreground' }
    if (!row) return { text: '—', tone: 'text-foreground' }
    if (row.expectedOutput === null) {
      return { text: 'Hidden test case — the judge keeps its expected output private.', tone: 'text-muted-foreground' }
    }
    return { text: row.expectedOutput || '(empty)', tone: 'text-foreground' }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {open && (
        <BaseTabs value={view} onValueChange={(value) => onViewChange(value as 'testcase' | 'result')} className="flex min-h-0 grow flex-col">
          <div className="flex h-11 flex-none items-center gap-2 border-b border-border bg-muted/40 px-3">
            <BaseTabsList className="h-full gap-1">
              <BaseTabsTrigger value="testcase" className="h-full px-2.5">
                <Icon name="list" size={16} /> Testcase
              </BaseTabsTrigger>
              <BaseTabsTrigger value="result" className="h-full px-2.5">
                <Icon name="terminal" size={16} /> Result / Console
                {busy && <Spinner size={12} className="text-muted-foreground" />}
              </BaseTabsTrigger>
            </BaseTabsList>
            <span className="grow" />
            <span className="font-mono text-xs text-muted-foreground">{PHASE_LABEL[phase]}</span>
          </div>

          <ScrollArea className="min-h-0 grow">
            <div className="min-h-full p-3 sm:p-4">
              <BaseTabsPanel value="testcase" className="min-w-0 space-y-4">
                {sampleTestCases.length > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      Run judges every sample plus your custom testcases.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 shrink-0"
                      disabled={busy || !isAuthenticated}
                      onClick={onRunSamples}
                    >
                      <Icon name="play" size={13} />
                      Run all {sampleTestCases.length} samples
                    </Button>
                  </div>
                )}
                <BaseTabs value={activeCaseId} onValueChange={onActiveCaseChange} className="min-w-0">
                  <div className="flex min-w-0 items-center gap-1 border-b border-border">
                    <BaseTabsList
                      className="scrollbar-hidden flex min-w-0 flex-1 flex-nowrap justify-start gap-1 overflow-x-auto"
                      onKeyDown={(event) => {
                        if (event.key !== 'Delete' || !activeCustomCase) return
                        event.preventDefault()
                        onRemoveCustomCase(activeCustomCase.id)
                      }}
                      aria-label="Test cases"
                    >
                      {sampleTestCases.map((sample, index) => {
                        const row = caseResult(index)
                        return (
                          <BaseTabsTrigger
                            key={sample.id}
                            ref={(node) => {
                              if (node) tabRefs.current.set(`sample:${sample.id}`, node)
                              else tabRefs.current.delete(`sample:${sample.id}`)
                            }}
                            value={`sample:${sample.id}`}
                            className="h-10 shrink-0 gap-2 rounded-none border-b-2 border-transparent px-3 data-[state=active]:border-primary data-[state=active]:bg-accent/50 data-[state=active]:shadow-none"
                          >
                            Case {index + 1}
                            <span
                              className={`size-1.5 shrink-0 rounded-full ${dotClass(row?.status)}`}
                              title={dotLabel(row?.status)}
                              aria-hidden="true"
                            />
                          </BaseTabsTrigger>
                        )
                      })}
                      {customCases.map((custom, index) => {
                        const row = customCaseResult(index)
                        const tabId = `custom:${custom.id}`
                        return (
                          <span key={custom.id} className="inline-flex shrink-0 items-center">
                            <BaseTabsTrigger
                              ref={(node) => {
                                if (node) tabRefs.current.set(tabId, node)
                                else tabRefs.current.delete(tabId)
                              }}
                              value={tabId}
                              className="peer h-10 shrink-0 gap-1.5 rounded-none border-b-2 border-transparent px-3 pr-8 data-[state=active]:border-primary data-[state=active]:bg-accent/50 data-[state=active]:shadow-none"
                              onKeyDown={(event) => {
                                if (event.key !== 'Delete') return
                                event.preventDefault()
                                event.stopPropagation()
                                onRemoveCustomCase(custom.id)
                              }}
                            >
                              Custom {index + 1}
                              <Badge variant="secondary" className="px-1 py-0 text-xs">Custom</Badge>
                              <span
                                className={`size-1.5 shrink-0 rounded-full ${dotClass(row?.status)}`}
                                title={dotLabel(row?.status)}
                                aria-hidden="true"
                              />
                            </BaseTabsTrigger>
                            <Button
                              type="button"
                              size="icon-xs"
                              variant="ghost"
                              className="-ml-8 z-10 opacity-0 peer-hover:opacity-100 peer-focus-visible:opacity-100 peer-data-[state=active]:opacity-100"
                              aria-label={`Delete Custom ${index + 1} testcase`}
                              title={`Delete Custom ${index + 1}`}
                              disabled={caseCount <= 1}
                              onClick={() => onRemoveCustomCase(custom.id)}
                            >
                              <Icon name="x" size={12} />
                            </Button>
                          </span>
                        )
                      })}
                    </BaseTabsList>
                    <BaseTooltip content="Add custom testcase">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0"
                        aria-label="Add custom testcase"
                        onClick={onAddCustomCase}
                      >
                        <Icon name="plus" size={15} />
                      </Button>
                    </BaseTooltip>
                  </div>

                  {sampleTestCases.map((sample, index) => {
                    const row = caseResult(index)
                    const actual = outputText(row)
                    const expected = expectedText(row, false)
                    return (
                      <BaseTabsPanel key={sample.id} value={`sample:${sample.id}`} className="min-w-0 space-y-4 pt-4">
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-muted-foreground">Input</p>
                          <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 font-mono text-xs leading-5 text-foreground">{sample.input || '—'}</pre>
                        </div>
                        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                          {renderOutputBlock('Expected output', expected.text, expected.tone)}
                          {renderOutputBlock('Actual output', actual.text, actual.tone)}
                        </div>
                        {row && (
                          <p className="text-xs text-muted-foreground">
                            {row.status === 'ACCEPTED'
                              ? `Testcase ${index + 1} passed.`
                              : `Testcase ${index + 1}: ${verdictLabel(row.status)}.`}
                          </p>
                        )}
                      </BaseTabsPanel>
                    )
                  })}

                  {customCases.map((custom, index) => {
                    const row = customCaseResult(index)
                    const actual = outputText(row)
                    const expected = expectedText(row, true)
                    const inputId = `custom-input-${instanceId}-${custom.id}`
                    return (
                      <BaseTabsPanel key={custom.id} value={`custom:${custom.id}`} className="min-w-0 space-y-4 pt-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground" htmlFor={inputId}>
                            Input
                          </label>
                          <textarea
                            ref={(node) => {
                              if (node) inputRefs.current.set(custom.id, node)
                              else inputRefs.current.delete(custom.id)
                            }}
                            id={inputId}
                            rows={4}
                            spellCheck={false}
                            className="min-h-24 w-full resize-y rounded-md border border-control-border bg-background p-3 font-mono text-xs leading-5 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            placeholder="Enter program input"
                            value={custom.input}
                            onChange={(event) => onCustomCaseInputChange(custom.id, event.target.value)}
                          />
                        </div>
                        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                          {renderOutputBlock('Expected output', expected.text, expected.tone)}
                          {renderOutputBlock('Actual output', actual.text, actual.tone)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {row
                            ? row.status === 'ACCEPTED'
                              ? `Custom testcase ${index + 1} ran successfully.`
                              : `Custom testcase ${index + 1}: ${verdictLabel(row.status)}.`
                            : `Custom testcase ${index + 1} is sent with the next Run.`}
                        </p>
                      </BaseTabsPanel>
                    )
                  })}
                </BaseTabs>
              </BaseTabsPanel>

              <BaseTabsPanel value="result">
                {!isAuthenticated ? (
                  <p className="text-sm text-muted-foreground">Log in to run code against the judge.</p>
                ) : phase === 'idle' ? (
                  <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-center">
                    <Icon name="play" size={24} className="text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">No run yet</p>
                    <p className="text-sm text-muted-foreground">Run your code to check the sample cases, or submit to judge the full solution.</p>
                  </div>
                ) : busy && cases.length === 0 ? (
                  <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-muted-foreground">
                    <Spinner size={20} />
                    <p className="text-sm">
                      {phase === 'queued'
                        ? `Waiting for a runner${queuePosition ? ` · position ${queuePosition}` : ''}…`
                        : 'Judging your code…'}
                    </p>
                    {progress && progress.total > 0 && (
                      <p className="text-xs tabular-nums">
                        {progress.completed} / {progress.total} test cases · {progress.passed} passed
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    {(judgedCount > 0 || overallVerdict) && (
                      <p className="mb-3 text-sm text-muted-foreground">
                        {judgedCount > 0 && (
                          <>
                            {isSampleRun
                              ? `${passedCount}/${judgedCount} ${judgedCount === 1 ? 'case' : 'cases'} passed`
                              : `${passedCount}/${judgedCount} test cases passed`}
                            {' · '}
                          </>
                        )}
                        {overallVerdict && verdictLabel(overallVerdict)}
                        {summary?.failedCaseIndex != null && ` · failed on case ${summary.failedCaseIndex}`}
                      </p>
                    )}
                    <RunResultPanel
                      result={result}
                      cases={cases}
                      summary={summary}
                      failureReason={failureReason}
                      sampleTestCases={sampleTestCases}
                      submissionType={submissionType}
                    />
                  </>
                )}
              </BaseTabsPanel>
            </div>
          </ScrollArea>
        </BaseTabs>
      )}

      <div className="flex h-10 flex-none items-center justify-between gap-3 border-t border-border px-3">
        <Button variant="ghost" size="sm" className="h-8 px-2" type="button" onClick={onToggle} aria-expanded={open}>
          <Icon name={open ? 'chevronDown' : 'chevronUp'} size={16} /> Console
        </Button>
        <span className="text-xs text-muted-foreground">
          {phase === 'idle' ? 'Docker sandbox' : PHASE_LABEL[phase]}
        </span>
      </div>
    </div>
  )
}