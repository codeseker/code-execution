import { useEffect, useRef, useState } from 'react'
import { Icon } from './icons'
import { Button } from './ui/button'
import { BaseTooltip } from './BaseTooltip'
import { cx } from './ui'

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

const COPY_RESET_MS = 2000

/** One labelled, copyable, whitespace-preserving value block. */
export function TestcaseBlock({
  value,
  label,
  placeholder = '—',
  tone = 'default',
  hideLabel = false,
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
      {!hideLabel && label && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
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
      )}
      <pre
        className={cx(
          'overflow-auto rounded-lg border border-border/70 p-3 font-mono text-xs leading-5',
          'whitespace-pre-wrap break-words [overflow-wrap:anywhere]',
          maxHeightClassName,
          TONE_CLASS[tone],
          !hasValue && 'italic opacity-70',
        )}
      >
        {hasValue ? text : placeholder}
      </pre>
    </div>
  )
}

export type TestcaseExampleProps = {
  /** 1-based position, rendered as "Example N". */
  index: number
  input: string | null | undefined
  output: string | null | undefined
  className?: string
}

/**
 * One numbered sample case: an "Input" block above an "Output" block, both
 * rendered through {@link TestcaseBlock}. Sample cases ship with their real
 * text, so this is the shared formatter that makes {@code "2\n3"} show up as
 * two lines.
 */
export function TestcaseExample({ index, input, output, className }: TestcaseExampleProps) {
  return (
    <section
      className={cx('space-y-2 rounded-lg border border-border bg-card p-3', className)}
      aria-label={`Example ${index}`}
    >
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Example {index}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <TestcaseBlock label="Input" value={input} placeholder="No input provided" />
        <TestcaseBlock label="Output" value={output} placeholder="No output provided" />
      </div>
    </section>
  )
}

export default TestcaseBlock