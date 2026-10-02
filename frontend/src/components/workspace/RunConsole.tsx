import { useEffect, useState } from 'react'
import { Icon } from '../icons'
import { Spinner } from '../ui'
import { BaseTabs, BaseTabsList, BaseTabsPanel, BaseTabsTrigger } from '../BaseTabs'
import { ScrollArea } from '../ui/scroll-area'
import { Button } from '../ui/button'
import RunResultPanel from './RunResultPanel'
import type { SampleTestCase } from '../../hooks/problems/types'
import type { RunPhase, RunProgress } from '../../hooks/submissions/useActiveSubmission'
import type { SubmissionResult } from '../../hooks/submissions/types'

type Props = {
  open: boolean
  onToggle: () => void
  sampleTestCases: SampleTestCase[]
  phase: RunPhase
  result: SubmissionResult | null
  failureReason: string | null
  progress: RunProgress | null
  queuePosition: number | null
  /** Seeds the stdin box from a sample case. */
  customInput: string
  onCustomInputChange: (value: string) => void
  /** `POST /problems/{id}/example-eval` - judges the public samples. */
  onRunSamples: () => void
  isAuthenticated: boolean
}

const PHASE_LABEL: Record<RunPhase, string> = {
  idle: 'Ready',
  queued: 'Queued',
  processing: 'Running',
  completed: 'Judged',
  failed: 'Failed',
}

/**
 * Console pane: the caller-supplied stdin for `POST /problems/{id}/run` and
 * the verdict for whichever job is active. Sample cases from the problem
 * detail only prefill the stdin box - the judge itself reads them for
 * `example-eval`.
 */
export default function RunConsole({
  open,
  onToggle,
  sampleTestCases,
  phase,
  result,
  failureReason,
  progress,
  queuePosition,
  customInput,
  onCustomInputChange,
  onRunSamples,
  isAuthenticated,
}: Props) {
  const [view, setView] = useState<'input' | 'result'>('input')
  const busy = phase === 'queued' || phase === 'processing'

  // Jump to the result as soon as a job is in flight or finished.
  useEffect(() => {
    if (phase !== 'idle') setView('result')
  }, [phase])

  return (
    <div className="flex h-full min-h-0 flex-col">
      {open && (
        <BaseTabs value={view} onValueChange={(value) => setView(value as 'input' | 'result')} className="flex min-h-0 grow flex-col">
          <div className="flex h-11 flex-none items-center gap-2 border-b border-border bg-muted/40 px-3">
            <BaseTabsList className="h-full gap-1">
              <BaseTabsTrigger value="input" className="h-full px-2.5">
                <Icon name="list" size={16} /> Input
              </BaseTabsTrigger>
              <BaseTabsTrigger value="result" className="h-full px-2.5">
                <Icon name="terminal" size={16} /> Result
                {busy && <Spinner size={12} className="text-muted-foreground" />}
              </BaseTabsTrigger>
            </BaseTabsList>
            <span className="grow" />
            <span className="font-mono text-xs text-muted-foreground">{PHASE_LABEL[phase]}</span>
          </div>

          <ScrollArea className="min-h-0 grow">
            <div className="space-y-4 p-4 pb-8">
              <BaseTabsPanel value="input" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground" htmlFor="custom-input">
                    Custom input (stdin)
                  </label>
                  <textarea
                    id="custom-input"
                    rows={8}
                    spellCheck={false}
                    className="w-full resize-y rounded-md border border-border bg-background p-3 font-mono text-sm text-foreground"
                    placeholder={
                      sampleTestCases[0]?.input
                        ? `Defaults to sample case 1:\n${sampleTestCases[0].input}`
                        : 'Program input, passed through verbatim'
                    }
                    value={customInput}
                    onChange={(event) => onCustomInputChange(event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Used by the <span className="font-medium text-foreground">Run</span> button. Nothing is compared and no
                    stats change.
                  </p>
                </div>

                {sampleTestCases.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Samples · judged by the example evaluation</p>
                    <div className="flex flex-wrap gap-2">
                      {sampleTestCases.map((sample, index) => (
                        <Button
                          key={sample.id}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => onCustomInputChange(sample.input)}
                        >
                          <Icon name="copy" size={13} />
                          Case {index + 1}
                        </Button>
                      ))}
                      <Button type="button" size="sm" className="h-8" disabled={busy || !isAuthenticated} onClick={onRunSamples}>
                        <Icon name="play" size={13} />
                        Run samples
                      </Button>
                    </div>
                  </div>
                )}
              </BaseTabsPanel>

              <BaseTabsPanel value="result">
                {!isAuthenticated ? (
                  <p className="text-sm text-muted-foreground">Log in to run code against the judge.</p>
                ) : phase === 'idle' ? (
                  <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-center">
                    <Icon name="play" size={24} className="text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">No run yet</p>
                    <p className="text-sm text-muted-foreground">
                      Press Run for a custom input, or Submit to judge every test case.
                    </p>
                  </div>
                ) : busy ? (
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
                  <RunResultPanel result={result} failureReason={failureReason} />
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