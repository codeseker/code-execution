import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/icons'
import { CodeEditor, monacoLanguageFor } from '../components/CodeEditor'
import { DifficultyBadge, Spinner, ThemeToggle } from '../components/ui'
import { EngineStatusBar } from '../components/shell'
import {
  LANGUAGES,
  PROBLEMS,
  STARTER_CODES,
  TWO_SUM_PY,
  TWO_SUM_SUBMISSIONS,
  problemById,
} from '../data'
import type { Problem, Submission } from '../data'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { BaseTabs, BaseTabsList, BaseTabsPanel, BaseTabsTrigger } from '../components/BaseTabs'
import { BaseSelect } from '../components/BaseSelect'
import { BaseTooltip } from '../components/BaseTooltip'
import { PanelSurface } from '../components/PanelSurface'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../components/Resizable'
import { StatusBadge } from '../components/ui'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'
import { ScrollArea } from '../components/ui/scroll-area'
import { Switch } from '@base-ui/react/switch'
import { Popover } from '@base-ui/react/popover'
import { Collapsible } from '@base-ui/react/collapsible'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog'

const TABS = ['Description', 'Submissions', 'Solutions', 'Editorial'] as const
type Tab = (typeof TABS)[number]

type RunResult = {
  mode: 'run' | 'submit'
  passed: number
  total: number
}

export default function Workspace() {
  const { id } = useParams()
  const navigate = useNavigate()
  const problem = problemById(id ?? '') ?? PROBLEMS[0]
  const index = PROBLEMS.findIndex((item) => item.id === problem.id)

  const [tab, setTab] = useState<Tab>('Description')
  const [lang, setLang] = useState('Python3')
  const [code, setCode] = useState(
    problem.id === 'two-sum' ? TWO_SUM_PY : STARTER_CODES['Python3'],
  )
  const [pane, setPane] = useState<'problem' | 'code' | 'console'>('problem')
  const [consoleOpen, setConsoleOpen] = useState(true)
  const [autoComplete, setAutoComplete] = useState(true)
  const [fontSize, setFontSize] = useState(13)
  const [tabSize, setTabSize] = useState(4)
  const [cursorPosition, setCursorPosition] = useState({ lineNumber: 1, column: 1 })
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<RunResult | null>(null)

  const submissions: Submission[] = useMemo(
    () => (problem.id === 'two-sum' ? TWO_SUM_SUBMISSIONS : []),
    [problem.id],
  )

  // Reset pane state when switching problems.
  useEffect(() => {
    setTab('Description')
    setCode(problem.id === 'two-sum' ? TWO_SUM_PY : STARTER_CODES[lang] ?? STARTER_CODES['Python3'])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem.id])

  const changeLanguage = (name: string) => {
    setLang(name)
    setCode(STARTER_CODES[name] ?? '')
  }

  const goTo = (delta: number) => {
    const next = PROBLEMS[(index + delta + PROBLEMS.length) % PROBLEMS.length]
    navigate(`/problems/${next.id}`)
  }

  // Simulated execution: run individual cases or submit the whole suite.
  const run = () => {
    if (running) return
    setRunning(true)
    window.setTimeout(() => {
      setRunning(false)
      setResult({ mode: 'run', passed: 3, total: 3 })
    }, 650)
  }

  const submit = () => {
    if (running) return
    setRunning(true)
    window.setTimeout(() => {
      setRunning(false)
      setResult({ mode: 'submit', passed: 57, total: 57 })
      // push({
      //   title: 'Accepted — 57 / 57 test cases',
      //   description: 'Runtime 38 ms · beats 94.2% · +25 XP',
      //   tone: 'success',
      // })
    }, 950)
  }

  // ⌘↵ runs, ⌘⇧↵ submits (design.md keyboard model).
  // While the editor is focused these are handled by Monaco commands inside <CodeEditor>;
  // this listener covers the rest of the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        if (e.shiftKey) submit()
        else run()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  return (
    <>
      <header className="flex h-14 items-center gap-2 border-b border-border bg-background px-3 sm:gap-3 sm:px-4">
        <Button variant="ghost" size="icon" className="size-8 shrink-0" type="button" aria-label="Back to problems" onClick={() => navigate('/problems')}>
          <Icon name="codeXml" size={19} />
        </Button>
        <div className="hidden min-w-0 items-center gap-3 sm:flex">
          <span className="text-sm font-semibold text-foreground">Daily Question</span>
          <span className="max-w-56 truncate text-sm text-muted-foreground">{problem.num}. {problem.title}</span>
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
          <Button variant="ghost" size="icon" className="size-8" type="button" aria-label="Run code" onClick={run}>
            <Icon name="play" size={16} />
          </Button>
          <Button size="sm" type="button" className="h-8" onClick={submit}>
            <Icon name="upload" size={15} />
            <span className="hidden sm:inline">Submit</span>
          </Button>
        </div>
        <span className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden="true" />
        <ThemeToggle className="size-8" />
      </header>
      <main className="flex h-[calc(100dvh-3.5rem)] min-h-0 flex-col overflow-hidden bg-background">
        <div className="hidden min-h-0 grow p-2 lg:flex">
          <ResizablePanelGroup orientation="horizontal" autoSaveId="codeforge-workspace-columns-v2" defaultLayout={{ problem: 36, right: 64 }} className="flex min-h-0 grow gap-2">
            <ResizablePanel id="problem" defaultSize="36%" minSize="30%">
              <PanelSurface className="h-full"><ProblemPane problem={problem} tab={tab} setTab={setTab} submissions={submissions} /></PanelSurface>
            </ResizablePanel>
            <ResizableHandle withHandle aria-label="Resize problem and editor panels" />
            <ResizablePanel id="right" defaultSize="64%" minSize="35%">
              <ResizablePanelGroup orientation="vertical" autoSaveId="codeforge-workspace-editor-console-v2" defaultLayout={{ editor: 54, console: 46 }} className="h-full min-h-0 gap-2">
                <ResizablePanel id="editor" defaultSize="54%" minSize="34%">
                  <PanelSurface className="h-full">
                    <EditorPane lang={lang} code={code} onCode={setCode} onLanguage={changeLanguage} onRun={run} onSubmit={submit} autoComplete={autoComplete} onAutoComplete={setAutoComplete} fontSize={fontSize} onFontSize={setFontSize} tabSize={tabSize} onTabSize={setTabSize} onCursorPositionChange={setCursorPosition} />
                  </PanelSurface>
                </ResizablePanel>
                <ResizableHandle withHandle aria-label="Resize editor and console panels" />
                <ResizablePanel id="console" defaultSize="46%" minSize="18%" collapsible collapsedSize="8%">
                  <PanelSurface className="h-full"><ConsolePane open={consoleOpen} onToggle={() => setConsoleOpen((value) => !value)} running={running} result={result} /></PanelSurface>
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
            <BaseTabsPanel value="problem" className="min-h-0 grow"><PanelSurface className="h-full"><ProblemPane problem={problem} tab={tab} setTab={setTab} submissions={submissions} /></PanelSurface></BaseTabsPanel>
            <BaseTabsPanel value="code" className="min-h-0 grow">
              <div className="flex h-full min-h-0 flex-col gap-2">
                <PanelSurface className="min-h-0 grow"><EditorPane lang={lang} code={code} onCode={setCode} onLanguage={changeLanguage} onRun={run} onSubmit={submit} autoComplete={autoComplete} onAutoComplete={setAutoComplete} fontSize={fontSize} onFontSize={setFontSize} tabSize={tabSize} onTabSize={setTabSize} onCursorPositionChange={setCursorPosition} /></PanelSurface>
                <PanelSurface className="h-[40%] min-h-48 shrink-0"><ConsolePane open={consoleOpen} onToggle={() => setConsoleOpen((value) => !value)} running={running} result={result} /></PanelSurface>
              </div>
            </BaseTabsPanel>
            <BaseTabsPanel value="console" className="min-h-0 grow"><PanelSurface className="h-full"><ConsolePane open onToggle={() => setPane('code')} running={running} result={result} /></PanelSurface></BaseTabsPanel>
          </BaseTabs>
        </div>

        <EngineStatusBar cursorPosition={cursorPosition} tabSize={tabSize} />
      </main>
    </>
  )
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

function ProblemPane({
  problem,
  tab,
  setTab,
  submissions,
}: {
  problem: Problem
  tab: Tab
  setTab: (t: Tab) => void
  submissions: Submission[]
}) {
  const [saved, setSaved] = useState(false)

  const tabIcon: Record<Tab, Parameters<typeof Icon>[0]['name']> = {
    Description: 'file',
    Submissions: 'history',
    Solutions: 'bulb',
    Editorial: 'book',
  }

  const compactCount = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 })

  return (
    <BaseTabs value={tab} onValueChange={(value) => setTab(value as Tab)} className="flex h-full min-h-0 flex-col">
      <div className="flex h-11 flex-none items-center gap-2 border-b border-border bg-muted/40 px-3">
        <BaseTabsList className="h-full min-w-0 flex-1 justify-start gap-1 overflow-x-auto">
          {TABS.map((item) => (
            <BaseTabsTrigger key={item} value={item} className="h-full flex-none px-2.5">
              <Icon name={tabIcon[item]} size={16} />
              {item}
              {item === 'Submissions' && submissions.length > 0 && (
                <Badge variant="secondary" className="px-1.5 py-0 text-xs">{compactCount.format(submissions.length)}</Badge>
              )}
            </BaseTabsTrigger>
          ))}
        </BaseTabsList>
        <Separator orientation="vertical" className="h-5" />
        <div className="flex shrink-0 items-center gap-1">
          <BaseTooltip content={saved ? 'Remove bookmark' : 'Bookmark problem'}>
            <Button variant="ghost" size="icon" className="size-8" aria-label={saved ? 'Remove bookmark' : 'Bookmark problem'} aria-pressed={saved} onClick={() => setSaved((value) => !value)}>
              <Icon name="bookmark" size={16} />
            </Button>
          </BaseTooltip>
          <BaseTooltip content="Copy problem link">
            <Button variant="ghost" size="icon" className="size-8" aria-label="Copy problem link" onClick={() => void navigator.clipboard?.writeText(window.location.href)}>
              <Icon name="share" size={16} />
            </Button>
          </BaseTooltip>
        </div>
      </div>
      <ScrollArea className="min-h-0 grow">
        <div className="px-4 pb-8 pt-5 sm:px-6">
          {tab === 'Description' && <Description problem={problem} />}
          {tab === 'Submissions' && <SubmissionsTab problem={problem} submissions={submissions} />}
          {tab === 'Solutions' && <SolutionsTab />}
          {tab === 'Editorial' && <EditorialTab problem={problem} />}
        </div>
      </ScrollArea>
    </BaseTabs>
  )
}

function Description({ problem }: { problem: Problem }) {
  const d = problem.detail!
  const similar = PROBLEMS.filter((candidate) => candidate.id !== problem.id && candidate.tags.some((tag) => problem.tags.includes(tag))).slice(0, 3)
  return (
    <article className="mx-auto flex max-w-[760px] flex-col gap-6">
      <header className="space-y-3">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {problem.num}. {problem.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyBadge difficulty={problem.difficulty} />
          {problem.tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
          <BaseTooltip content={<span className="block max-w-56">{problem.companies.join(', ')}</span>}>
            <Button variant="outline" size="sm" className="h-7 gap-2 text-xs" aria-label={`Companies: ${problem.companies.join(', ')}`}>
              <Icon name="building" size={16} />
              {problem.companies.length} companies
            </Button>
          </BaseTooltip>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon name="activity" size={16} />
            Acceptance {problem.acceptance}%
          </span>
        </div>
      </header>

      <Separator />

      <div className="space-y-4">
        {d.paragraphs.map((paragraph, i) => (
          <p key={i} className="text-sm leading-7 text-muted-foreground">
            <RichText text={paragraph} />
          </p>
        ))}
      </div>

      <section className="space-y-3" aria-labelledby="examples-heading">
        <h2 id="examples-heading" className="text-sm font-semibold text-foreground">Examples</h2>
        {d.examples.map((example, i) => (
          <div key={i} className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Example {i + 1}</p>
            <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-3 font-mono text-sm">
              <p><span className="text-muted-foreground">Input</span><span className="text-foreground">: {example.input}</span></p>
              <p><span className="text-muted-foreground">Output</span><span className="text-foreground">: {example.output}</span></p>
              {example.notes && <p><span className="text-muted-foreground">Explanation</span><span className="font-sans text-foreground">: {example.notes}</span></p>}
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-3" aria-labelledby="constraints-heading">
        <h2 id="constraints-heading" className="text-sm font-semibold text-foreground">Constraints</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
          {d.constraints.map((constraint) => (
            <li key={constraint}><code className="font-mono text-foreground">{constraint}</code></li>
          ))}
        </ul>
      </section>

      {d.followUp && (
        <Collapsible.Root className="rounded-lg border border-border bg-card">
          <Collapsible.Trigger className="flex w-full items-center justify-between gap-3 p-4 text-left text-sm font-medium text-foreground">
            <span className="flex items-center gap-2"><Icon name="bulb" size={16} /> Hint</span>
            <Icon name="chevronDown" size={16} className="text-muted-foreground" />
          </Collapsible.Trigger>
          <Collapsible.Panel className="border-t border-border px-4 py-3 text-sm leading-6 text-muted-foreground">
            <RichText text={d.followUp} />
          </Collapsible.Panel>
        </Collapsible.Root>
      )}

      {similar.length > 0 && <p className="text-xs text-muted-foreground">Related topics: {similar.map((item) => item.title).join(', ')}</p>}
    </article>
  )
}

function SubmissionsTab({ problem, submissions }: { problem: Problem; submissions: Submission[] }) {
  const navigate = useNavigate()
  if (!submissions.length) {
    return (
      <EmptyStatePane
        icon="history"
        title="No submissions yet"
        hint={`Run your first solution for ${problem.title} — it will show up here.`}
      />
    )
  }
  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Your submissions</h2>
        <Button variant="ghost"
          type="button"
          className="h-8"
          onClick={() => navigate(`/problems/${problem.id}/submissions`)}
        >
          View all
          <Icon name="arrowRight" size={16} />
        </Button>
      </div>
      <PanelSurface>
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <tr>
              <TableHead>Status</TableHead>
              <TableHead>Language</TableHead>
              <TableHead className="text-right">Runtime</TableHead>
              <TableHead className="text-right">Submitted</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {submissions.slice(0, 6).map((s) => (
              <TableRow key={s.id}>
                <TableCell><StatusPill status={s.status} /></TableCell>
                <TableCell className="text-sm text-muted-foreground">{s.language}</TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums text-muted-foreground">
                  {s.runtimeMs === null ? '—' : `${s.runtimeMs} ms`}
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">{s.submitted}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </PanelSurface>
    </div>
  )
}

function SolutionsTab() {

  const solutions = [
    { author: '@chen_w', initials: 'CW', lang: 'Python3', votes: 412, text: 'One-pass hash map: store every value you have seen, and look up the complement before inserting.' },
    { author: '@sarah_k', initials: 'SK', lang: 'Rust', votes: 268, text: 'Same idea with an array-index iterator — no heap allocation beyond the output vector.' },
    { author: '@dev_marcus', initials: 'DM', lang: 'C++', votes: 151, text: 'Sort with index tracking, then walk both ends. O(n log n) but cache friendly.' },
  ]
  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-4">
      <h2 className="text-xl font-semibold text-foreground">Top community solutions</h2>
      {solutions.map((s) => (
        <PanelSurface key={s.author} className="space-y-4 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <AvatarMini initials={s.initials} />
            <span className="text-sm font-medium text-foreground">{s.author}</span>
            <Badge variant="secondary">{s.lang}</Badge>
            <span className="grow" />
            <Badge variant="outline" className="tabular-nums">
              <Icon name="arrowUpRight" size={12} />
              {s.votes}
            </Badge>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{s.text}</p>
          <div className="flex items-center justify-between gap-3">
            <span className="flex gap-3 font-mono text-xs text-muted-foreground">
              <span>Time O(n)</span>
              <span>Space O(n)</span>
            </span>
            <Button variant="outline"
              type="button"
            // onClick={() => push({ title: 'Solution opened', description: 'Full editorials are demo-only in this build.', tone: 'neutral' })}
            >
              View solution
            </Button>
          </div>
        </PanelSurface>
      ))}
    </div>
  )
}

function EditorialTab({ problem }: { problem: Problem }) {
  return (
    <article className="mx-auto flex max-w-[760px] flex-col gap-4">
      <p className="text-sm font-semibold text-primary">Editorial · verified engineer</p>
      <h2 className="text-xl font-semibold text-foreground">Approach: one-pass hash map</h2>
      <p className="text-sm leading-7 text-muted-foreground">
        The naive solution compares every pair, which costs O(n²). Instead, while scanning{' '}
        <code>nums</code> left to right, keep a map from each value to its index. For every element,
        check whether <code>target - num</code> is already in the map — if it is, you have your two
        indices; if not, record the current element and continue.
      </p>
      <blockquote className="border-l-2 border-primary pl-4 text-sm leading-6 text-muted-foreground">
        The map guarantees each element is inserted at most once and probed at most once, so the
        total work is linear in the number of elements — regardless of input order.
      </blockquote>
      <div className="grid grid-cols-2 gap-3">
        <PanelSurface className="space-y-2 p-4">
          <p className="text-sm font-semibold text-foreground">Time complexity</p>
          <p className="font-mono text-sm text-foreground">O(n)</p>
          <p className="text-xs text-muted-foreground">Single scan with O(1) average lookups.</p>
        </PanelSurface>
        <PanelSurface className="space-y-2 p-4">
          <p className="text-sm font-semibold text-foreground">Space complexity</p>
          <p className="font-mono text-sm text-foreground">O(n)</p>
          <p className="text-xs text-muted-foreground">The map holds at most every element once.</p>
        </PanelSurface>
      </div>
      <p className="text-xs text-muted-foreground">
        Written for {problem.num}. {problem.title} · reviewed by the CodeForge editorial team.
      </p>
    </article>
  )
}

function EmptyStatePane({
  icon,
  title,
  hint,
}: {
  icon: Parameters<typeof Icon>[0]['name']
  title: string
  hint: string
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="text-muted-foreground">
        <Icon name={icon} size={32} strokeWidth={1.5} />
      </span>
      <p className="text-base font-semibold text-foreground">{title}</p>
      <p className="max-w-[380px] text-sm leading-6 text-muted-foreground">{hint}</p>
    </div>
  )
}

function AvatarMini({ initials }: { initials: string }) {
  return (
    <span className="inline-flex size-8 flex-none items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground" aria-hidden>
      {initials}
    </span>
  )
}

function StatusPill({ status }: { status: Submission['status'] }) {
  return <StatusBadge status={status} />
}

/* ------------------------------------------------------------------ */
/* Editor pane — header + Monaco editor                                */
/* ------------------------------------------------------------------ */

function EditorPane({
  lang,
  code,
  onCode,
  onLanguage,
  onRun,
  onSubmit,
  autoComplete,
  onAutoComplete,
  fontSize,
  onFontSize,
  tabSize,
  onTabSize,
  onCursorPositionChange,
}: {
  lang: string
  code: string
  onCode: (v: string) => void
  onLanguage: (v: string) => void
  onRun: () => void
  onSubmit: () => void
  autoComplete: boolean
  onAutoComplete: (enabled: boolean) => void
  fontSize: number
  onFontSize: (size: number) => void
  tabSize: number
  onTabSize: (size: number) => void
  onCursorPositionChange: (position: { lineNumber: number; column: number }) => void
}) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-11 flex-none items-center gap-2 overflow-x-auto border-b border-border bg-muted/40 px-3">
        <BaseSelect
          value={lang}
          onValueChange={onLanguage}
          ariaLabel="Editor language"
          className="h-8 min-w-32"
          options={LANGUAGES.map((language) => ({ value: language.name, label: language.name }))}
        />
        <Separator orientation="vertical" className="h-5" />
        <label className="inline-flex shrink-0 items-center gap-2 text-sm text-muted-foreground" htmlFor="editor-autocomplete">
          <Switch.Root
            id="editor-autocomplete"
            checked={autoComplete}
            onCheckedChange={onAutoComplete}
            className="relative inline-flex h-5 w-9 items-center rounded-full bg-input transition-colors data-[checked]:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Switch.Thumb className="block size-4 translate-x-0.5 rounded-full bg-background shadow-sm transition-transform data-[checked]:translate-x-4" />
          </Switch.Root>
          Auto-complete
        </label>
        <span className="grow" />
        <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
          <BaseTooltip content="Restore starter code">
            <AlertDialogTrigger >
              <Button variant="ghost" size="icon" className="size-8" aria-label="Restore starter code">
                <Icon name="refresh" size={16} />
              </Button>
            </AlertDialogTrigger>
          </BaseTooltip>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Restore starter code?</AlertDialogTitle>
              <AlertDialogDescription>This replaces the code currently in the editor.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onCode(STARTER_CODES[lang] ?? '')}>Restore code</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Popover.Root open={settingsOpen} onOpenChange={setSettingsOpen}>
          <BaseTooltip content="Editor settings">
            <Popover.Trigger render={<Button variant="ghost" size="icon" className="size-8" aria-label="Editor settings" />}>
              <Icon name="settings" size={16} />
            </Popover.Trigger>
          </BaseTooltip>
          <Popover.Portal>
            <Popover.Positioner side="bottom" align="end" sideOffset={6} className="z-50">
              <Popover.Popup className="w-64 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-md">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="editor-font-size">Font size</label>
                    <input id="editor-font-size" type="range" min={11} max={18} value={fontSize} onChange={(event) => onFontSize(Number(event.target.value))} className="w-full accent-primary" />
                    <p className="text-xs text-muted-foreground">{fontSize}px</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Indent size</label>
                    <div className="flex gap-2">
                      {[2, 4, 8].map((size) => <Button key={size} type="button" size="sm" variant={tabSize === size ? 'default' : 'outline'} aria-pressed={tabSize === size} onClick={() => onTabSize(size)}>{size} spaces</Button>)}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Theme and key bindings follow your app preferences.</p>
                </div>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </div>

      <CodeEditor
        className="grow"
        value={code}
        onChange={onCode}
        language={monacoLanguageFor(lang)}
        onRun={onRun}
        onSubmit={onSubmit}
        autoComplete={autoComplete}
        fontSize={fontSize}
        tabSize={tabSize}
        onCursorPositionChange={onCursorPositionChange}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Console: test cases, run results, run/submit controls               */
/* ------------------------------------------------------------------ */

type TestCase = { nums: string; target: string; expected: string }

const DEFAULT_CASES: TestCase[] = [
  { nums: '[2,7,11,15]', target: '9', expected: '[0,1]' },
  { nums: '[3,2,4]', target: '6', expected: '[1,2]' },
  { nums: '[3,3]', target: '6', expected: '[0,1]' },
]

function ConsolePane({
  open,
  onToggle,
  running,
  result,
}: {
  open: boolean
  onToggle: () => void
  running: boolean
  result: RunResult | null
}) {
  const [view, setView] = useState<'testcases' | 'result'>('testcases')
  const [cases, setCases] = useState<TestCase[]>(DEFAULT_CASES)
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (running || result) setView('result')
  }, [running, result])

  const current = cases[active] ?? cases[0]
  const update = (patch: Partial<TestCase>) => setCases((list) => list.map((item, index) => index === active ? { ...item, ...patch } : item))
  const addCase = () => {
    setCases((list) => [...list, { nums: '', target: '', expected: '' }])
    setActive(cases.length)
    setView('testcases')
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {open && (
        <BaseTabs value={view} onValueChange={(value) => setView(value as typeof view)} className="flex min-h-0 grow flex-col">
          <div className="flex h-11 flex-none items-center gap-2 border-b border-border bg-muted/40 px-3">
            <BaseTabsList className="h-full gap-1">
              <BaseTabsTrigger value="testcases" className="h-full px-2.5"><Icon name="list" size={16} /> Test cases</BaseTabsTrigger>
              <BaseTabsTrigger value="result" className="h-full px-2.5"><Icon name="terminal" size={16} /> Result {running && <Spinner size={12} className="text-muted-foreground" />}</BaseTabsTrigger>
            </BaseTabsList>
            <span className="grow" />
            <Button variant="ghost" size="sm" className="h-8" type="button" onClick={addCase}><Icon name="plus" size={16} /> Add test case</Button>
          </div>
          <ScrollArea className="min-h-0 grow">
            <div className="space-y-4 p-4 pb-8">
              {view === 'testcases' ? (
                <div className="space-y-4">
                  <BaseTabs value={String(active)} onValueChange={(value) => setActive(Number(value))}>
                    <BaseTabsList className="h-auto flex-wrap rounded-none bg-transparent p-0">
                      {cases.map((_, index) => (
                        <BaseTabsTrigger key={index} value={String(index)} className="h-8 rounded-md border px-3 text-xs data-[active]:border-primary">
                          <Icon name="checkCircle" size={16} /> Case {index + 1}
                        </BaseTabsTrigger>
                      ))}
                    </BaseTabsList>
                  </BaseTabs>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="space-y-2">
                      <span className="text-xs text-muted-foreground">Input · nums</span>
                      <Input className="h-9 font-mono text-sm" value={current.nums} onChange={(event) => update({ nums: event.target.value })} aria-label={`nums for case ${active + 1}`} />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs text-muted-foreground">Input · target</span>
                      <Input className="h-9 font-mono text-sm" value={current.target} onChange={(event) => update({ target: event.target.value })} aria-label={`target for case ${active + 1}`} />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs text-muted-foreground">Expected output</span>
                      <Input className="h-9 font-mono text-sm" value={current.expected} onChange={(event) => update({ expected: event.target.value })} aria-label={`expected output for case ${active + 1}`} />
                    </label>
                  </div>
                </div>
              ) : running ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Spinner size={20} />
                  <p className="text-sm">Running your code…</p>
                </div>
              ) : result ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge status="Accepted" />
                    <Badge variant="secondary">Sample preview · {result.passed} / {result.total} cases</Badge>
                  </div>
                  <div className="space-y-3">
                    {cases.slice(0, result.mode === 'run' ? cases.length : 3).map((testCase, index) => (
                      <article key={index} className="grid gap-3 rounded-lg border border-border bg-muted/50 p-3 sm:grid-cols-2">
                        <div className="flex items-center gap-2 sm:col-span-2"><Icon name="checkCircle" size={16} className="text-primary" /><span className="text-sm font-medium">Case {index + 1}</span></div>
                        <div className="space-y-1"><p className="text-xs text-muted-foreground">Input</p><code className="break-all font-mono text-sm text-foreground">nums = {testCase.nums}, target = {testCase.target}</code></div>
                        <div className="space-y-1"><p className="text-xs text-muted-foreground">Expected</p><code className="break-all font-mono text-sm text-foreground">{testCase.expected}</code></div>
                      </article>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-center">
                  <Icon name="play" size={24} className="text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">No result yet</p>
                  <p className="text-sm text-muted-foreground">Run the sample preview to review these cases.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </BaseTabs>
      )}
      <div className="flex h-10 flex-none items-center justify-between gap-3 border-t border-border px-3">
        <Button variant="ghost" size="sm" className="h-8 px-2" type="button" onClick={onToggle} aria-expanded={open}>
          <Icon name={open ? 'chevronDown' : 'chevronUp'} size={16} /> Console
        </Button>
        <span className="text-xs text-muted-foreground">Sample runner</span>
      </div>
    </div>
  )
}