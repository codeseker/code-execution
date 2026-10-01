import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Editor from '@monaco-editor/react'
import type { Monaco, OnMount } from '@monaco-editor/react'
import { cx } from './ui'
import { Icon } from './icons'
import CustomButton from './ui/CustomButton'

export type CodeLang = 'python' | 'js' | 'rust' | 'generic'

/* -------------------------------------------------------------------------- */
/*  Language mapping                                                          */
/* -------------------------------------------------------------------------- */

const MONACO_LANG: Record<CodeLang, string> = {
  python: 'python',
  js: 'typescript', // superset of JS, also highlights type keywords
  rust: 'rust',
  generic: 'typescript',
}

function langFor(code: string, lang?: CodeLang): CodeLang {
  if (lang) return lang
  if (/^\s*(def |class |import |from )/m.test(code) && !/[;]\s*$/.test(code)) return 'python'
  return 'js'
}

/* -------------------------------------------------------------------------- */
/*  Theme: read colours from your CSS variables, fall back to sane defaults   */
/* -------------------------------------------------------------------------- */

export const THEME = 'app-code'

type Palette = Record<
  'bg' | 'fg' | 'keyword' | 'string' | 'number' | 'comment' | 'type' | 'operator' | 'gutter' | 'selection',
  string
>

const FALLBACK_LIGHT: Palette = {
  bg: '#F7F7F8', fg: '#24292F', keyword: '#CF222E', string: '#0A3069', number: '#0550AE',
  comment: '#6E7781', type: '#8250DF', operator: '#57606A', gutter: '#8C959F', selection: '#B6D6FD',
}
const FALLBACK_DARK: Palette = {
  bg: '#0F1115', fg: '#E6EDF3', keyword: '#FF7B72', string: '#A5D6FF', number: '#79C0FF',
  comment: '#8B949E', type: '#D2A8FF', operator: '#8B949E', gutter: '#6E7681', selection: '#264F78',
}

/**
 * Tries each CSS variable name in turn (Tailwind v4 uses --color-*), converts the
 * value to #RRGGBB via a canvas, and returns `fallback` when nothing usable is found.
 */
function readColor(names: string[], fallback: string): string {
  if (typeof document === 'undefined') return fallback
  const style = getComputedStyle(document.documentElement)
  const ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return fallback
  for (const name of names) {
    let raw = style.getPropertyValue(name).trim()
    if (!raw) continue
    if (/^\d+\s+\d+\s+\d+$/.test(raw)) raw = `rgb(${raw.replace(/\s+/g, ',')})` // "12 34 56"
    ctx.fillStyle = '#000000'
    ctx.fillStyle = raw
    const out = ctx.fillStyle
    if (/^#[0-9a-f]{6}$/i.test(out)) return out
  }
  return fallback
}

function readPalette(dark: boolean): Palette {
  const fb = dark ? FALLBACK_DARK : FALLBACK_LIGHT
  const v = (key: string, fallback: string) => readColor([`--color-${key}`, `--${key}`], fallback)
  return {
    bg: v('code', fb.bg),
    fg: v('ink', fb.fg),
    keyword: v('syn-keyword', fb.keyword),
    string: v('syn-string', fb.string),
    number: v('syn-number', fb.number),
    comment: v('syn-comment', fb.comment),
    type: v('syn-type', fb.type),
    operator: v('syn-operator', fb.operator),
    gutter: v('ink-3', fb.gutter),
    selection: fb.selection,
  }
}

export function buildTheme(dark: boolean): Parameters<Monaco['editor']['defineTheme']>[1] {
  const p = readPalette(dark)
  const c = (hex: string) => hex.replace('#', '')
  return {
    base: dark ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [
      { token: '', foreground: c(p.fg) },
      { token: 'keyword', foreground: c(p.keyword) },
      { token: 'keyword.control', foreground: c(p.keyword) },
      { token: 'string', foreground: c(p.string) },
      { token: 'string.escape', foreground: c(p.string) },
      { token: 'number', foreground: c(p.number) },
      { token: 'number.float', foreground: c(p.number) },
      { token: 'number.hex', foreground: c(p.number) },
      { token: 'comment', foreground: c(p.comment), fontStyle: 'italic' },
      { token: 'type', foreground: c(p.type) },
      { token: 'type.identifier', foreground: c(p.type) },
      { token: 'delimiter', foreground: c(p.operator) },
      { token: 'operator', foreground: c(p.operator) },
    ],
    colors: {
      'editor.background': p.bg,
      'editor.foreground': p.fg,
      'editorLineNumber.foreground': p.gutter,
      'editorLineNumber.activeForeground': p.gutter,
      'editor.lineHighlightBackground': '#00000000',
      'editor.selectionBackground': p.selection,
      'editorGutter.background': p.bg,
      'scrollbarSlider.background': '#8884',
      'scrollbarSlider.hoverBackground': '#8886',
    },
  }
}

/** Follows `.dark` / `data-theme="dark"` on <html>, else the OS preference. */
export function useIsDark(): boolean {
  const read = () => {
    if (typeof document === 'undefined') return false
    const root = document.documentElement
    if (root.classList.contains('dark') || root.dataset.theme === 'dark') return true
    if (root.classList.contains('light') || root.dataset.theme === 'light') return false
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  }
  const [dark, setDark] = useState(read)
  useEffect(() => {
    const update = () => setDark(read())
    const obs = new MutationObserver(update)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] })
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    mq?.addEventListener('change', update)
    return () => {
      obs.disconnect()
      mq?.removeEventListener('change', update)
    }
  }, [])
  return dark
}

/* -------------------------------------------------------------------------- */
/*  CodeView                                                                  */
/* -------------------------------------------------------------------------- */

const LINE_HEIGHT = 22
const PAD_Y = 12
const SCROLLBAR = 8

type CodeViewProps = {
  code: string
  lang?: CodeLang
  startLine?: number
  activeLine?: number
  className?: string
  /** Hide the gutter (used inside tiny inline windows). */
  gutter?: boolean
}

/** Read-only Monaco block, auto-sized to its content. Same props as before. */
export function CodeView({
  code,
  lang,
  startLine = 1,
  activeLine,
  className,
  gutter = true,
}: CodeViewProps) {
  const resolved = langFor(code, lang)
  const text = code.replace(/\n$/, '')
  const lineCount = text.split('\n').length
  const height = lineCount * LINE_HEIGHT + PAD_Y * 2 + SCROLLBAR
  const isDark = useIsDark()

  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const decoRef = useRef<{ clear(): void } | null>(null)

  const applyActive = useCallback(() => {
    const editor = editorRef.current
    const monaco = monacoRef.current
    if (!editor || !monaco) return
    decoRef.current?.clear()
    decoRef.current = null
    if (activeLine == null) return
    const rel = activeLine - startLine + 1
    if (rel < 1 || rel > lineCount) return
    decoRef.current = editor.createDecorationsCollection([
      {
        range: new monaco.Range(rel, 1, rel, 1),
        options: { isWholeLine: true, className: 'code-active-line' },
      },
    ])
  }, [activeLine, startLine, lineCount])

  useEffect(applyActive, [applyActive])

  // Re-theme when the app switches light/dark (setTheme is global in Monaco).
  useEffect(() => {
    const monaco = monacoRef.current
    if (!monaco) return
    monaco.editor.defineTheme(THEME, buildTheme(isDark))
    monaco.editor.setTheme(THEME)
  }, [isDark])

  return (
    <div className={cx('overflow-hidden bg-code', className)} style={{ height }}>
      <Editor
        height={height}
        width="100%"
        language={MONACO_LANG[resolved]}
        value={text}
        theme={THEME}
        loading={<div style={{ height }} />}
        beforeMount={(monaco) => {
          monacoRef.current = monaco
          monaco.editor.defineTheme(THEME, buildTheme(isDark))
        }}
        onMount={(editor, monaco) => {
          editorRef.current = editor
          monacoRef.current = monaco
          monaco.editor.setTheme(THEME)
          applyActive()
        }}
        options={{
          readOnly: true,
          domReadOnly: true,
          automaticLayout: true,

          fontFamily: 'ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace',
          fontSize: 13,
          lineHeight: LINE_HEIGHT,
          fontLigatures: false,
          padding: { top: PAD_Y, bottom: PAD_Y },

          lineNumbers: gutter ? (n: number) => String(startLine + n - 1) : 'off',
          lineNumbersMinChars: 3,
          lineDecorationsWidth: gutter ? 12 : 16,
          glyphMargin: false,
          folding: false,

          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'off',
          scrollbar: {
            vertical: 'hidden',
            horizontal: 'auto',
            horizontalScrollbarSize: SCROLLBAR,
            alwaysConsumeMouseWheel: false, // let the page scroll over the editor
            useShadows: false,
          },
          overviewRulerLanes: 0,
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,

          renderLineHighlight: 'none',
          occurrencesHighlight: 'off',
          selectionHighlight: false,
          matchBrackets: 'never',
          bracketPairColorization: { enabled: false },
          guides: { indentation: false },
          renderValidationDecorations: 'off', // no red squiggles on snippets
          hover: { enabled: "off" },
          links: false,
          contextmenu: false,
          stickyScroll: { enabled: false },
          renderWhitespace: 'none',
        }}
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  CodeWindow (unchanged API)                                                */
/* -------------------------------------------------------------------------- */

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
          <CustomButton variant="unstyled"
            type="button"
            className="btn btn-ghost btn-sm h-6 gap-1 px-1.5 text-[12px] opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            onClick={copy}
            aria-label="Copy code"
          >
            <Icon name={copied ? 'check' : 'copy'} size={12} />
            {copied ? 'Copied' : 'Copy'}
          </CustomButton>
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
