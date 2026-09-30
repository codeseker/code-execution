import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/icons'
import { CodeView } from '../components/Code'
import { DistributionCurve } from '../components/charts'
import { DifficultyBadge, EmptyState, Logo, ThemeToggle, cx } from '../components/ui'
import { EngineStatusBar } from '../components/shell'
import { useToast } from '../toast'
import { TWO_SUM_PY, TWO_SUM_SUBMISSIONS, problemById } from '../data'
import type { SubmissionStatus } from '../data'

const PAGE_SIZE = 8

const LANG_OPTIONS = ['All languages', 'Python3', 'Rust', 'TypeScript', 'C++']
const STATUS_OPTIONS = ['All statuses', 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Compile Error']

const STATUS_NOTE: Record<SubmissionStatus, string> = {
  Accepted: 'All test cases passed — the judge accepted your output.',
  'Wrong Answer': 'Output did not match the expected result on hidden test case 17.',
  'Time Limit Exceeded': 'Exceeded the 2000 ms budget — the inner loop is probably O(n²).',
  'Memory Limit Exceeded': 'Peak RSS 256.4 MB exceeded the 64 MB sandbox limit.',
  'Compile Error': 'gcc 13.2: error: expected initializer before ‘]’ token.',
}

function statusTone(status: SubmissionStatus) {
  if (status === 'Accepted') return 'pill-success'
  if (status === 'Time Limit Exceeded') return 'pill-warning'
  return 'pill-error'
}

function statusIcon(status: SubmissionStatus) {
  if (status === 'Accepted') return 'checkCircle'
  if (status === 'Time Limit Exceeded') return 'timer'
  if (status === 'Compile Error') return 'alert'
  return 'xCircle'
}

export default function Submissions() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { push } = useToast()
  const problem = problemById(id ?? '') ?? problemById('two-sum')!

  const [lang, setLang] = useState('All languages')
  const [status, setStatus] = useState('All statuses')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(TWO_SUM_SUBMISSIONS[0]?.id ?? null)

  // Demo history: every problem surface shows the same rich run history.
  const all = TWO_SUM_SUBMISSIONS
  const filtered = useMemo(
    () =>
      all.filter(
        (s) =>
          (lang === 'All languages' || s.language === lang) &&
          (status === 'All statuses' || s.status === status),
      ),
    [all, lang, status],
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const selected = filtered.find((s) => s.id === selectedId) ?? null

  const acceptedCount = all.filter((s) => s.status === 'Accepted').length
  const bestRuntime = Math.min(...all.filter((s) => s.runtimeMs !== null).map((s) => s.runtimeMs as number))
  const bestMemory = Math.min(...all.filter((s) => s.memoryMb !== null).map((s) => s.memoryMb as number))

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* Workspace-style topbar */}
      <header className="flex h-11 flex-none items-center gap-3 border-b border-hair px-3">
        <Link to="/problems" aria-label="CodeForge home">
          <Logo size={24} />
        </Link>
        <span className="hidden h-4 w-px bg-hair sm:block" aria-hidden />
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className="icon-btn h-7 w-7"
            aria-label="Previous problem"
            onClick={() => navigate(`/problems/valid-parentheses`)}
          >
            <Icon name="chevronLeft" size={15} />
          </button>
          <button
            type="button"
            className="icon-btn h-7 w-7"
            aria-label="Next problem"
            onClick={() => navigate(`/problems/lru-cache`)}
          >
            <Icon name="chevronRight" size={15} />
          </button>
        </div>
        <Link to="/problems" className="flex items-center gap-1.5 rounded px-1.5 py-1 hover:bg-wash">
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
          <span className="rounded bg-wash px-2.5 py-1 text-[14px] font-medium text-ink">Submissions</span>
          <Link to="/discuss" className="rounded px-2.5 py-1 text-[14px] text-ink-2 hover:bg-wash hover:text-ink">
            Discuss
          </Link>
        </nav>
        <span className="grow" />
        <ThemeToggle />
        <Link to={`/problems/${problem.id}`} className="btn btn-secondary btn-sm">
          <Icon name="play" size={12} />
          Run
          <span className="kbd">⌘↵</span>
        </Link>
        <Link to={`/problems/${problem.id}`} className="btn btn-primary btn-sm">
          <Icon name="upload" size={13} />
          Submit
        </Link>
      </header>

      {/* Breadcrumb + controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hair px-4 py-2.5">
        <nav className="t-ui flex items-center gap-1.5 text-ink-3" aria-label="Breadcrumb">
          <Link to="/problems" className="hover:text-ink">
            Problems
          </Link>
          <span>/</span>
          <Link to={`/problems/${problem.id}`} className="hover:text-ink">
            {problem.num}. {problem.title}
          </Link>
          <span>/</span>
          <span className="text-ink">Submissions</span>
        </nav>
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            className="input select h-8 w-[144px] text-[13px]"
            value={lang}
            aria-label="Filter by language"
            onChange={(e) => {
              setLang(e.target.value)
              setPage(1)
            }}
          >
            {LANG_OPTIONS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <select
            className="input select h-8 w-[172px] text-[13px]"
            value={status}
            aria-label="Filter by status"
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <Link to={`/problems/${problem.id}`} className="btn btn-primary h-8">
            Problem Workspace
            <Icon name="arrowRight" size={14} />
          </Link>
        </div>
      </div>

      {/* Stats strip */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-hair px-4 py-2.5">
        <span className="t-ui-med tnum flex items-center gap-2 text-ink">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
          {all.length} Total Submissions
        </span>
        <span className="t-ui tnum text-ink-2">
          <span className="font-medium text-ink">{acceptedCount}</span> Accepted (
          {((acceptedCount / Math.max(1, all.length)) * 100).toFixed(1)}%)
        </span>
        <span className="t-ui tnum text-ink-2">
          Best Runtime: <span className="font-medium text-ink">{bestRuntime} ms</span>{' '}
          <span className="tag tag-green">Beats 94.2%</span>
        </span>
        <span className="t-ui tnum text-ink-2">
          Best Memory: <span className="font-medium text-ink">{bestMemory} MB</span>{' '}
          <span className="tag tag-blue">Beats 88.1%</span>
        </span>
      </div>

      {/* Main: list + details */}
      <main className="mx-auto grid w-full max-w-[1460px] grow items-start gap-5 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_460px] lg:px-8">
        <section className="min-w-0 overflow-hidden rounded-lg border border-hair bg-panel" aria-label="Submissions list">
          {rows.length === 0 ? (
            <EmptyState
              icon="history"
              title="No submissions match these filters"
              hint="Clear the language or status filter to see your full history."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="ntable">
                <thead>
                  <tr>
                    <th className="pl-4">Status</th>
                    <th>Language</th>
                    <th>Runtime</th>
                    <th className="hidden sm:table-cell">Memory</th>
                    <th className="hidden md:table-cell">Submitted</th>
                    <th className="pr-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => {
                    const isSel = s.id === selectedId
                    return (
                      <tr
                        key={s.id}
                        className={cx('cursor-pointer', isSel && 'bg-wash')}
                        tabIndex={0}
                        aria-selected={isSel}
                        onClick={() => setSelectedId(s.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setSelectedId(s.id)
                        }}
                      >
                        <td className="pl-4">
                          <span className={cx('pill', statusTone(s.status))}>
                            <Icon name={statusIcon(s.status)} size={12} />
                            {s.status}
                          </span>
                        </td>
                        <td className="t-ui text-ink-2">{s.language}</td>
                        <td className="tnum">
                          {s.runtimeMs === null ? (
                            <span className="t-ui text-ink-3">N/A</span>
                          ) : (
                            <span className="stack">
                              <span className="t-ui-med text-ink">
                                {s.runtimeMs === 2000 ? '> 2000 ms' : `${s.runtimeMs} ms`}
                              </span>
                              {s.runtimeBeats != null && (
                                <span className="t-caption text-ink-3">Beats {s.runtimeBeats}%</span>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="tnum hidden sm:table-cell">
                          {s.memoryMb === null ? (
                            <span className="t-ui text-ink-3">N/A</span>
                          ) : (
                            <span className="stack">
                              <span className="t-ui-med text-ink">{s.memoryMb} MB</span>
                              {s.memoryBeats != null && (
                                <span className="t-caption text-ink-3">Beats {s.memoryBeats}%</span>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="t-caption hidden text-ink-3 md:table-cell">{s.submitted}</td>
                        <td className="pr-4 text-right">
                          {isSel ? (
                            <span className="t-ui-med inline-flex items-center gap-1.5 text-accent">
                              Inspecting
                              <Icon name="arrowRight" size={13} />
                            </span>
                          ) : (
                            <span className="icon-btn reveal inline-flex" aria-hidden>
                              <Icon name="eye" size={15} />
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {rows.length > 0 && (
            <div className="flex items-center justify-between gap-3 border-t border-hair px-4 py-2.5">
              <span className="t-caption text-ink-3">
                Showing{' '}
                <span className="tnum text-ink-2">
                  {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(filtered.length, currentPage * PAGE_SIZE)}
                </span>{' '}
                of <span className="tnum text-ink-2">{filtered.length}</span> submissions
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm h-7"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  <Icon name="chevronLeft" size={13} />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={cx(
                      'tnum h-7 min-w-7 rounded px-2 text-[13px]',
                      i + 1 === currentPage ? 'bg-accent text-on-accent' : 'text-ink-2 hover:bg-wash',
                    )}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm h-7"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  <Icon name="chevronRight" size={13} />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Details panel */}
        <aside className="stack min-w-0 gap-4 lg:sticky lg:top-4" aria-label="Submission details">
          <div className="flex items-center justify-between gap-3">
            <h2 className="t-h3 text-ink">Submission Details</h2>
            {selected ? (
              <button
                type="button"
                className="btn btn-ghost btn-sm h-7"
                onClick={() => setSelectedId(null)}
                aria-label="Close submission details"
              >
                <span className="kbd">ESC</span>
                <Icon name="x" size={13} />
              </button>
            ) : null}
          </div>

          {!selected ? (
            <div className="card">
              <EmptyState
                icon="search"
                title="No submission selected"
                hint="Pick a row from the list to inspect its result, distribution and code."
              />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className={cx('pill', statusTone(selected.status))}>
                  <Icon name={statusIcon(selected.status)} size={12} />
                  {selected.status}
                </span>
                <span className="tag tag-gray tnum">#{selected.id}</span>
                <span className="t-caption text-ink-3">
                  Submitted {selected.submitted} • {selected.language}
                </span>
              </div>

              <section className="card stack gap-4 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={cx(
                      'center h-8 w-8 rounded-full',
                      selected.status === 'Accepted' ? 'bg-success-soft text-success' : 'bg-error-soft text-error',
                    )}
                  >
                    <Icon name={statusIcon(selected.status)} size={17} />
                  </span>
                  <span
                    className={cx(
                      'text-[20px] leading-7 font-semibold',
                      selected.status === 'Accepted' ? 'text-success' : 'text-error',
                    )}
                  >
                    {selected.status}
                  </span>
                  <span className="grow" />
                  {selected.runtimeMs !== null && (
                    <span className="t-code-tag rounded-sm bg-wash px-2 py-1 text-ink-2">
                      {selected.runtimeMs} ms
                    </span>
                  )}
                </div>

                {selected.status === 'Accepted' ? (
                  <>
                    <p className="t-ui tnum text-ink-2">57 / 57 Test Cases Passed</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-md border border-hair bg-code px-3.5 py-3">
                        <p className="t-overline text-ink-3">Runtime</p>
                        <p className="t-ui-med tnum mt-1 text-ink">{selected.runtimeMs} ms</p>
                        <p className="t-caption text-success">Beats {selected.runtimeBeats}%</p>
                      </div>
                      <div className="rounded-md border border-hair bg-code px-3.5 py-3">
                        <p className="t-overline text-ink-3">Memory</p>
                        <p className="t-ui-med tnum mt-1 text-ink">{selected.memoryMb} MB</p>
                        <p className="t-caption text-success">Beats {selected.memoryBeats}%</p>
                      </div>
                    </div>
                    <div className="stack gap-2">
                      <div className="flex items-center justify-between">
                        <p className="t-overline text-ink-3">Runtime distribution ({selected.language})</p>
                        <p className="t-code-tag text-ink-2">
                          YOUR SOLUTION: {selected.runtimeMs}MS
                        </p>
                      </div>
                      <DistributionCurve you={0.18} />
                      <div className="flex justify-between t-code-tag text-ink-3">
                        <span>20 ms</span>
                        <span className="text-accent">{selected.runtimeMs} ms (You)</span>
                        <span>120 ms</span>
                        <span>250 ms</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="t-ui text-ink-2">{STATUS_NOTE[selected.status]}</p>
                    {selected.status === 'Wrong Answer' && (
                      <div className="stack gap-1.5 rounded-md border border-hair bg-code p-3 font-mono text-[13px]">
                        <p className="text-ink-3">Expected</p>
                        <p className="rounded bg-error-soft px-1 text-error">[0, 1]</p>
                        <p className="mt-1 text-ink-3">Received</p>
                        <p className="rounded bg-error-soft px-1 text-error">[1, 0]</p>
                      </div>
                    )}
                    {selected.status === 'Compile Error' && (
                      <pre className="scroll-x overflow-x-auto rounded-md border border-hair bg-code p-3 font-mono text-[13px] leading-5 text-error">
                        {'solution.cpp:12:18: error: expected initializer before ‘]’ token\n   12 |   return {seen[comp], i};\n      |                  ^'}
                      </pre>
                    )}
                  </>
                )}
              </section>

              {/* Code card */}
              <section className="card overflow-hidden">
                <div className="flex flex-wrap items-center gap-2.5 border-b border-hair px-3 py-2.5">
                  <span className="tag tag-gray">{selected.language}</span>
                  <span className="t-code-tag text-ink-3">hashmap_twosum.py</span>
                  <span className="grow" />
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm h-7"
                    onClick={() => {
                      navigator.clipboard?.writeText(TWO_SUM_PY).catch(() => undefined)
                      push({ title: 'Code copied', tone: 'success' })
                    }}
                  >
                    <Icon name="copy" size={13} />
                    Copy
                  </button>
                  <Link to={`/problems/${problem.id}`} className="btn btn-primary btn-sm h-7">
                    <Icon name="terminalSquare" size={13} />
                    Workspace
                  </Link>
                </div>
                <div className="bg-code">
                  <CodeView code={TWO_SUM_PY} lang="python" />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                  <span className="t-code-tag text-ink-3">Compiler: Python 3.11.4</span>
                  <span className="t-code-tag flex items-center gap-1.5 text-ink-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
                    gVisor MicroVM v2.4 (sandbox)
                  </span>
                </div>
              </section>
            </>
          )}
        </aside>
      </main>

      <EngineStatusBar />
    </div>
  )
}
