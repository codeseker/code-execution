import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/icons'
import { CodeView } from '../components/Code'
import { DistributionCurve } from '../components/charts'
import { DifficultyBadge, EmptyState, cx } from '../components/ui'
import { EngineStatusBar } from '../components/shell'
import { TWO_SUM_PY, TWO_SUM_SUBMISSIONS, problemById } from '../data'
import type { SubmissionStatus } from '../data'
import CustomButton from '../components/CustomButton'
import CustomLink from '../components/CustomLink'
import { Button } from '../components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'

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
  if (status === 'Accepted') return 'bg-primary/10 text-primary'
  if (status === 'Time Limit Exceeded') return 'bg-muted text-muted-foreground'
  return 'bg-destructive/10 text-destructive'
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
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-background">
      {/* Workspace-style topbar */}
      <header className="flex h-11 flex-none items-center gap-3 border-b border-border px-3">
        <div className="flex items-center gap-0.5">
          <CustomButton variant="unstyled"
            type="button"
            className="icon-btn h-7 w-7"
            aria-label="Previous problem"
            onClick={() => navigate(`/problems/valid-parentheses`)}
          >
            <Icon name="chevronLeft" size={15} />
          </CustomButton>
          <CustomButton variant="unstyled"
            type="button"
            className="icon-btn h-7 w-7"
            aria-label="Next problem"
            onClick={() => navigate(`/problems/lru-cache`)}
          >
            <Icon name="chevronRight" size={15} />
          </CustomButton>
        </div>
        <CustomLink variant="unstyled" to="/problems" className="flex items-center gap-1.5 rounded px-1.5 py-1 hover:bg-muted/40">
          <span className="text-sm font-medium text-foreground">
            {problem.num}. {problem.title}
          </span>
          <Icon name="chevronDown" size={13} className="text-muted-foreground" />
        </CustomLink>
        <DifficultyBadge difficulty={problem.difficulty} className="hidden sm:inline-flex" />
        <nav className="ml-2 hidden items-center gap-1 lg:flex" aria-label="Problem views">
          <CustomLink variant="unstyled" to={`/problems/${problem.id}`} className="rounded px-2.5 py-1 text-[14px] text-muted-foreground hover:bg-muted/40 hover:text-foreground">
            Problems
          </CustomLink>
          <span className="rounded bg-muted/40 px-2.5 py-1 text-[14px] font-medium text-foreground">Submissions</span>
        </nav>
        <span className="grow" />
        <CustomLink variant="unstyled" to={`/problems/${problem.id}`} className="btn btn-secondary btn-sm">
          <Icon name="play" size={12} />
          Run
          <span className="kbd">⌘↵</span>
        </CustomLink>
        <CustomLink variant="unstyled" to={`/problems/${problem.id}`} className="btn btn-primary">
          <Icon name="upload" size={13} />
          Submit
        </CustomLink>
      </header>

      {/* Breadcrumb + controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <nav className="text-sm flex items-center gap-1.5 text-muted-foreground" aria-label="Breadcrumb">
          <CustomLink to="/problems" className="hover:text-foreground">
            Problems
          </CustomLink>
          <span>/</span>
          <CustomLink to={`/problems/${problem.id}`} className="hover:text-foreground">
            {problem.num}. {problem.title}
          </CustomLink>
          <span>/</span>
          <span className="text-foreground">Submissions</span>
        </nav>
        <div className="flex flex-wrap items-center gap-2.5">
          <Select
            value={lang}
            onValueChange={(value) => {
              if (value !== null) setLang(value)
              setPage(1)
            }}
          >
            <SelectTrigger className="h-8 w-[144px] text-[13px]" aria-label="Filter by language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANG_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(value) => {
              if (value !== null) setStatus(value)
              setPage(1)
            }}
          >
            <SelectTrigger className="h-8 w-[172px] text-[13px]" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
            </SelectContent>
          </Select>
          <CustomLink variant="unstyled" to={`/problems/${problem.id}`} className="btn btn-primary h-8">
            Problem Workspace
            <Icon name="arrowRight" size={14} />
          </CustomLink>
        </div>
      </div>

      {/* Stats strip */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border px-4 py-2.5">
        <span className="text-sm font-medium tabular-nums flex items-center gap-2 text-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
          {all.length} Total Submissions
        </span>
        <span className="text-sm tabular-nums text-muted-foreground">
          <span className="font-medium text-foreground">{acceptedCount}</span> Accepted (
          {((acceptedCount / Math.max(1, all.length)) * 100).toFixed(1)}%)
        </span>
        <span className="text-sm tabular-nums text-muted-foreground">
          Best Runtime: <span className="font-medium text-foreground">{bestRuntime} ms</span>{' '}
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">Beats 94.2%</span>
        </span>
        <span className="text-sm tabular-nums text-muted-foreground">
          Best Memory: <span className="font-medium text-foreground">{bestMemory} MB</span>{' '}
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">Beats 88.1%</span>
        </span>
      </div>

      {/* Main: list + details */}
      <main className="mx-auto grid w-full max-w-[1460px] grow items-start gap-5 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_460px] lg:px-8">
        <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card" aria-label="Submissions list">
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
                        className={cx('cursor-pointer', isSel && 'bg-muted/40')}
                        tabIndex={0}
                        aria-selected={isSel}
                        onClick={() => setSelectedId(s.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setSelectedId(s.id)
                        }}
                      >
                        <td className="pl-4">
                          <span className={cx('inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium', statusTone(s.status))}>
                            <Icon name={statusIcon(s.status)} size={12} />
                            {s.status}
                          </span>
                        </td>
                        <td className="text-sm text-muted-foreground">{s.language}</td>
                        <td className="tabular-nums">
                          {s.runtimeMs === null ? (
                            <span className="text-sm text-muted-foreground">N/A</span>
                          ) : (
                            <span className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">
                                {s.runtimeMs === 2000 ? '> 2000 ms' : `${s.runtimeMs} ms`}
                              </span>
                              {s.runtimeBeats != null && (
                                <span className="text-xs text-muted-foreground">Beats {s.runtimeBeats}%</span>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="tabular-nums hidden sm:table-cell">
                          {s.memoryMb === null ? (
                            <span className="text-sm text-muted-foreground">N/A</span>
                          ) : (
                            <span className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">{s.memoryMb} MB</span>
                              {s.memoryBeats != null && (
                                <span className="text-xs text-muted-foreground">Beats {s.memoryBeats}%</span>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="text-xs hidden text-muted-foreground md:table-cell">{s.submitted}</td>
                        <td className="pr-4 text-right">
                          {isSel ? (
                            <span className="text-sm font-medium inline-flex items-center gap-1.5 text-primary">
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
            <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5">
              <span className="text-xs text-muted-foreground">
                Showing{' '}
                <span className="tabular-nums text-muted-foreground">
                  {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(filtered.length, currentPage * PAGE_SIZE)}
                </span>{' '}
                of <span className="tabular-nums text-muted-foreground">{filtered.length}</span> submissions
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  <Icon name="chevronLeft" size={13} />
                </Button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button
                    key={i}
                    type="button"
                    variant={i + 1 === currentPage ? 'default' : 'ghost'}
                    size="sm"
                    className="min-w-7 px-2 tabular-nums"
                    aria-current={i + 1 === currentPage ? 'page' : undefined}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
                <CustomButton variant="unstyled"
                  type="button"
                  className="btn btn-ghost btn-sm h-7"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  <Icon name="chevronRight" size={13} />
                </CustomButton>
              </div>
            </div>
          )}
        </section>

        {/* Details panel */}
        <aside className="flex flex-col min-w-0 gap-4 lg:sticky lg:top-4" aria-label="Submission details">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Submission Details</h2>
            {selected ? (
              <CustomButton variant="unstyled"
                type="button"
                className="btn btn-ghost btn-sm h-7"
                onClick={() => setSelectedId(null)}
                aria-label="Close submission details"
              >
                <span className="kbd">ESC</span>
                <Icon name="x" size={13} />
              </CustomButton>
            ) : null}
          </div>

          {!selected ? (
            <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
              <EmptyState
                icon="search"
                title="No submission selected"
                hint="Pick a row from the list to inspect its result, distribution and code."
              />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className={cx('inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium', statusTone(selected.status))}>
                  <Icon name={statusIcon(selected.status)} size={12} />
                  {selected.status}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-0.5 text-xs text-secondary-foreground tabular-nums">#{selected.id}</span>
                <span className="text-xs text-muted-foreground">
                  Submitted {selected.submitted} • {selected.language}
                </span>
              </div>

              <section className="rounded-xl border border-border bg-card text-card-foreground shadow-sm flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={cx(
                      'center h-8 w-8 rounded-full',
                      selected.status === 'Accepted' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive',
                    )}
                  >
                    <Icon name={statusIcon(selected.status)} size={17} />
                  </span>
                  <span
                    className={cx(
                      'text-[20px] leading-7 font-semibold',
                      selected.status === 'Accepted' ? 'text-primary' : 'text-destructive',
                    )}
                  >
                    {selected.status}
                  </span>
                  <span className="grow" />
                  {selected.runtimeMs !== null && (
                    <span className="font-mono text-xs rounded-sm bg-muted/40 px-2 py-1 text-muted-foreground">
                      {selected.runtimeMs} ms
                    </span>
                  )}
                </div>

                {selected.status === 'Accepted' ? (
                  <>
                    <p className="text-sm tabular-nums text-muted-foreground">57 / 57 Test Cases Passed</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-md border border-border bg-muted/50 px-3.5 py-3">
                        <p className="text-sm font-semibold text-muted-foreground">Runtime</p>
                        <p className="text-sm font-medium tabular-nums mt-1 text-foreground">{selected.runtimeMs} ms</p>
                        <p className="text-xs text-primary">Beats {selected.runtimeBeats}%</p>
                      </div>
                      <div className="rounded-md border border-border bg-muted/50 px-3.5 py-3">
                        <p className="text-sm font-semibold text-muted-foreground">Memory</p>
                        <p className="text-sm font-medium tabular-nums mt-1 text-foreground">{selected.memoryMb} MB</p>
                        <p className="text-xs text-primary">Beats {selected.memoryBeats}%</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-muted-foreground">Runtime distribution ({selected.language})</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          YOUR SOLUTION: {selected.runtimeMs}MS
                        </p>
                      </div>
                      <DistributionCurve you={0.18} />
                      <div className="flex justify-between font-mono text-xs text-muted-foreground">
                        <span>20 ms</span>
                        <span className="text-primary">{selected.runtimeMs} ms (You)</span>
                        <span>120 ms</span>
                        <span>250 ms</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">{STATUS_NOTE[selected.status]}</p>
                    {selected.status === 'Wrong Answer' && (
                      <div className="flex flex-col gap-1.5 rounded-md border border-border bg-muted/50 p-3 font-mono text-[13px]">
                        <p className="text-muted-foreground">Expected</p>
                        <p className="rounded bg-destructive/10 px-1 text-destructive">[0, 1]</p>
                        <p className="mt-1 text-muted-foreground">Received</p>
                        <p className="rounded bg-destructive/10 px-1 text-destructive">[1, 0]</p>
                      </div>
                    )}
                    {selected.status === 'Compile Error' && (
                      <pre className="scroll-x overflow-x-auto rounded-md border border-border bg-muted/50 p-3 font-mono text-[13px] leading-5 text-destructive">
                        {'solution.cpp:12:18: error: expected initializer before ‘]’ token\n   12 |   return {seen[comp], i};\n      |                  ^'}
                      </pre>
                    )}
                  </>
                )}
              </section>

              {/* Code rounded-xl border border-border bg-card text-card-foreground shadow-sm */}
              <section className="rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
                <div className="flex flex-wrap items-center gap-2.5 border-b border-border px-3 py-2.5">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">{selected.language}</span>
                  <span className="font-mono text-xs text-muted-foreground">hashmap_twosum.py</span>
                  <span className="grow" />
                  <CustomButton variant="unstyled"
                    type="button"
                    className="btn btn-ghost btn-sm h-7"
                    onClick={() => {
                      navigator.clipboard?.writeText(TWO_SUM_PY).catch(() => undefined)
                      // push({ title: 'Code copied', tone: 'success' })
                    }}
                  >
                    <Icon name="copy" size={13} />
                    Copy
                  </CustomButton>
                  <CustomLink variant="unstyled" to={`/problems/${problem.id}`} className="btn btn-primary btn-sm h-7">
                    <Icon name="terminalSquare" size={13} />
                    Workspace
                  </CustomLink>
                </div>
                <div className="bg-muted/50">
                  <CodeView code={TWO_SUM_PY} lang="python" />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                  <span className="font-mono text-xs text-muted-foreground">Compiler: Python 3.11.4</span>
                  <span className="font-mono text-xs flex items-center gap-1.5 text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
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
