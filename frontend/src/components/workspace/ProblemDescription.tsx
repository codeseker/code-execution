import type { ReactNode } from 'react'
import { Icon, type IconName } from '../icons'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { DifficultyBadge } from '../ui'
import { TestcaseExample } from '../TestcaseBlock'
import MarkdownRenderer from '../markdown/MarkdownRenderer'
import { formatMemoryLimit, formatPercent, formatTimeLimit } from '../../lib/format'
import type { PublicProblemDetail, SampleTestCase } from '../../hooks/problems/types'

type Props = {
  problem: PublicProblemDetail
  acceptanceRate?: number | null
  /** Hands a sample to the workspace so it can become a custom testcase. */
  onUseAsCustomInput?: (sample: SampleTestCase) => void
}

/** One titled block of the statement; sections stack with a shared rhythm. */
function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="min-w-0 space-y-3" aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`} className="border-b border-border pb-2 text-base font-semibold text-foreground">
        {title}
      </h2>
      {children}
    </section>
  )
}

/** "time limit per test: 2 seconds" / "memory limit per test: 250 MB". */
function Limit({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon name={icon} size={13} />
      {children}
    </span>
  )
}

/**
 * `GET /problems/{slug}` statement view, laid out the way competitive
 * programming sites present a problem: title, metadata, then the story, the
 * input/output formats, the constraints, the numbered examples and the notes.
 *
 * <p>Everything except the examples is markdown authored by the problem setter
 * and rendered through {@link MarkdownRenderer}; the examples are judge data,
 * so they stay in {@link TestcaseExample} blocks with copy buttons.
 */
export default function ProblemDescription({ problem, acceptanceRate, onUseAsCustomInput }: Props) {
  const { sampleTestCases } = problem

  return (
    <article className="mx-auto flex max-w-190 flex-col gap-7">
      <header className="space-y-3">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{problem.title}</h1>
        {problem.description && (
          <MarkdownRenderer className="leading-6">{problem.description}</MarkdownRenderer>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyBadge difficulty={problem.difficulty} />
          {problem.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
          {acceptanceRate != null && (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon name="activity" size={16} />
              Acceptance {formatPercent(acceptanceRate)}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
          <Limit icon="timer">time limit per test: {formatTimeLimit(problem.timeLimitMs)}</Limit>
          <Limit icon="database">memory limit per test: {formatMemoryLimit(problem.memoryLimitKb)}</Limit>
        </div>
      </header>

      {problem.statement && (
        <Section id="statement" title="Problem statement">
          <MarkdownRenderer>{problem.statement}</MarkdownRenderer>
        </Section>
      )}

      {problem.inputFormat && (
        <Section id="input" title="Input">
          <MarkdownRenderer>{problem.inputFormat}</MarkdownRenderer>
        </Section>
      )}

      {problem.outputFormat && (
        <Section id="output" title="Output">
          <MarkdownRenderer>{problem.outputFormat}</MarkdownRenderer>
        </Section>
      )}

      {problem.constraints.length > 0 && (
        <Section id="constraints" title="Constraints">
          <ul className="list-disc space-y-1.5 pl-5 marker:text-muted-foreground/60">
            {problem.constraints.map((constraint, index) => (
              <li key={`${index}-${constraint}`}>
                <MarkdownRenderer>{constraint}</MarkdownRenderer>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {sampleTestCases.length > 0 && (
        <Section id="examples" title="Examples">
          <div className="space-y-3">
            {sampleTestCases.map((sample, index) => (
              <TestcaseExample
                key={sample.id}
                index={index + 1}
                input={sample.input}
                output={sample.output}
                explanation={sample.explanation}
                showLineNumbers
                inputActions={
                  onUseAsCustomInput ? (
                    null
                    // <Button
                    //   type="button"
                    //   variant="ghost"
                    //   size="xs"
                    //   className="h-5 gap-1 px-1.5 text-xs text-muted-foreground"
                    //   aria-label={`Use Example ${index + 1} input as a custom testcase`}
                    //   onClick={() => onUseAsCustomInput(sample)}
                    // >
                    //   <Icon name="terminal" size={12} />
                    //   <span className="hidden sm:inline">Use as custom input</span>
                    // </Button>
                  ) : undefined
                }
              />
            ))}
          </div>
        </Section>
      )}

      {problem.notes && (
        <Section id="notes" title="Notes">
          <MarkdownRenderer>{problem.notes}</MarkdownRenderer>
        </Section>
      )}
    </article>
  )
}