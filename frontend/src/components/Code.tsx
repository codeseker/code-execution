import { useState } from 'react'
import type { ReactNode } from 'react'
import { cx } from './ui'
import { Icon } from './icons'

export type CodeLang = 'python' | 'js' | 'rust' | 'generic'

const KEYWORDS: Record<CodeLang, Set<string>> = {
  python: new Set([
    'class', 'def', 'return', 'if', 'elif', 'else', 'for', 'while', 'in', 'not', 'and', 'or',
    'import', 'from', 'as', 'with', 'try', 'except', 'finally', 'raise', 'pass', 'lambda',
    'yield', 'None', 'True', 'False', 'self', 'async', 'await', 'global', 'nonlocal', 'assert',
  ]),
  js: new Set([
    'function', 'return', 'if', 'else', 'for', 'while', 'const', 'let', 'var', 'new', 'class',
    'extends', 'import', 'from', 'export', 'default', 'async', 'await', 'try', 'catch', 'finally',
    'throw', 'typeof', 'instanceof', 'interface', 'type', 'enum', 'public', 'private', 'readonly',
    'null', 'undefined', 'true', 'false', 'this', 'super', 'delete', 'in', 'of', 'void', 'number',
    'string', 'boolean', 'any', 'void', 'never', 'as',
  ]),
  rust: new Set([
    'fn', 'let', 'mut', 'pub', 'impl', 'struct', 'enum', 'trait', 'match', 'if', 'else', 'for',
    'while', 'loop', 'in', 'return', 'use', 'mod', 'crate', 'self', 'Self', 'super', 'where',
    'async', 'await', 'move', 'ref', 'dyn', 'unsafe', 'const', 'static', 'type', 'true', 'false',
    'Some', 'None', 'Ok', 'Err', 'Result', 'Option', 'Vec', 'Box',
  ]),
  generic: new Set(['function', 'return', 'if', 'else', 'for', 'while', 'const', 'let', 'var', 'new', 'class', 'import', 'export', 'true', 'false', 'null', 'void', 'public', 'private', 'static']),
}

type Tok = { text: string; cls?: string }

const TOK_CLS = {
  keyword: 'text-syn-keyword',
  string: 'text-syn-string',
  number: 'text-syn-number',
  comment: 'text-syn-comment',
  function: 'text-syn-function',
  type: 'text-syn-type',
  operator: 'text-syn-operator',
} as const

function langFor(code: string, lang?: CodeLang): CodeLang {
  if (lang) return lang
  if (/^\s*(def |class |import |from )/m.test(code) && !/[;]\s*$/.test(code)) return 'python'
  return 'js'
}

/** Small state-machine lexer — comments never swallow strings, and vice versa. */
export function tokenizeLine(line: string, lang: CodeLang): Tok[] {
  const kws = KEYWORDS[lang]
  const out: Tok[] = []
  const push = (text: string, cls?: string) => {
    const last = out[out.length - 1]
    if (last && last.cls === cls && !cls) last.text += text
    else out.push({ text, cls })
  }

  let i = 0
  while (i < line.length) {
    const ch = line[i]
    const rest = line.slice(i)

    // Comments
    if ((ch === '#' && lang === 'python') || rest.startsWith('//')) {
      push(rest, TOK_CLS.comment)
      break
    }
    // Strings
    if (ch === '"' || ch === "'") {
      let j = i + 1
      while (j < line.length && line[j] !== ch) {
        if (line[j] === '\\') j++
        j++
      }
      push(line.slice(i, Math.min(j + 1, line.length)), TOK_CLS.string)
      i = j + 1
      continue
    }
    // Numbers
    if (/[0-9]/.test(ch)) {
      let j = i
      while (j < line.length && /[0-9._xb]/.test(line[j])) j++
      push(line.slice(i, j), TOK_CLS.number)
      i = j
      continue
    }
    // Identifiers
    if (/[A-Za-z_$@]/.test(ch)) {
      let j = i
      while (j < line.length && /[\w$]/.test(line[j])) j++
      const word = line.slice(i, j)
      const after = line.slice(j).match(/^\s*\(/)
      let cls: string | undefined
      if (kws.has(word)) cls = TOK_CLS.keyword
      else if (after) cls = TOK_CLS.function
      else if (/^[A-Z]/.test(word)) cls = TOK_CLS.type
      push(word, cls)
      i = j
      continue
    }
    // Whitespace stays plain; punctuation gets the operator tone.
    if (/\s/.test(ch)) {
      push(ch)
      i++
      continue
    }
    push(ch, TOK_CLS.operator)
    i++
  }
  return out
}

type CodeViewProps = {
  code: string
  lang?: CodeLang
  startLine?: number
  activeLine?: number
  className?: string
  /** Hide the gutter (used inside tiny inline windows). */
  gutter?: boolean
}

/** Line-numbered, highlighted code block (bg-code, no inner border). */
export function CodeView({
  code,
  lang,
  startLine = 1,
  activeLine,
  className,
  gutter = true,
}: CodeViewProps) {
  const resolved = langFor(code, lang)
  const lines = code.replace(/\n$/, '').split('\n')
  return (
    <div className={cx('t-code flex overflow-x-auto', className)}>
      {gutter && (
        <div
          className="sticky left-0 shrink-0 select-none bg-code py-3 pr-3 pl-4 text-right text-ink-3 tnum"
          aria-hidden
        >
          {lines.map((_, idx) => (
            <div key={idx} className="leading-[22px]">
              {startLine + idx}
            </div>
          ))}
        </div>
      )}
      <div className="min-w-0 grow py-3 pr-4">
        {lines.map((line, idx) => {
          const active = activeLine === startLine + idx
          const toks = tokenizeLine(line, resolved)
          return (
            <div
              key={idx}
              className={cx('whitespace-pre leading-[22px]', active && 'bg-wash')}
            >
              {toks.length === 0 ? (
                ' '
              ) : (
                toks.map((t, tIdx) => (
                  <span key={tIdx} className={t.cls}>
                    {t.text}
                  </span>
                ))
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

type CodeWindowProps = {
  /** Tab label, e.g. "Solution.ts". */
  title?: string
  /** Chips on the right of the header, e.g. language / status. */
  headerRight?: ReactNode
  /** Footer row, e.g. memory + runtime readouts. */
  footer?: ReactNode
  code: string
  lang?: CodeLang
  activeLine?: number
  className?: string
  copyable?: boolean
}

/** Chrome-wrapped window: traffic lights, tab, optional status chips + footer. */
export function CodeWindow({
  title,
  headerRight,
  footer,
  code,
  lang,
  activeLine,
  className,
  copyable = true,
}: CodeWindowProps) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(code).catch(() => undefined)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className={cx('code-window', className)}>
      <div className="flex h-9 items-center gap-3 border-b border-hair px-3">
        <span className="flex gap-1.5" aria-hidden>
          <span className="traffic bg-[#FF5F57]" />
          <span className="traffic bg-[#FEBC2E]" />
          <span className="traffic bg-[#28C840]" />
        </span>
        {title && (
          <span className="tag tag-gray font-mono text-[11px] font-medium tracking-[0.02em]">
            {title}
          </span>
        )}
        <span className="grow" />
        {headerRight}
        {copyable && (
          <button
            type="button"
            className="btn btn-ghost btn-sm h-6 gap-1 px-1.5 text-[12px] opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            onClick={copy}
            aria-label="Copy code"
          >
            <Icon name={copied ? 'check' : 'copy'} size={12} />
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
      <div className="group">
        <CodeView code={code} lang={lang} activeLine={activeLine} />
      </div>
      {footer && (
        <div className="flex items-center justify-between gap-4 border-t border-hair px-4 py-2 text-ink-2">
          {footer}
        </div>
      )}
    </div>
  )
}
