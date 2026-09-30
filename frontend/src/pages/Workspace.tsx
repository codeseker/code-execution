import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/icons'
import { tokenizeLine } from '../components/Code'
import { DifficultyBadge, Logo, Spinner, ThemeToggle, cx } from '../components/ui'
import { EngineStatusBar } from '../components/shell'
import { useToast } from '../toast'
import {
  LANGUAGES,
  PROBLEMS,
  STARTER_CODES,
  TWO_SUM_PY,
  TWO_SUM_SUBMISSIONS,
  problemById,
} from '../data'
import type { Problem, Submission } from '../data'

const TABS = ['Description', 'Submissions', 'Solutions', 'Editorial'] as const
type Tab = (typeof TABS)[number]

type RunResult = {
  mode: 'run' | 'submit'
  passed: number
  total: number
  runtime: number
  memory: number
}

const fmtTime = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export default function Workspace() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { push } = useToast()
  const problem = problemById(id ?? '') ?? PROBLEMS[0]
  const index = PROBLEMS.findIndex((p) => p.id === problem.id)

  const [tab, setTab] = useState<Tab>('Description')
  const [lang, setLang] = useState('Python3')
  const [code, setCode] = useState(
    problem.id === 'two-sum' ? TWO_SUM_PY : STARTER_CODES['Python3'],
  )
  const [pane, setPane] = useState<'problem' | 'code' | 'console'>('problem')
  const [splitPct, setSplitPct] = useState(46)
  const [leftOpen, setLeftOpen] = useState(true)
  const [consoleOpen, setConsoleOpen] = useState(true)
  const [seconds, setSeconds] = useState(24 * 60 + 18)
  const [paused, setPaused] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<RunResult | null>(null)

  const submissions: Submission[] = useMemo(
    () => (problem.id === 'two-sum' ? TWO_SUM_SUBMISSIONS : []),
    [problem.id],
  )

  // Session timer.
  useEffect(() => {
    if (paused) return
    const t = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => window.clearInterval(t)
  }, [paused])

  // Reset pane state when switching problems.
  useEffect(() => {
    setTab('Description')
    setCode(problem.id === 'two-sum' ? TWO_SUM_PY : STARTER_CODES[lang] ?? STARTER_CODES['Python3'])
    setSeconds(24 * 60 + 18)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem.id])

  const goTo = (delta: number) => {
    const next = PROBLEMS[(index + delta + PROBLEMS.length) % PROBLEMS.length]
    navigate(`/problems/${next.id}`)
  }

  const changeLanguage = (name: string) => {
    setLang(name)
    setCode(STARTER_CODES[name] ?? '')
  }

  // Simulated execution: run individual cases or submit the whole suite.
  const run = () => {
    if (running) return
    setRunning(true)
    window.setTimeout(() => {
      setRunning(false)
      setResult({ mode: 'run', passed: 3, total: 3, runtime: 12, memory: 8.4 })
    }, 650)
  }

  const submit = () => {
    if (running) return
    setRunning(true)
    window.setTimeout(() => {
      setRunning(false)
      setResult({ mode: 'submit', passed: 57, total: 57, runtime: 38, memory: 17.2 })
      push({
        title: 'Accepted — 57 / 57 test cases',
        description: 'Runtime 38 ms · beats 94.2% · +25 XP',
        tone: 'success',
      })
    }, 950)
  }

  // ⌘↵ runs, ⌘⇧↵ submits (design.md keyboard model).
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

  const fullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined)
    else document.documentElement.requestFullscreen().catch(() => push({ title: 'Fullscreen unavailable', tone: 'neutral' }))
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-canvas">
      {/* ---------------- Workspace topbar ---------------- */}
      <header className="flex h-11 flex-none items-center gap-3 border-b border-hair px-3">
        <Link to="/problems" aria-label="CodeForge home">
          <Logo size={24} wordmark={false} />
        </Link>
        <span className="hidden h-4 w-px bg-hair sm:block" aria-hidden />
        <span className="t-ui-med hidden text-ink sm:block">CodeForge</span>
        <span className="hidden h-4 w-px bg-hair sm:block" aria-hidden />

        <div className="flex items-center gap-0.5">
          <button type="button" className="icon-btn h-7 w-7" aria-label="Previous problem" onClick={() => goTo(-1)}>
            <Icon name="chevronLeft" size={15} />
          </button>
          <button type="button" className="icon-btn h-7 w-7" aria-label="Next problem" onClick={() => goTo(1)}>
            <Icon name="chevronRight" size={15} />
          </button>
        </div>

        <Link
          to="/problems"
          className="group flex items-center gap-1.5 rounded px-1.5 py-1 hover:bg-wash"
          title="All problems"
        >
          <span className="t-ui-med text-ink">
            {problem.num}. {problem.title}
          </span>
          <Icon name="chevronDown" size={13} className="text-ink-3" />
        </Link>
        <DifficultyBadge difficulty={problem.difficulty} className="hidden sm:inline-flex" />

        <nav className="ml-2 hidden items-center gap-1 lg:flex" aria-label="Problem views">
          <Link to={`/problems/${problem.id}`} className="rounded px-2.5 py-1 text-[14px] text-ink-2 hover:bg-wash hover:text-ink">
            Problems
          </Link>
          <Link to={`/problems/${problem.id}/submissions`} className="rounded px-2.5 py-1 text-[14px] text-ink-2 hover:bg-wash hover:text-ink">
            Submissions
          </Link>
          <Link to="/discuss" className="rounded px-2.5 py-1 text-[14px] text-ink-2 hover:bg-wash hover:text-ink">
            Discuss
          </Link>
        </nav>

        <span className="grow" />

        <button
          type="button"
          className="pill pill-neutral tnum h-7"
          onClick={() => setPaused((p) => !p)}
          title={paused ? 'Resume timer' : 'Pause timer'}
        >
          <Icon name="timer" size={13} />
          {fmtTime(seconds)}
        </button>

        <div className="hidden items-center gap-0.5 md:flex">
          <button
            type="button"
            className={cx('icon-btn h-7 w-7', leftOpen && 'bg-wash text-ink')}
            aria-label="Toggle problem pane"
            aria-pressed={leftOpen}
            onClick={() => setLeftOpen((v) => !v)}
          >
            <Icon name="layoutLeft" size={15} />
          </button>
          <button
            type="button"
            className={cx('icon-btn h-7 w-7', consoleOpen && 'bg-wash text-ink')}
            aria-label="Toggle console pane"
            aria-pressed={consoleOpen}
            onClick={() => setConsoleOpen((v) => !v)}
          >
            <Icon name="layoutRight" size={15} />
          </button>
          <button type="button" className="icon-btn h-7 w-7" aria-label="Toggle fullscreen" onClick={fullscreen}>
            <Icon name="maximize" size={15} />
          </button>
        </div>

        <ThemeToggle />
        <span className="hidden h-4 w-px bg-hair md:block" aria-hidden />
        <div className="hidden items-center gap-2 md:flex">
          <button type="button" className="btn btn-secondary btn-sm" onClick={run} disabled={running}>
            <Icon name="play" size={12} />
            Run
            <span className="kbd">⌘↵</span>
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={submit} disabled={running}>
            <Icon name="upload" size={13} />
            Submit
            <span className="kbd" style={{ color: 'inherit', opacity: 0.75 }}>
              ⌘⇧↵
            </span>
          </button>
        </div>
      </header>

      {/* ---------------- Mobile segmented control ---------------- */}
      <div className="flex-none border-b border-hair px-3 py-2 lg:hidden">
        <div className="seg w-full" role="tablist" aria-label="Workspace panels">
          {(['problem', 'code', 'console'] as const).map((p) => (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={pane === p}
              className={cx('seg-btn grow', pane === p && 'is-active')}
              onClick={() => setPane(p)}
            >
              {p === 'problem' ? 'Problem' : p === 'code' ? 'Code' : 'Console'}
            </button>
          ))}
        </div>
      </div>

      {/* ---------------- Panes ---------------- */}
      <div ref={mainRef} className="flex min-h-0 grow">
        {/* Problem pane */}
        <section
          className={cx(
            'min-w-0 grow flex-col overflow-hidden',
            leftOpen
              ? pane === 'problem'
                ? 'flex'
                : 'hidden lg:flex'
              : 'hidden',
          )}
          style={{ flexBasis: `${splitPct}%` }}
          aria-label="Problem description"
        >
          <ProblemPane problem={problem} tab={tab} setTab={setTab} submissions={submissions} />
        </section>

        {/* Splitter (desktop) */}
        <div
          className="group relative hidden w-2 cursor-col-resize lg:block"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panes"
          onPointerDown={(e) => {
            dragging.current = true
            e.currentTarget.setPointerCapture(e.pointerId)
          }}
          onPointerMove={(e) => {
            if (!dragging.current || !mainRef.current) return
            const rect = mainRef.current.getBoundingClientRect()
            const pct = ((e.clientX - rect.left) / rect.width) * 100
            setSplitPct(Math.min(72, Math.max(28, pct)))
          }}
          onPointerUp={() => {
            dragging.current = false
          }}
          onPointerCancel={() => {
            dragging.current = false
          }}
        >
          <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-hair transition-all group-hover:w-[3px] group-hover:bg-accent" />
        </div>

        {/* Editor + console */}
        <section
          className={cx(
            'min-w-0 grow flex-col overflow-hidden',
            pane === 'problem' ? 'hidden lg:flex' : 'flex',
          )}
          style={{ flexBasis: `${100 - splitPct}%` }}
          aria-label="Code editor"
        >
          <EditorPane lang={lang} code={code} onCode={setCode} onLanguage={changeLanguage} />
          <ConsolePane
            open={consoleOpen || pane === 'console'}
            onToggle={() => setConsoleOpen((v) => !v)}
            running={running}
            result={result}
            onRun={run}
            onSubmit={submit}
          />
        </section>
      </div>

      <EngineStatusBar />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Problem pane: tabs + statement / submissions / solutions / editorial */
/* ------------------------------------------------------------------ */

/** Renders the light markdown used in statements: **bold** and `code`. */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) {
          return (
            <strong key={i} className="font-semibold text-ink">
              {p.slice(2, -2)}
            </strong>
          )
        }
        if (p.startsWith('`') && p.endsWith('`') && p.length > 2) {
          return <code key={i}>{p.slice(1, -1)}</code>
        }
        return <span key={i}>{p}</span>
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
  const { push } = useToast()
  const [saved, setSaved] = useState(false)

  const tabIcon: Record<Tab, Parameters<typeof Icon>[0]['name']> = {
    Description: 'file',
    Submissions: 'history',
    Solutions: 'bulb',
    Editorial: 'book',
  }

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex h-11 flex-none items-center gap-1 overflow-x-auto border-b border-hair px-3">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={cx('tab flex-none', tab === t && 'is-active')}
            aria-current={tab === t}
            onClick={() => setTab(t)}
          >
            <Icon name={tabIcon[t]} size={14} />
            {t}
            {t === 'Submissions' && submissions.length > 0 && (
              <span className="tag tag-gray tnum">{submissions.length}</span>
            )}
            {t === 'Solutions' && <span className="tag tag-gray tnum">4.2k</span>}
          </button>
        ))}
        <span className="grow" />
        <button
          type="button"
          className={cx('icon-btn flex-none', saved && 'text-accent')}
          aria-label={saved ? 'Remove bookmark' : 'Bookmark problem'}
          aria-pressed={saved}
          onClick={() => {
            setSaved((v) => !v)
            push({ title: saved ? 'Removed from bookmarks' : 'Bookmarked', tone: 'neutral' })
          }}
        >
          <Icon name="bookmark" size={15} />
        </button>
        <button
          type="button"
          className="icon-btn flex-none"
          aria-label="Share problem"
          onClick={() => push({ title: 'Link copied to clipboard', description: `codeforge.io/p/${problem.id}`, tone: 'success' })}
        >
          <Icon name="share" size={15} />
        </button>
      </div>

      <div className="scroll-y grow px-5 py-6 lg:px-9">
        {tab === 'Description' && <Description problem={problem} />}
        {tab === 'Submissions' && <SubmissionsTab problem={problem} submissions={submissions} />}
        {tab === 'Solutions' && <SolutionsTab />}
        {tab === 'Editorial' && <EditorialTab problem={problem} />}
      </div>
    </div>
  )
}

function Description({ problem }: { problem: Problem }) {
  const d = problem.detail!
  return (
    <article className="stack max-w-[720px] gap-5">
      <header className="stack gap-3">
        <h1 className="t-h1 text-ink">
          {problem.num}. {problem.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <DifficultyBadge difficulty={problem.difficulty} />
          <span className="flex flex-wrap items-center gap-1.5 t-ui text-ink-2">
            {problem.tags.map((t, i) => (
              <span key={t} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-ink-4">•</span>}
                {t}
              </span>
            ))}
          </span>
          <span className="t-ui flex items-center gap-1.5 text-ink-2">
            <Icon name="building" size={14} className="text-ink-3" />
            {problem.companies.join(', ')}
          </span>
          <span className="t-ui tnum text-ink-3">Acceptance {problem.acceptance}%</span>
        </div>
      </header>

      <hr className="border-hair" />

      <div className="stack gap-3">
        {d.paragraphs.map((p, i) => (
          <p key={i} className="t-reading text-ink-2">
            <RichText text={p} />
          </p>
        ))}
      </div>

      {d.examples.map((ex, i) => (
        <div key={i} className="stack gap-2">
          <p className="t-overline text-ink-3">Example {i + 1}</p>
          <div className="stack gap-1.5 rounded-md border border-hair bg-code p-3.5">
            <div className="t-code">
              <span className="text-ink-3">Input: </span>
              <span className="text-ink">{ex.input}</span>
            </div>
            <div className="t-code">
              <span className="text-ink-3">Output: </span>
              <span className="text-ink">{ex.output}</span>
            </div>
            {ex.notes && (
              <div className="t-code">
                <span className="text-ink-3">Notes: </span>
                <span className="text-ink-2">{ex.notes}</span>
              </div>
            )}
          </div>
        </div>
      ))}

      <div className="stack gap-2">
        <p className="t-overline text-ink-3">Constraints</p>
        <ul className="stack list-disc gap-1.5 pl-5">
          {d.constraints.map((c) => (
            <li key={c} className="t-code text-ink-2">
              {c}
            </li>
          ))}
        </ul>
      </div>

      {d.followUp && (
        <div className="callout">
          <Icon name="bulb" size={20} className="mt-0.5 flex-none text-warning" />
          <p className="t-reading text-ink-2">
            <strong className="font-semibold text-ink">Follow-up: </strong>
            <RichText text={d.followUp} />
          </p>
        </div>
      )}
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
    <div className="stack max-w-[720px] gap-4">
      <div className="flex items-center justify-between">
        <h2 className="t-h3 text-ink">Your submissions</h2>
        <button
          type="button"
          className="link t-ui-med inline-flex items-center gap-1.5"
          onClick={() => navigate(`/problems/${problem.id}/submissions`)}
        >
          View all
          <Icon name="arrowRight" size={13} />
        </button>
      </div>
      <div className="overflow-hidden rounded-lg border border-hair">
        <table className="ntable">
          <thead>
            <tr>
              <th className="pl-4">Status</th>
              <th>Language</th>
              <th>Runtime</th>
              <th className="pr-4 text-right">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {submissions.slice(0, 6).map((s) => (
              <tr
                key={s.id}
                className="cursor-pointer"
                onClick={() => navigate(`/problems/${problem.id}/submissions`)}
              >
                <td className="pl-4">
                  <StatusPill status={s.status} />
                </td>
                <td className="t-ui text-ink-2">{s.language}</td>
                <td className="tnum t-ui text-ink-2">
                  {s.runtimeMs === null ? '—' : `${s.runtimeMs} ms`}
                </td>
                <td className="t-caption pr-4 text-right text-ink-3">{s.submitted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SolutionsTab() {
  const { push } = useToast()
  const solutions = [
    { author: '@chen_w', initials: 'CW', lang: 'Python3', votes: 412, text: 'One-pass hash map: store every value you have seen, and look up the complement before inserting.' },
    { author: '@sarah_k', initials: 'SK', lang: 'Rust', votes: 268, text: 'Same idea with an array-index iterator — no heap allocation beyond the output vector.' },
    { author: '@dev_marcus', initials: 'DM', lang: 'C++', votes: 151, text: 'Sort with index tracking, then walk both ends. O(n log n) but cache friendly.' },
  ]
  return (
    <div className="stack max-w-[720px] gap-3">
      <h2 className="t-h3 text-ink">Top community solutions</h2>
      {solutions.map((s) => (
        <article key={s.author} className="card stack gap-2.5 p-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <AvatarMini initials={s.initials} />
            <span className="t-ui-med text-ink">{s.author}</span>
            <span className="tag tag-gray">{s.lang}</span>
            <span className="grow" />
            <span className="pill pill-accent tnum">
              <Icon name="arrowUpRight" size={12} />
              {s.votes}
            </span>
          </div>
          <p className="t-ui text-ink-2">{s.text}</p>
          <div className="flex items-center justify-between gap-3">
            <span className="t-code-tag flex gap-3 text-ink-3">
              <span>Time O(n)</span>
              <span>Space O(n)</span>
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => push({ title: 'Solution opened', description: 'Full editorials are demo-only in this build.', tone: 'neutral' })}
            >
              View solution
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}

function EditorialTab({ problem }: { problem: Problem }) {
  return (
    <article className="stack max-w-[720px] gap-4">
      <p className="t-overline text-accent">Editorial · verified engineer</p>
      <h2 className="t-h2 text-ink">Approach: one-pass hash map</h2>
      <p className="t-reading text-ink-2">
        The naive solution compares every pair, which costs O(n²). Instead, while scanning{' '}
        <code>nums</code> left to right, keep a map from each value to its index. For every element,
        check whether <code>target - num</code> is already in the map — if it is, you have your two
        indices; if not, record the current element and continue.
      </p>
      <blockquote className="border-l-[3px] border-ink pl-3.5 text-[16px] leading-[26px] text-ink-2">
        The map guarantees each element is inserted at most once and probed at most once, so the
        total work is linear in the number of elements — regardless of input order.
      </blockquote>
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="t-overline text-ink-3">Time complexity</p>
          <p className="t-code mt-1 text-ink">O(n)</p>
          <p className="t-caption mt-1 text-ink-2">Single scan with O(1) average lookups.</p>
        </div>
        <div className="card p-4">
          <p className="t-overline text-ink-3">Space complexity</p>
          <p className="t-code mt-1 text-ink">O(n)</p>
          <p className="t-caption mt-1 text-ink-2">The map holds at most every element once.</p>
        </div>
      </div>
      <p className="t-caption text-ink-3">
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
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name={icon} size={48} strokeWidth={1.2} />
      </span>
      <p className="text-[16px] font-semibold text-ink">{title}</p>
      <p className="t-ui max-w-[380px] text-ink-2">{hint}</p>
    </div>
  )
}

function AvatarMini({ initials }: { initials: string }) {
  return (
    <span
      className="center h-6 w-6 flex-none rounded-full bg-accent-soft text-[10px] font-semibold text-accent"
      aria-hidden
    >
      {initials}
    </span>
  )
}

function StatusPill({ status }: { status: Submission['status'] }) {
  const tone = status === 'Accepted' ? 'pill-success' : status === 'Time Limit Exceeded' ? 'pill-warning' : 'pill-error'
  const icon = status === 'Accepted' ? 'checkCircle' : status === 'Time Limit Exceeded' ? 'timer' : 'xCircle'
  return (
    <span className={cx('pill', tone)}>
      <Icon name={icon} size={12} />
      {status}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Editor pane — highlighted surface + transparent textarea overlay    */
/* ------------------------------------------------------------------ */

function EditorPane({
  lang,
  code,
  onCode,
  onLanguage,
}: {
  lang: string
  code: string
  onCode: (v: string) => void
  onLanguage: (v: string) => void
}) {
  const { push } = useToast()
  const lines = code.split('\n')
  const codeLang = lang.startsWith('Python') ? 'python' : lang === 'Rust' ? 'rust' : 'js'

  return (
    <div className="flex min-h-0 grow flex-col border-b border-hair">
      {/* Editor header (36px) */}
      <div className="flex h-9 flex-none items-center gap-3 border-b border-hair px-3">
        <span className="relative">
          <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2">
            <span className="block h-2 w-2 rounded-full bg-accent" aria-hidden />
          </span>
          <select
            className="input select h-7 w-[136px] appearance-none pl-7 text-[13px] font-medium"
            value={lang}
            aria-label="Language"
            onChange={(e) => onLanguage(e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l.name} value={l.name}>
                {l.name}
              </option>
            ))}
          </select>
        </span>
        <span className="t-caption hidden items-center gap-1.5 text-ink-3 sm:flex">
          <Icon name="check" size={12} className="text-success" />
          Auto-complete on
        </span>
        <span className="grow" />
        <button
          type="button"
          className="icon-btn tip h-7 w-7"
          data-tip="Restore starter code"
          aria-label="Restore starter code"
          onClick={() => {
            onCode(STARTER_CODES[lang] ?? '')
            push({ title: 'Starter code restored', tone: 'neutral' })
          }}
        >
          <Icon name="refresh" size={14} />
        </button>
        <button
          type="button"
          className="icon-btn tip h-7 w-7"
          data-tip="Editor settings"
          aria-label="Editor settings"
          onClick={() => push({ title: 'Editor settings', description: 'Font size, ligatures and theme follow your design preferences.', tone: 'neutral' })}
        >
          <Icon name="settings" size={14} />
        </button>
      </div>

      {/* Code surface: highlighted <pre> under a transparent textarea */}
      <div className="relative min-h-0 grow overflow-auto bg-code">
        <div className="flex min-h-full">
          <div
            className="t-code shrink-0 py-3 pr-3 pl-4 text-right text-ink-3 tnum select-none"
            aria-hidden
          >
            {lines.map((_, i) => (
              <div key={i} className="leading-[22px]">
                {i + 1}
              </div>
            ))}
          </div>
          <div className="relative min-w-0 grow">
            <pre
              aria-hidden
              className="t-code m-0 min-h-full px-1 py-3 break-words whitespace-pre-wrap text-ink"
              style={{ lineHeight: '22px' }}
            >
              {lines.map((ln, i) => (
                <span key={i} className="block leading-[22px]">
                  {tokenizeLine(ln, codeLang).map((t, ti) => (
                    <span key={ti} className={t.cls}>
                      {t.text}
                    </span>
                  ))}
                  {ln.length === 0 ? ' ' : ''}
                </span>
              ))}
            </pre>
            <textarea
              value={code}
              onChange={(e) => onCode(e.target.value)}
              spellCheck={false}
              aria-label="Code editor"
              className="t-code absolute inset-0 h-full w-full resize-none bg-transparent px-1 py-3 break-words whitespace-pre-wrap text-transparent caret-accent outline-none"
              style={{ lineHeight: '22px' }}
            />
          </div>
        </div>
      </div>
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
  onRun,
  onSubmit,
}: {
  open: boolean
  onToggle: () => void
  running: boolean
  result: RunResult | null
  onRun: () => void
  onSubmit: () => void
}) {
  const { push } = useToast()
  const [view, setView] = useState<'testcases' | 'result'>('testcases')
  const [cases, setCases] = useState<TestCase[]>(DEFAULT_CASES)
  const [active, setActive] = useState(0)

  // Jump to the result view whenever a run finishes (or starts).
  useEffect(() => {
    if (running || result) setView('result')
  }, [running, result])

  const current = cases[active] ?? cases[0]
  const update = (patch: Partial<TestCase>) =>
    setCases((list) => list.map((c, i) => (i === active ? { ...c, ...patch } : c)))

  return (
    <div className={cx('flex flex-none flex-col', open ? 'h-[44%] min-h-[236px]' : 'h-9')}>
      {open && (
        <>
          {/* Case/result tabs */}
          <div className="flex h-9 flex-none items-center gap-1 border-b border-hair px-3">
            <button
              type="button"
              className={cx('tab h-8', view === 'testcases' && 'is-active')}
              onClick={() => setView('testcases')}
            >
              <Icon name="list" size={14} />
              Testcases
            </button>
            <button
              type="button"
              className={cx('tab h-8', view === 'result' && 'is-active')}
              onClick={() => setView('result')}
            >
              <Icon name="terminal" size={14} />
              Result
              {running ? (
                <Spinner size={11} className="text-accent" />
              ) : (
                result && <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
              )}
            </button>
            <span className="grow" />
            <button
              type="button"
              className="btn btn-ghost btn-sm h-6 text-[12px]"
              onClick={() => push({ title: 'Custom testcases', description: 'Add a case with the + button in the testcases tab.', tone: 'neutral' })}
            >
              <Icon name="sliders" size={12} />
              Custom Testcase
            </button>
          </div>

          <div className="scroll-y grow px-4 py-3.5">
            {view === 'testcases' ? (
              <div className="stack gap-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  {cases.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={cx(
                        'h-7 rounded-md border px-3 text-[13px] transition-colors',
                        i === active
                          ? 'border-transparent bg-wash-strong font-medium text-ink'
                          : 'border-hair text-ink-2 hover:bg-wash',
                      )}
                      aria-pressed={i === active}
                      onClick={() => setActive(i)}
                    >
                      Case {i + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="icon-btn h-7 w-7 rounded-md border border-dashed border-line"
                    aria-label="Add test case"
                    onClick={() => {
                      setCases((list) => [...list, { nums: '', target: '', expected: '' }])
                      setActive(cases.length)
                    }}
                  >
                    <Icon name="plus" size={14} />
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="stack gap-1.5">
                    <span className="t-code-tag text-ink-2">nums =</span>
                    <input
                      className="input t-code h-8"
                      value={current.nums}
                      onChange={(e) => update({ nums: e.target.value })}
                      aria-label={`nums for case ${active + 1}`}
                    />
                  </label>
                  <label className="stack gap-1.5">
                    <span className="t-code-tag text-ink-2">target =</span>
                    <input
                      className="input t-code h-8"
                      value={current.target}
                      onChange={(e) => update({ target: e.target.value })}
                      aria-label={`target for case ${active + 1}`}
                    />
                  </label>
                  <label className="stack gap-1.5">
                    <span className="t-code-tag text-ink-2">Expected Output =</span>
                    <input
                      className="input t-code h-8"
                      value={current.expected}
                      onChange={(e) => update({ expected: e.target.value })}
                      aria-label={`expected output for case ${active + 1}`}
                    />
                  </label>
                </div>
              </div>
            ) : running ? (
              <div className="center h-full flex-col gap-3 text-ink-2">
                <Spinner size={20} className="text-accent" />
                <p className="t-ui">Executing on v8-isolate…</p>
              </div>
            ) : result ? (
              <div className="stack gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="center h-7 w-7 rounded-full bg-success-soft text-success">
                    <Icon name="check" size={16} strokeWidth={2.6} />
                  </span>
                  <span className="text-[20px] leading-7 font-semibold text-success">Accepted</span>
                  <span className="t-code-tag text-ink-2">
                    {result.passed} / {result.total} Test Cases Passed
                  </span>
                  <span className="grow" />
                  <span className="t-code-tag rounded-sm bg-wash px-2 py-1 text-ink-2">
                    {result.runtime} ms
                  </span>
                  <span className="t-code-tag rounded-sm bg-wash px-2 py-1 text-ink-2">
                    {result.memory} MB
                  </span>
                </div>

                <div className="stack gap-1.5">
                  {cases.slice(0, result.mode === 'run' ? cases.length : 3).map((c, i) => (
                    <div
                      key={i}
                      className="flex flex-wrap items-center gap-3 rounded-md border border-hair bg-code px-3 py-2"
                    >
                      <Icon name="checkCircle" size={14} className="text-success" />
                      <span className="t-code-tag text-ink-2">Case {i + 1}</span>
                      <span className="t-code min-w-0 grow truncate text-ink-3">
                        {c.nums} → {c.expected}
                      </span>
                      <span className="t-code-tag tnum text-ink-3">{4 + i * 3} ms</span>
                    </div>
                  ))}
                  {result.mode === 'submit' && (
                    <p className="t-caption text-ink-3">
                      + {result.total - 3} more hidden test cases passed.
                    </p>
                  )}
                </div>

                <div className="rounded-md border border-hair bg-code p-3 font-mono text-[13px] leading-5">
                  <p className="text-ink-2">
                    <span className="text-ink-3">stdout: </span>
                    All target pairs resolved in a single pass — O(n) time, O(n) space.
                  </p>
                  <p className="text-success">Process finished with exit code 0</p>
                </div>
              </div>
            ) : (
              <div className="empty-state py-8">
                <span className="empty-icon">
                  <Icon name="play" size={40} strokeWidth={1.2} />
                </span>
                <p className="text-[15px] font-semibold text-ink">No results yet</p>
                <p className="t-ui text-ink-2">Run your code to see per-case output here.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Console footer */}
      <div className="flex h-9 flex-none items-center justify-between gap-3 border-t border-hair px-3">
        <button type="button" className="btn btn-ghost btn-sm h-6 px-1.5" onClick={onToggle} aria-expanded={open}>
          <Icon name={open ? 'chevronDown' : 'chevronUp'} size={13} />
          Console
        </button>
        <div className="flex items-center gap-2.5">
          <span className="t-code-tag hidden text-ink-3 sm:inline">⌘↵ to submit</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onRun} disabled={running}>
            <Icon name="play" size={11} />
            Run
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={onSubmit} disabled={running}>
            <Icon name="upload" size={13} />
            Submit
          </button>
        </div>
      </div>
    </div>
  )
}
