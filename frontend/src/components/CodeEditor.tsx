import { useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import type { Monaco, OnMount } from '@monaco-editor/react'
import { cx } from './ui'
// Shares the exact same theme as CodeView / CodeWindow.
import { THEME, buildTheme, useIsDark } from './Code'

/** Maps a display name from your LANGUAGES list ("Python3", "C++", …) to a Monaco language id. */
const LANGUAGE_IDS: Record<string, string> = {
  python: 'python',
  javascript: 'javascript',
  // `cpp` is the backend `Language` enum name; `c++` is the UI label.
  cpp: 'cpp',
  typescript: 'typescript',
  rust: 'rust',
  'c++': 'cpp',
  c: 'c',
  'c#': 'csharp',
  java: 'java',
  go: 'go',
  golang: 'go',
  kotlin: 'kotlin',
  swift: 'swift',
  ruby: 'ruby',
  php: 'php',
  scala: 'scala',
  dart: 'dart',
  sql: 'sql',
  mysql: 'mysql',
  bash: 'shell',
}

export function monacoLanguageFor(name: string): string {
  const key = name.toLowerCase().trim().replace(/\d+$/, '') // "Python3" -> "python"
  return LANGUAGE_IDS[key] ?? 'plaintext'
}

type CodeEditorProps = {
  value: string
  onChange: (value: string) => void
  /** Monaco language id — use monacoLanguageFor(name). */
  language?: string
  className?: string
  /** ⌘/Ctrl + Enter while the editor is focused. */
  onRun?: () => void
  /** ⌘/Ctrl + Shift + Enter while the editor is focused. */
  onSubmit?: () => void
  fontSize?: number
  tabSize?: number
  autoComplete?: boolean
  onCursorPositionChange?: (position: { lineNumber: number; column: number }) => void
  readOnly?: boolean
}

/** Editable Monaco editor that fills its parent (give the parent a definite height, e.g. flex grow + min-h-0). */
export function CodeEditor({
  value,
  onChange,
  language = 'python',
  className,
  onRun,
  onSubmit,
  fontSize = 13,
  tabSize = 4,
  autoComplete = true,
  onCursorPositionChange,
  readOnly = false,
}: CodeEditorProps) {
  const isDark = useIsDark()
  const monacoRef = useRef<Monaco | null>(null)
  const cursorListenerRef = useRef<{ dispose: () => void } | null>(null)

  // Keep the latest callbacks without re-registering Monaco commands.
  const runRef = useRef(onRun)
  const submitRef = useRef(onSubmit)
  const cursorRef = useRef(onCursorPositionChange)
  runRef.current = onRun
  submitRef.current = onSubmit
  cursorRef.current = onCursorPositionChange

  useEffect(() => {
    const monaco = monacoRef.current
    if (!monaco) return
    monaco.editor.defineTheme(THEME, buildTheme(isDark))
    monaco.editor.setTheme(THEME)
  }, [isDark])

  useEffect(() => () => cursorListenerRef.current?.dispose(), [])

  const beforeMount = (monaco: Monaco) => {
    monacoRef.current = monaco
    monaco.editor.defineTheme(THEME, buildTheme(isDark))

    // Practice snippets reference things Monaco can't resolve (LeetCode-style globals),
    // so keep syntax errors but turn off semantic "cannot find name" noise.
    // API location differs across monaco-editor versions, hence the loose lookup.
    const ts = (monaco.languages as any).typescript ?? (monaco as any).typescript
    for (const defaults of [ts?.javascriptDefaults, ts?.typescriptDefaults]) {
      defaults?.setDiagnosticsOptions?.({ noSemanticValidation: true, noSyntaxValidation: false })
    }
  }

  const onMount: OnMount = (editor, monaco) => {
    monacoRef.current = monaco
    monaco.editor.setTheme(THEME)
    cursorListenerRef.current?.dispose()
    cursorListenerRef.current = editor.onDidChangeCursorPosition(({ position }) => {
      cursorRef.current?.({ lineNumber: position.lineNumber, column: position.column })
    })
    const position = editor.getPosition()
    if (position) cursorRef.current?.({ lineNumber: position.lineNumber, column: position.column })

    // Monaco swallows ⌘↵ (insert line below), so the window-level listener never sees it.
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runRef.current?.())
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter,
      () => submitRef.current?.(),
    )
  }

  const fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim()

  return (
    <div className={cx('relative min-h-0 overflow-hidden bg-card', className)}>
      <Editor
        height="100%"
        width="100%"
        language={language}
        value={value}
        theme={THEME}
        beforeMount={beforeMount}
        onMount={onMount}
        onChange={(v) => onChange(v ?? '')}
        loading={<div className="h-full w-full animate-pulse bg-muted" />}
        options={{
          readOnly,
          ariaLabel: 'Code editor',
          automaticLayout: true,

          fontFamily,
          fontSize,
          lineHeight: 22,
          fontLigatures: false,
          padding: { top: 12, bottom: 12 },
          tabSize,
          insertSpaces: true,
          detectIndentation: false,

          lineNumbers: 'on',
          lineNumbersMinChars: 3,
          lineDecorationsWidth: 12,
          glyphMargin: false,
          folding: false,

          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'off',
          scrollbar: { useShadows: false, verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
          overviewRulerLanes: 0,
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,

          renderLineHighlight: 'line',
          matchBrackets: 'always',
          bracketPairColorization: { enabled: true },
          guides: { indentation: true },
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          formatOnPaste: false,
          quickSuggestions: { other: autoComplete, comments: false, strings: false },
          suggestOnTriggerCharacters: autoComplete,
          parameterHints: { enabled: autoComplete },
          stickyScroll: { enabled: false },
          contextmenu: true,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
        }}
      />
    </div>
  )
}