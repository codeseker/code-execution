import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon } from './icons'
import { Button } from './ui/button'
import { BaseTooltip } from './BaseTooltip'
import { cx } from './ui'
import MarkdownRenderer from './markdown/MarkdownRenderer'

/**
 * Renders one judge value (a sample input, an expected output, an actual
 * output, a stderr dump) as a themed, copyable monospace block.
 *
 * <p>Test case text reaches the browser in two shapes and both have to read
 * as real lines:
 *
 * <ul>
 *   <li>an already decoded string with genuine newlines (the common case - the
 *       API reads the file from disk and JSON round-trips it);</li>
 *   <li>a string whose newlines are still the two characters {@code \} and
 *       {@code n}, because the text was written into the fixture as a single
 *       line, e.g. {@code "2\n3"}.</li>
 * </ul>
 *
 * {@link formatTestcaseText} normalises both (plus {@code \r\n} and a trailing
 * newline) so every value is shown exactly as the judge read it.
 */

const ESCAPED_NEWLINE = /\\r\\n|\\n|\\r/g

/** Escaped sequences first, then real CRLF/CR, then a trailing newline. */
export function formatTestcaseText(value: string | null | undefined): string {
  if (value === null || value === undefined) return ''
  return value
    .replace(ESCAPED_NEWLINE, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n+$/, '')
}

export type TestcaseBlockProps = {
  /** Raw value as delivered by the API; escape sequences are expanded. */
  value: string | null | undefined
  /** Field label, e.g. "Input" or "Expected Output". */
  label?: string
  /** Shown when the value is missing/empty; also used for the aria-label. */
  placeholder?: string
  tone?: 'default' | 'muted' | 'destructive' | 'success'
  /** Hides the label row when the parent already provides the heading. */
  hideLabel?: boolean
  /** Extra controls rendered in the label row, next to the copy button. */
  actions?: ReactNode
  /**
   * Renders a line-number gutter and stops the text from wrapping, so every
   * logical line stays on its own row (the Codeforces sample look).
   */
  showLineNumbers?: boolean
  /** Caps the visible height; the block scrolls beyond it. */
  maxHeightClassName?: string
  className?: string
}

const TONE_CLASS: Record<NonNullable<TestcaseBlockProps['tone']>, string> = {
  default: 'bg-muted/50 text-foreground',
  muted: 'bg-muted/50 text-muted-foreground',
  destructive: 'bg-destructive/10 text-destructive',
  success: 'bg-muted/50 text-foreground',
}

/** Shared chrome of both block shapes; overflow is set per branch. */
const SURFACE_CLASS = 'min-w-0 rounded-lg border border-border/70'

const COPY_RESET_MS = 2000

/** Faint, non-selectable line numbers aligned with the un-wrapped text. */
function LineNumbers({ count }: { count: number }) {
  return (
    <span
      aria-hidden="true"
      className="sticky left-0 flex shrink-0 flex-col border-r border-border/60 bg-muted px-2 py-3 text-right font-mono text-xs leading-5 text-muted-foreground/50 tabular-nums select-none"
    >
      {Array.from({ length: count }, (_, index) => (
        <span key={index}>{index + 1}</span>
      ))}
    </span>
  )
}

/** One labelled, copyable, whitespace-preserving value block. */
export function TestcaseBlock({
  value,
  label,
  placeholder = '—',
  tone = 'default',
  hideLabel = false,
  actions,
  showLineNumbers = false,
  maxHeightClassName = 'max-h-48',
  className,
}: TestcaseBlockProps) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<number | undefined>(undefined)
  const text = formatTestcaseText(value)
  const hasValue = text.length > 0

  useEffect(() => () => window.clearTimeout(timeoutRef.current), [])

  const copy = () => {
    void navigator.clipboard?.writeText(text).catch(() => undefined)
    setCopied(true)
    window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => setCopied(false), COPY_RESET_MS)
  }

  return (
    <div className={cx('min-w-0 space-y-1.5', className)}>
      {!hideLabel && (label || actions) && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <div className="flex items-center gap-1">
            {actions}
            <BaseTooltip content={copied ? 'Copied' : `Copy ${label?.toLowerCase() ?? 'value'}`}>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Copy ${label?.toLowerCase() ?? 'value'}`}
                disabled={!hasValue}
                onClick={copy}
              >
                <Icon name={copied ? 'check' : 'copy'} size={12} />
              </Button>
            </BaseTooltip>
          </div>
        </div>
      )}
      {showLineNumbers && hasValue ? (
        <div className={cx(SURFACE_CLASS, 'flex overflow-auto', TONE_CLASS[tone], maxHeightClassName)}>
          <LineNumbers count={text.split('\n').length} />
          <pre className="grow px-3 py-3 font-mono text-xs leading-5 whitespace-pre">{text}</pre>
        </div>
      ) : (
        <pre
          className={cx(
            SURFACE_CLASS,
            'overflow-auto p-3 font-mono text-xs leading-5',
            'whitespace-pre-wrap break-words [overflow-wrap:anywhere]',
            maxHeightClassName,
            TONE_CLASS[tone],
            !hasValue && 'italic opacity-70',
          )}
        >
          {hasValue ? text : placeholder}
        </pre>
      )}
    </div>
  )
}

export type TestcaseExampleProps = {
  /** 1-based position, rendered as "Example N". */
  index: number
  input: string | null | undefined
  output: string | null | undefined
  /** Markdown note explaining the sample; omitted when empty. */
  explanation?: string | null
  /** Line-numbered, un-wrapped IO blocks (the Codeforces sample look). */
  showLineNumbers?: boolean
  /** Offered on the input block; e.g. "Use as custom input". */
  inputActions?: ReactNode
  className?: string
}

/**
 * One numbered sample case: an "Input" block beside an "Output" block, both
 * rendered through {@link TestcaseBlock}, plus the seter's explanation when the
 * sample ships one. Sample cases ship with their real text, so this is the
 * shared formatter that makes {@code "2\n3"} show up as two lines.
 */
export function TestcaseExample({
  index,
  input,
  output,
  explanation,
  showLineNumbers = false,
  inputActions,
  className,
}: TestcaseExampleProps) {
  return (
    <section
      className={cx('space-y-3 rounded-lg border border-border bg-card p-3 sm:p-4', className)}
      aria-label={`Example ${index}`}
    >
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Example {index}
      </p>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        <TestcaseBlock
          label="Input"
          value={input}
          placeholder="No input provided"
          actions={inputActions}
          showLineNumbers={showLineNumbers}
          maxHeightClassName="max-h-64"
        />
        <TestcaseBlock
          label="Output"
          value={output}
          placeholder="No output provided"
          showLineNumbers={showLineNumbers}
          maxHeightClassName="max-h-64"
        />
      </div>
      {explanation && (
        <div className="space-y-1.5 border-t border-border pt-3">
          <p className="text-xs font-medium text-muted-foreground">Explanation</p>
          <MarkdownRenderer className="text-xs leading-6">{explanation}</MarkdownRenderer>
        </div>
      )}
    </section>
  )
}

export default TestcaseBlock