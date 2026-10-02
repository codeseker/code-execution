import { Icon } from '../icons'
import { Badge } from '../ui/badge'
import { DifficultyBadge } from '../ui'
import { formatKb, formatMs, formatPercent } from '../../lib/format'
import type { PublicProblemDetail } from '../../hooks/problems/types'

type Props = {
  problem: PublicProblemDetail
  acceptanceRate?: number | null
}

/** Renders the light markdown used in statements: **bold** and `code`. */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return <code key={index} className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">{part.slice(1, -1)}</code>
        }
        return <span key={index}>{part}</span>
      })}
    </>
  )
}

/**
 * `GET /problems/{slug}` statement view. The backend ships the statement as one
 * markdown blob plus the public sample cases, so the split into paragraphs,
 * examples and constraints happens here rather than on the server.
 */
export default function ProblemDescription({ problem, acceptanceRate }: Props) {
  const paragraphs = problem.problemStatement.split(/\n{2,}/).filter(Boolean)
  const constraints = paragraphs.filter((block) => /^constraints/im.test(block))

  return (
    <article className="mx-auto flex max-w-[760px] flex-col gap-6">
      <header className="space-y-3">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{problem.title}</h1>
        {problem.description && (
          <p className="text-sm leading-6 text-muted-foreground">{problem.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyBadge difficulty={problem.difficulty} />
          {problem.tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
          <Badge variant="outline" className="gap-1.5">
            <Icon name="timer" size={12} />
            {formatMs(problem.defaultTimeLimitMs)}
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <Icon name="database" size={12} />
            {formatKb(problem.defaultMemoryLimitKb)}
          </Badge>
          {acceptanceRate != null && (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon name="activity" size={16} />
              Acceptance {formatPercent(acceptanceRate)}
            </span>
          )}
        </div>
      </header>

      <div className="space-y-4">
        {paragraphs.map((paragraph, index) =>
          constraints.includes(paragraph) ? null : (
            <p key={index} className="text-sm leading-7 text-muted-foreground">
              <RichText text={paragraph} />
            </p>
          ),
        )}
      </div>

      {problem.sampleTestCases.length > 0 && (
        <section className="space-y-3" aria-labelledby="examples-heading">
          <h2 id="examples-heading" className="text-sm font-semibold text-foreground">Examples</h2>
          {problem.sampleTestCases.map((sample, index) => (
            <div key={sample.id} className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Example {index + 1}</p>
              <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-3 font-mono text-sm">
                <p><span className="text-muted-foreground">Input</span><span className="text-foreground">: {sample.input}</span></p>
                <p><span className="text-muted-foreground">Output</span><span className="text-foreground">: {sample.output}</span></p>
              </div>
            </div>
          ))}
        </section>
      )}

      {constraints.length > 0 && (
        <section className="space-y-3" aria-labelledby="constraints-heading">
          <h2 id="constraints-heading" className="text-sm font-semibold text-foreground">Constraints</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
            {constraints.map((block) => (
              <li key={block}>
                <code className="font-mono text-foreground">{block.replace(/^constraints:?/i, '').trim()}</code>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}