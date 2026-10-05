import { Children, isValidElement, type ReactElement, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { Icon } from '../icons'
import { Button } from '../ui/button'
import { cx } from '../ui'
import 'katex/dist/katex.min.css'

/**
 * GitHub-flavoured markdown for problem statements.
 *
 * <p>Statements, input/output formats and notes arrive as markdown from the
 * backend, so they are rendered here once and styled with the app's own theme
 * tokens rather than with a prose plugin's CSS. Raw HTML is not enabled, so
 * untrusted statement content can never inject markup; `remark-math` +
 * `rehype-katex` add inline/display math, and `rehype-katex` falls back to a
 * readable error span when a formula does not parse.
 *
 * <p>Code fences get a language class, a copy button and a horizontal scroll
 * instead of wrapping, because sample IO and snippets are meant to be read
 * exactly as written.
 */

type Props = {
  children: string
  className?: string
}

/** Flattens a fenced block's children back to its literal source text. */
function codeSource(children: ReactNode): string {
  if (typeof children === 'string') return children
  if (Array.isArray(children)) return children.map(codeSource).join('')
  if (isValidElement(children)) return codeSource((children as ReactElement<{ children?: ReactNode }>).props.children)
  return ''
}

const LANGUAGE = /language-([\w+-]+)/

/** Fenced code block: language chip, copy button, no wrapping. */
function CodeBlock({ code, language }: { code: string; language: string | null }) {
  return (
    <div className="group/code relative overflow-hidden rounded-lg border border-border bg-muted">
      <div className="flex h-7 items-center gap-2 border-b border-border/70 px-2">
        <span className="font-mono text-[0.6875rem] tracking-wide text-muted-foreground uppercase">
          {language ?? 'code'}
        </span>
        <span className="grow" />
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="size-5 opacity-100 sm:opacity-0 sm:group-hover/code:opacity-100 sm:focus-visible:opacity-100"
          aria-label="Copy code"
          onClick={() => void navigator.clipboard?.writeText(code).catch(() => undefined)}
        >
          <Icon name="copy" size={11} />
        </Button>
      </div>
      <pre className="overflow-x-auto p-3">
        <code className="font-mono text-xs leading-5 text-foreground">{code}</code>
      </pre>
    </div>
  )
}

const components: Components = {
  h1: ({ children }) => <h1 className="text-lg font-semibold text-foreground">{children}</h1>,
  h2: ({ children }) => <h2 className="text-lg font-semibold text-foreground">{children}</h2>,
  h3: ({ children }) => <h3 className="text-base font-semibold text-foreground">{children}</h3>,
  h4: ({ children }) => <h4 className="text-base font-semibold text-foreground">{children}</h4>,
  h5: ({ children }) => <h5 className="text-sm font-semibold text-foreground">{children}</h5>,
  h6: ({ children }) => <h6 className="text-sm font-semibold text-muted-foreground">{children}</h6>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="text-primary underline underline-offset-4 hover:opacity-80"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="list-disc space-y-1 pl-5 marker:text-muted-foreground/60">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5 marker:text-muted-foreground/60">{children}</ol>,
  li: ({ children }) => <li className="[&>ul]:my-1 [&>ol]:my-1">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-border pl-3 text-muted-foreground italic">{children}</blockquote>
  ),
  hr: () => <hr className="border-border" />,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => <del className="line-through">{children}</del>,
  code: ({ children }) => (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.8125em] text-foreground break-words">
      {children}
    </code>
  ),
  pre: ({ children }) => {
    const element = Children.toArray(children).find(isValidElement) as ReactElement<{
      className?: string
      children?: ReactNode
    }> | undefined
    const source = codeSource(element?.props.children).replace(/\n$/, '')
    return <CodeBlock code={source} language={LANGUAGE.exec(element?.props.className ?? '')?.[1] ?? null} />
  },
  table: ({ children }) => (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
  th: ({ children }) => <th className="border-b border-border px-3 py-2 text-left font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-b border-border/60 px-3 py-2 align-top last:border-b-0">{children}</td>,
  img: ({ src, alt }) => (
    <img
      src={typeof src === 'string' ? src : undefined}
      alt={alt ?? ''}
      className="max-w-full rounded-lg border border-border"
    />
  ),
  input: (props) => <input {...props} readOnly className="mr-1.5 size-3.5 accent-primary align-middle" />,
}

export default function MarkdownRenderer({ children, className }: Props) {
  return (
    <div className={cx('space-y-4 text-sm leading-7 text-muted-foreground [&_p+p]:mt-4', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
