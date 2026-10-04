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

function themeColor(token: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim()
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return value

  context.clearRect(0, 0, 1, 1)
  context.fillStyle = value
  context.fillRect(0, 0, 1, 1)
  const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data
  const channels = [red, green, blue, alpha].map((channel) => channel.toString(16).padStart(2, '0'))
  return `#${channels.join('')}`
}

export function buildTheme(dark: boolean): Parameters<Monaco['editor']['defineTheme']>[1] {
  return {
    base: dark ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [
      { token: '', foreground: themeColor('--foreground') },
      { token: 'keyword', foreground: themeColor('--syntax-keyword') },
      { token: 'keyword.control', foreground: themeColor('--syntax-keyword') },
      { token: 'keyword.operator', foreground: themeColor('--syntax-keyword') },
      { token: 'storage', foreground: themeColor('--syntax-keyword') },
      { token: 'storage.type', foreground: themeColor('--syntax-type') },
      { token: 'string', foreground: themeColor('--syntax-string') },
      { token: 'string.escape', foreground: themeColor('--syntax-function') },
      { token: 'number', foreground: themeColor('--syntax-number') },
      { token: 'number.float', foreground: themeColor('--syntax-number') },
      { token: 'number.hex', foreground: themeColor('--syntax-number') },
      { token: 'constant', foreground: themeColor('--syntax-number') },
      { token: 'comment', foreground: themeColor('--syntax-comment'), fontStyle: 'italic' },
      { token: 'type', foreground: themeColor('--syntax-type') },
      { token: 'type.identifier', foreground: themeColor('--syntax-type') },
      { token: 'entity.name.type', foreground: themeColor('--syntax-type') },
      { token: 'support.type', foreground: themeColor('--syntax-type') },
      { token: 'entity.name.function', foreground: themeColor('--syntax-function') },
      { token: 'support.function', foreground: themeColor('--syntax-function') },
      { token: 'delimiter', foreground: themeColor('--foreground') },
      { token: 'operator', foreground: themeColor('--syntax-operator') },
    ],
    colors: {
      'editor.background': themeColor('--editor-background'),
      'editor.foreground': themeColor('--foreground'),
      'editorLineNumber.foreground': themeColor('--muted-foreground'),
      'editorLineNumber.activeForeground': themeColor('--foreground'),
      'editor.lineHighlightBackground': themeColor('--editor-line-highlight'),
      'editor.selectionBackground': themeColor('--editor-selection'),
      'editor.inactiveSelectionBackground': themeColor('--editor-selection'),
      'editorCursor.foreground': themeColor('--ring'),
      'editorGutter.background': themeColor('--editor-gutter'),
      'scrollbarSlider.background': themeColor('--editor-scrollbar-thumb'),
      'scrollbarSlider.hoverBackground': themeColor('--foreground'),
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
  const fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim()

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
    <div className={cx('min-w-0 overflow-hidden bg-editor-background', className)}>
      <Editor
        height={height}
        width="100%"
        language={MONACO_LANG[resolved]}
        value={text}
        theme={THEME}
        loading={<div className="h-full w-full animate-pulse bg-editor-background" />}
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

          fontFamily,
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
            horizontalScrollbarSize: 7,
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
    <div className={cx('code-window min-w-0 max-w-full overflow-hidden', className)}>
      <div className="flex h-9 items-center gap-3 border-b border-border px-3">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-destructive" />
          <span className="size-2.5 rounded-full bg-secondary" />
          <span className="size-2.5 rounded-full bg-primary" />
        </span>
        {title && (
          <span className="inline-flex min-w-0 max-w-full truncate items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-0.5 font-mono text-xs font-medium tracking-wide text-secondary-foreground">
            {title}
          </span>
        )}
        <span className="grow" />
        {headerRight && <span className="hidden min-w-0 items-center gap-2 sm:flex">{headerRight}</span>}
        {copyable && (
          <CustomButton variant="unstyled"
            type="button"
            className="btn btn-ghost btn-sm hidden h-6 gap-1 px-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 sm:inline-flex"
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
