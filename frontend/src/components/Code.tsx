import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Editor from '@monaco-editor/react'
import type { Monaco, OnMount } from '@monaco-editor/react'
import { cx } from './ui'
import { Icon } from './icons'
import CustomButton from './CustomButton'

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
/*  Theme                                                                      */
/* -------------------------------------------------------------------------- */

export const THEME = 'app-code'

export function buildTheme(dark: boolean): Parameters<Monaco['editor']['defineTheme']>[1] {
  if (!dark) {
    return { base: 'vs', inherit: true, rules: [], colors: {} }
  }

  return {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'f8f8f2' },
      { token: 'keyword', foreground: 'ff79c6' },
      { token: 'keyword.control', foreground: 'ff79c6' },
      { token: 'keyword.operator', foreground: 'ff79c6' },
      { token: 'storage', foreground: 'ff79c6' },
      { token: 'storage.type', foreground: '8be9fd' },
      { token: 'string', foreground: 'f1fa8c' },
      { token: 'string.escape', foreground: 'ffb86c' },
      { token: 'number', foreground: 'bd93f9' },
      { token: 'number.float', foreground: 'bd93f9' },
      { token: 'number.hex', foreground: 'bd93f9' },
      { token: 'constant', foreground: 'bd93f9' },
      { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
      { token: 'type', foreground: '8be9fd' },
      { token: 'type.identifier', foreground: '8be9fd' },
      { token: 'entity.name.type', foreground: '8be9fd' },
      { token: 'support.type', foreground: '8be9fd' },
      { token: 'entity.name.function', foreground: '50fa7b' },
      { token: 'support.function', foreground: '50fa7b' },
      { token: 'delimiter', foreground: 'f8f8f2' },
      { token: 'operator', foreground: 'ff79c6' },
    ],
    colors: {
      'editor.background': '#282a36',
      'editor.foreground': '#f8f8f2',
      'editorLineNumber.foreground': '#6272a4',
      'editorLineNumber.activeForeground': '#f8f8f2',
      'editor.lineHighlightBackground': '#44475a66',
      'editor.selectionBackground': '#44475a',
      'editor.inactiveSelectionBackground': '#44475a88',
      'editorCursor.foreground': '#f8f8f0',
      'editorGutter.background': '#282a36',
      'scrollbarSlider.background': '#6272a466',
      'scrollbarSlider.hoverBackground': '#6272a4aa',
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
    <div className={cx('overflow-hidden bg-muted/50', className)} style={{ height }}>
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
      <div className="flex h-9 items-center gap-3 border-b border-border px-3">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-destructive" />
          <span className="size-2.5 rounded-full bg-secondary" />
          <span className="size-2.5 rounded-full bg-primary" />
        </span>
        {title && (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-0.5 text-xs text-secondary-foreground font-mono text-[11px] font-medium tracking-[0.02em]">
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
        <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-2 text-muted-foreground">
          {footer}
        </div>
      )}
    </div>
  )
}
