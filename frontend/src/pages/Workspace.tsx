import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/icons'
import { CodeEditor, monacoLanguageFor } from '../components/CodeEditor'
import { Spinner, ThemeToggle } from '../components/ui'
import { EngineStatusBar } from '../components/shell'
import { Button } from '../components/ui/button'
import { BaseTabs, BaseTabsList, BaseTabsPanel, BaseTabsTrigger } from '../components/BaseTabs'
import { BaseSelect } from '../components/BaseSelect'
import { BaseTooltip } from '../components/BaseTooltip'
import { PanelSurface } from '../components/PanelSurface'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../components/Resizable'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'
import { Switch } from '@base-ui/react/switch'
import { Popover } from '@base-ui/react/popover'
import { EmptyState } from '../components/ui'
import ProblemDescription from '../components/workspace/ProblemDescription'
import RunConsole from '../components/workspace/RunConsole'
import WorkspaceSubmissionsTab from '../components/workspace/WorkspaceSubmissionsTab'
import usePublicProblemDetail from '../hooks/problems/public/usePublicProblemDetail'
import usePublicProblems from '../hooks/problems/public/usePublicProblems'
import { useExampleEval, useRun, useSubmit } from '../hooks/submissions/useSubmitMutations'
import useActiveSubmission from '../hooks/submissions/useActiveSubmission'
import { useMySubmissions } from '../hooks/submissions/useSubmissions'
import useToggleBookmark from '../hooks/lists/useToggleBookmark'
import { LANGUAGES, type Language } from '../types/domain'
import { languageLabel } from '../lib/format'
import { useAuthStore } from '../stores/auth'
import { errorToast } from '../toast'

const TABS = ['Description', 'Submissions'] as const
type Tab = (typeof TABS)[number]

/** Default editor language when the problem ships no template for it. */
const FALLBACK_LANGUAGE: Language = 'python'

function isLanguage(value: string): value is Language {
  return (LANGUAGES as readonly string[]).includes(value)
}

export default function Workspace() {
  const { id: slug } = useParams()
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.auth.isAuthenticated)

  const { problem, loading, notFound, error, refetch } = usePublicProblemDetail(slug)

  const [tab, setTab] = useState<Tab>('Description')
  const [language, setLanguage] = useState<Language>(FALLBACK_LANGUAGE)
  const [code, setCode] = useState('')
  const [customInput, setCustomInput] = useState('')
  const [pane, setPane] = useState<'problem' | 'code' | 'console'>('problem')
  const [consoleOpen, setConsoleOpen] = useState(true)
  const [autoComplete, setAutoComplete] = useState(true)
  const [fontSize, setFontSize] = useState(13)
  const [tabSize, setTabSize] = useState(4)
  const [cursorPosition, setCursorPosition] = useState({ lineNumber: 1, column: 1 })
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null)
  const [queuePosition, setQueuePosition] = useState<number | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const availableLanguages = useMemo<Language[]>(() => {
    if (!problem) return []
    const fromTemplates = Object.keys(problem.languageTemplates).filter(isLanguage)
    return fromTemplates.length > 0 ? fromTemplates : [...LANGUAGES]
  }, [problem])

  // Seed the editor from the server template whenever the problem or the
  // selected language changes.
  useEffect(() => {
    if (!problem) return
    setTab('Description')
    setActiveSubmissionId(null)
    setQueuePosition(null)
    setCustomInput(problem.sampleTestCases[0]?.input ?? '')
  }, [problem])

  useEffect(() => {
    if (!problem) return
    const preferred = problem.languageTemplates[language]
    setCode(preferred ?? '')
  }, [problem, language])

  const run = useRun()
  const submit = useSubmit()
  const exampleEval = useExampleEval()

  const { problems: catalogue } = usePublicProblems({ page: 1, limit: 100 })
  const neighbours = useMemo(() => catalogue.filter((item) => item.slug !== slug), [catalogue, slug])

  const goTo = useCallback(
    (delta: number) => {
      if (neighbours.length === 0) return
      const currentIndex = neighbours.findIndex((item) => item.slug === slug)
      const next = neighbours[(Math.max(currentIndex, 0) + delta + neighbours.length) % neighbours.length]
      navigate(`/problems/${next.slug}`)
    },
    [neighbours, slug, navigate],
  )

  const guardAuth = useCallback((): boolean => {
    if (isAuthenticated) return true
    errorToast('Log in to run code against the judge.')
    return false
  }, [isAuthenticated])

  const queueRun = useCallback(
    async (mode: 'run' | 'submit' | 'sample') => {
      if (!problem) return
      setQueuePosition(null)
      try {
        const ack =
          mode === 'run'
            ? await run.run(problem.id, { code, language, input: customInput || null })
            : mode === 'sample'
              ? await exampleEval.exampleEval(problem.id, { code, language })
              : await submit.submit(problem.id, { code, language })
        setActiveSubmissionId(ack.submissionId)
        setQueuePosition(ack.queuePosition)
      } catch {
        // The mutation hooks already surfaced the backend message.
      }
    },
    [problem, run, submit, exampleEval, code, language, customInput],
  )

  const onRun = useCallback(() => {
    if (guardAuth()) void queueRun('run')
  }, [guardAuth, queueRun])

  const onSubmit = useCallback(() => {
    if (guardAuth()) void queueRun('submit')
  }, [guardAuth, queueRun])

  const onRunSamples = useCallback(() => {
    if (guardAuth()) void queueRun('sample')
  }, [guardAuth, queueRun])

  const { submissions, loading: submissionsLoading, refetch: refetchSubmissions } = useMySubmissions(
    useMemo(() => ({ problemId: problem?.id, limit: 10 }), [problem?.id]),
    { enabled: Boolean(problem) && isAuthenticated },
  )

  const active = useActiveSubmission(activeSubmissionId)

  // A finished job moves the user's history and stats, so refresh both.
  useEffect(() => {
    if (active.terminal) {
      void refetchSubmissions()
    }
  }, [active.terminal, refetchSubmissions])

  const { isBookmarked, available: bookmarksAvailable, toggle } = useToggleBookmark()

  // ⌘↵ runs, ⌘⇧↵ submits. Monaco forwards its own copy while focused; this
  // listener covers the rest of the page.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault()
        if (event.shiftKey) onSubmit()
        else onRun()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onRun, onSubmit])

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-background">
        <Spinner size={24} className="text-muted-foreground" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-background">
        <EmptyState
          icon="search"
          title="Problem not found"
          hint="This problem may have been renamed, archived or removed from the catalogue."
          action={
            <Button type="button" onClick={() => navigate('/problems')}>
              Back to problems
            </Button>
          }
        />
      </div>
    )
  }

  if (!problem || error) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-background">
        <EmptyState
          icon="alert"
          title="We could not load this problem"
          hint="The catalogue service did not respond. Please try again."
          action={
            <Button type="button" variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        />
      </div>
    )
  }

  const problemPane = (
    <BaseTabs value={tab} onValueChange={(value) => setTab(value as Tab)} className="flex h-full min-h-0 flex-col">
      <div className="flex h-11 flex-none items-center gap-2 border-b border-border bg-muted/40 px-3">
        <BaseTabsList className="h-full min-w-0 flex-1 justify-start gap-1 overflow-x-auto">
          <BaseTabsTrigger value="Description" className="h-full flex-none px-2.5">
            <Icon name="file" size={16} />
            Description
          </BaseTabsTrigger>
          <BaseTabsTrigger value="Submissions" className="h-full flex-none px-2.5">
            <Icon name="history" size={16} />
            Submissions
            {submissions.length > 0 && (
              <Badge variant="secondary" className="px-1.5 py-0 text-xs tabular-nums">{submissions.length}</Badge>
            )}
          </BaseTabsTrigger>
        </BaseTabsList>
        <Separator orientation="vertical" className="h-5" />
        <div className="flex shrink-0 items-center gap-1">
          {bookmarksAvailable && (
            <BaseTooltip content={isBookmarked(problem.id) ? 'Remove bookmark' : 'Bookmark problem'}>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label={isBookmarked(problem.id) ? 'Remove bookmark' : 'Bookmark problem'}
                aria-pressed={isBookmarked(problem.id)}
                onClick={() => void toggle(problem.id)}
              >
                <Icon name="bookmark" size={16} className={isBookmarked(problem.id) ? 'fill-current text-primary' : undefined} />
              </Button>
            </BaseTooltip>
          )}
          <BaseTooltip content="Copy problem link">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Copy problem link"
              onClick={() => void navigator.clipboard?.writeText(window.location.href)}
            >
              <Icon name="share" size={16} />
            </Button>
          </BaseTooltip>
        </div>
      </div>

      <div className="min-h-0 grow overflow-y-auto">
        <div className="px-4 pb-8 pt-5 sm:px-6">
          {tab === 'Description' ? (
            <ProblemDescription problem={problem} />
          ) : (
            <WorkspaceSubmissionsTab
              submissions={submissions}
              loading={submissionsLoading}
              isAuthenticated={isAuthenticated}
              problemId={problem.id}
              problemSlug={problem.slug}
            />
          )}
        </div>
      </div>
    </BaseTabs>
  )

  const editorPane = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-11 flex-none items-center gap-2 overflow-x-auto border-b border-border bg-muted/40 px-3">
        <BaseSelect
          value={language}
          onValueChange={(value) => {
            if (isLanguage(value)) setLanguage(value)
          }}
          ariaLabel="Editor language"
          className="h-8 min-w-32"
          options={availableLanguages.map((item) => ({ value: item, label: languageLabel(item) }))}
        />
        <Separator orientation="vertical" className="h-5" />
        <label className="inline-flex shrink-0 items-center gap-2 text-sm text-muted-foreground" htmlFor="editor-autocomplete">
          <Switch.Root
            id="editor-autocomplete"
            checked={autoComplete}
            onCheckedChange={setAutoComplete}
            className="relative inline-flex h-5 w-9 items-center rounded-full bg-input transition-colors data-[checked]:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Switch.Thumb className="block size-4 translate-x-0.5 rounded-full bg-background shadow-sm transition-transform data-[checked]:translate-x-4" />
          </Switch.Root>
          Auto-complete
        </label>
        <span className="grow" />
        <Popover.Root open={settingsOpen} onOpenChange={setSettingsOpen}>
          <BaseTooltip content="Editor settings">
            <Popover.Trigger
              render={<Button variant="ghost" size="icon" className="size-8" aria-label="Editor settings" />}
            >
              <Icon name="settings" size={16} />
            </Popover.Trigger>
          </BaseTooltip>
          <Popover.Portal>
            <Popover.Positioner side="bottom" align="end" sideOffset={6} className="z-50">
              <Popover.Popup className="w-64 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-md">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="editor-font-size">Font size</label>
                    <input
                      id="editor-font-size"
                      type="range"
                      min={11}
                      max={18}
                      value={fontSize}
                      onChange={(event) => setFontSize(Number(event.target.value))}
                      className="w-full accent-primary"
                    />
                    <p className="text-xs text-muted-foreground">{fontSize}px</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Indent size</label>
                    <div className="flex gap-2">
                      {[2, 4, 8].map((size) => (
                        <Button
                          key={size}
                          type="button"
                          size="sm"
                          variant={tabSize === size ? 'default' : 'outline'}
                          aria-pressed={tabSize === size}
                          onClick={() => setTabSize(size)}
                        >
                          {size} spaces
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </div>

      <CodeEditor
        className="grow"
        value={code}
        onChange={setCode}
        language={monacoLanguageFor(language)}
        onRun={onRun}
        onSubmit={onSubmit}
        autoComplete={autoComplete}
        fontSize={fontSize}
        tabSize={tabSize}
        onCursorPositionChange={setCursorPosition}
      />
    </div>
  )

  const consoleView = (
    <RunConsole
      open={consoleOpen}
      onToggle={() => setConsoleOpen((value) => !value)}
      sampleTestCases={problem.sampleTestCases}
      phase={active.phase}
      result={active.result}
      failureReason={active.failureReason}
      progress={active.progress}
      queuePosition={queuePosition}
      customInput={customInput}
      onCustomInputChange={setCustomInput}
      onRunSamples={onRunSamples}
      isAuthenticated={isAuthenticated}
    />
  )

  return (
    <>
      <header className="flex h-14 items-center gap-2 border-b border-border bg-background px-3 sm:gap-3 sm:px-4">
        <Button variant="ghost" size="icon" className="size-8 shrink-0" type="button" aria-label="Back to problems" onClick={() => navigate('/problems')}>
          <Icon name="codeXml" size={19} />
        </Button>
        <div className="hidden min-w-0 items-center gap-3 sm:flex">
          <span className="text-sm font-semibold text-foreground">{problem.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-8" type="button" aria-label="Previous problem" onClick={() => goTo(-1)}>
            <Icon name="chevronLeft" size={17} />
          </Button>
          <Button variant="ghost" size="icon" className="size-8" type="button" aria-label="Next problem" onClick={() => goTo(1)}>
            <Icon name="chevronRight" size={17} />
          </Button>
        </div>
        <span className="grow" />
        <div className="flex items-center gap-1.5">
          <BaseTooltip content="Run against your own input (⌘↵)">
            <Button variant="ghost" size="icon" className="size-8" type="button" disabled={active.busy} onClick={onRun}>
              <Icon name="play" size={16} />
            </Button>
          </BaseTooltip>
          <BaseTooltip content="Judge every test case (⌘⇧↵)">
            <Button size="sm" type="button" className="h-8" disabled={active.busy} onClick={onSubmit}>
              <Icon name="upload" size={15} />
              <span className="hidden sm:inline">Submit</span>
            </Button>
          </BaseTooltip>
        </div>
        <span className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden="true" />
        <ThemeToggle className="size-8" />
      </header>

      <main className="flex h-[calc(100dvh-3.5rem)] min-h-0 flex-col overflow-hidden bg-background">
        <div className="hidden min-h-0 grow p-2 lg:flex">
          <ResizablePanelGroup orientation="horizontal" autoSaveId="codeforge-workspace-columns-v2" defaultLayout={{ problem: 36, right: 64 }} className="flex min-h-0 grow gap-2">
            <ResizablePanel id="problem" defaultSize="36%" minSize="30%">
              <PanelSurface className="h-full">{problemPane}</PanelSurface>
            </ResizablePanel>
            <ResizableHandle withHandle aria-label="Resize problem and editor panels" />
            <ResizablePanel id="right" defaultSize="64%" minSize="35%">
              <ResizablePanelGroup orientation="vertical" autoSaveId="codeforge-workspace-editor-console-v2" defaultLayout={{ editor: 54, console: 46 }} className="h-full min-h-0 gap-2">
                <ResizablePanel id="editor" defaultSize="54%" minSize="34%">
                  <PanelSurface className="h-full">{editorPane}</PanelSurface>
                </ResizablePanel>
                <ResizableHandle withHandle aria-label="Resize editor and console panels" />
                <ResizablePanel id="console" defaultSize="46%" minSize="18%" collapsible collapsedSize="8%">
                  <PanelSurface className="h-full">{consoleView}</PanelSurface>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        <div className="flex min-h-0 grow flex-col gap-2 p-2 lg:hidden">
          <BaseTabs value={pane} onValueChange={(value) => setPane(value as typeof pane)} className="flex min-h-0 grow flex-col gap-2">
            <BaseTabsList className="h-11 shrink-0 rounded-lg bg-muted/40 p-1">
              <BaseTabsTrigger value="problem" className="h-9 flex-1">Problem</BaseTabsTrigger>
              <BaseTabsTrigger value="code" className="h-9 flex-1">Code</BaseTabsTrigger>
              <BaseTabsTrigger value="console" className="h-9 flex-1">Console</BaseTabsTrigger>
            </BaseTabsList>
            <BaseTabsPanel value="problem" className="min-h-0 grow">
              <PanelSurface className="h-full">{problemPane}</PanelSurface>
            </BaseTabsPanel>
            <BaseTabsPanel value="code" className="min-h-0 grow">
              <div className="flex h-full min-h-0 flex-col gap-2">
                <PanelSurface className="min-h-0 grow">{editorPane}</PanelSurface>
                <PanelSurface className="h-[40%] min-h-48 shrink-0">{consoleView}</PanelSurface>
              </div>
            </BaseTabsPanel>
            <BaseTabsPanel value="console" className="min-h-0 grow">
              <PanelSurface className="h-full">{consoleView}</PanelSurface>
            </BaseTabsPanel>
          </BaseTabs>
        </div>

        <EngineStatusBar cursorPosition={cursorPosition} tabSize={tabSize} />
      </main>
    </>
  )
}