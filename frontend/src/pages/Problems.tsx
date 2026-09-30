import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PortalTopbar, SystemStatusBar } from '../components/shell'
import { DifficultyBadge, EmptyState, ProblemStatusIcon, Progress, Tag, cx } from '../components/ui'
import { Icon } from '../components/icons'
import { Donut } from '../components/charts'
import { useToast } from '../toast'
import { CONTEST, PROFILE, PROBLEMS, TRACKS } from '../data'
import type { Problem } from '../data'

const BLIND75 = new Set([
  'two-sum',
  'valid-parentheses',
  'best-time-to-buy-and-sell-stock',
  'reverse-linked-list',
  'climbing-stairs',
  'longest-substring-without-repeating-characters',
  'coin-change',
  'number-of-islands',
  'word-break',
  '3sum',
])

const ALL_TAGS = Array.from(new Set(PROBLEMS.flatMap((p) => p.tags))).sort()
const ALL_COMPANIES = Array.from(new Set(PROBLEMS.flatMap((p) => p.companies))).sort()

const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'] as const
const STATUSES = ['All', 'Solved', 'Attempted', 'Not started'] as const

type FilterState = {
  q: string
  difficulty: (typeof DIFFICULTIES)[number]
  status: (typeof STATUSES)[number]
  tags: string[]
  company: string
  track: boolean
}

const DEFAULT_FILTERS: FilterState = {
  q: '',
  difficulty: 'All',
  status: 'All',
  tags: [],
  company: 'All',
  track: false,
}

function matches(p: Problem, f: FilterState): boolean {
  const q = f.q.trim().toLowerCase()
  if (q && !(p.title.toLowerCase().includes(q) || String(p.num).includes(q) || p.tags.some((t) => t.toLowerCase().includes(q))))
    return false
  if (f.difficulty !== 'All' && p.difficulty !== f.difficulty) return false
  if (f.status === 'Solved' && p.status !== 'solved') return false
  if (f.status === 'Attempted' && p.status !== 'attempted') return false
  if (f.status === 'Not started' && p.status !== 'todo') return false
  if (f.tags.length && !f.tags.some((t) => p.tags.includes(t))) return false
  if (f.company !== 'All' && !p.companies.includes(f.company)) return false
  if (f.track && !BLIND75.has(p.id)) return false
  return true
}

export default function Problems() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [comfortable, setComfortable] = useState(true)

  const patch = (next: Partial<FilterState>) => {
    setFilters((f) => ({ ...f, ...next }))
    setPage(1)
  }

  const filtered = useMemo(() => PROBLEMS.filter((p) => matches(p, filters)), [filters])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const slice = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const dirty =
    filters.q !== '' ||
    filters.difficulty !== 'All' ||
    filters.status !== 'All' ||
    filters.tags.length > 0 ||
    filters.company !== 'All' ||
    filters.track

  const pickRandom = () => {
    const pool = filtered.length ? filtered : PROBLEMS
    const pick = pool[Math.floor(Math.random() * pool.length)]
    navigate(`/problems/${pick.id}`)
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <PortalTopbar active="Problems" />

      <main className="mx-auto w-full max-w-[1460px] grow px-4 py-6 lg:px-8">
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="stack min-w-0 gap-5">
            <PageHeader
              total={PROBLEMS.length}
              matched={filtered.length}
              onRandom={pickRandom}
              trackActive={filters.track}
              onToggleTrack={() => patch({ track: !filters.track })}
            />

            <FilterBar
              filters={filters}
              onPatch={patch}
              onReset={() => setFilters(DEFAULT_FILTERS)}
              dirty={dirty}
              comfortable={comfortable}
              onComfortable={setComfortable}
            />

            <div className="overflow-hidden rounded-lg border border-hair bg-panel">
              <ProblemTable problems={slice} comfortable={comfortable} />
            </div>

            <Pagination
              page={currentPage}
              totalPages={totalPages}
              total={filtered.length}
              pageSize={pageSize}
              onPage={setPage}
              onPageSize={(s) => {
                setPageSize(s)
                setPage(1)
              }}
            />
          </div>

          <ProgressRail />
        </div>
      </main>

      <SystemStatusBar />
    </div>
  )
}

/* ------------------------------------------------------------------ */

function PageHeader({
  total,
  matched,
  onRandom,
  trackActive,
  onToggleTrack,
}: {
  total: number
  matched: number
  onRandom: () => void
  trackActive: boolean
  onToggleTrack: () => void
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-5">
      <div className="min-w-0">
        <p className="t-code-tag flex items-center gap-2 text-ink-3">
          REPOSITORY INDEX
          <span className="h-1 w-1 rounded-full bg-ink-4" aria-hidden />
          v4.18 // {total} Problems
        </p>
        <h1 className="t-page-title mt-1.5 text-ink">Problem Bank</h1>
        <p className="t-reading mt-1.5 max-w-[560px] text-ink-2">
          Explore curated algorithmic problems, system design patterns, and company interview
          tracks engineered for technical mastery.
          {matched !== total && (
            <span className="text-ink-3"> · showing {matched} matching filter{matched === 1 ? '' : 's'}.</span>
          )}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <button type="button" className="btn btn-secondary" onClick={onRandom}>
          <Icon name="shuffle" size={14} />
          Pick Random
          <span className="kbd">⌘R</span>
        </button>
        <Link to="/problems/lru-cache" className="pill pill-accent h-8">
          <Icon name="zap" size={12} />
          Daily: 146. LRU Cache
          <span className="tag tag-green ml-1">+20 XP</span>
        </Link>
        <button
          type="button"
          className={cx('btn', trackActive ? 'btn-primary' : 'btn-secondary')}
          onClick={onToggleTrack}
          aria-pressed={trackActive}
        >
          <Icon name="book" size={14} />
          Blind 75 &amp; NeetCode 150
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function Popover({
  open,
  onClose,
  children,
  align = 'left',
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  align?: 'left' | 'right'
}) {
  if (!open) return null
  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 cursor-default"
        aria-label="Close menu"
        onClick={onClose}
      />
      <div
        className={cx(
          'absolute top-full z-50 mt-1.5 min-w-[200px] popover anim-fade-up',
          align === 'right' ? 'right-0' : 'left-0',
        )}
      >
        {children}
      </div>
    </>
  )
}

function RadioFilter({
  label,
  icon,
  options,
  value,
  onChange,
  dirty,
}: {
  label: string
  icon: Parameters<typeof Icon>[0]['name']
  options: readonly string[]
  value: string
  onChange: (v: string) => void
  dirty?: boolean
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        className={cx('btn btn-secondary h-8 gap-1.5', dirty && 'border-accent text-accent')}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name={icon} size={13} className="text-ink-3" />
        {label}: <span className="font-medium">{value}</span>
        <Icon name="chevronDown" size={12} className="text-ink-3" />
      </button>
      <Popover open={open} onClose={() => setOpen(false)}>
        <div role="menu">
          {options.map((o) => (
            <button
              key={o}
              type="button"
              className="menu-item"
              role="menuitemradio"
              aria-checked={o === value}
              onClick={() => {
                onChange(o)
                setOpen(false)
              }}
            >
              <span className="grow">{o}</span>
              {o === value && <Icon name="check" size={14} className="text-accent" />}
            </button>
          ))}
        </div>
      </Popover>
    </div>
  )
}

function TagFilter({
  options,
  selected,
  onToggle,
}: {
  options: string[]
  selected: string[]
  onToggle: (t: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        className={cx('btn btn-secondary h-8 gap-1.5', selected.length > 0 && 'border-accent text-accent')}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="tag" size={13} className="text-ink-3" />
        Tags
        {selected.length > 0 && (
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
        )}
        <Icon name="chevronDown" size={12} className="text-ink-3" />
      </button>
      <Popover open={open} onClose={() => setOpen(false)}>
        <div className="scroll-y max-h-[280px]" role="menu">
          {options.map((t) => {
            const on = selected.includes(t)
            return (
              <button
                key={t}
                type="button"
                className="menu-item"
                role="menuitemcheckbox"
                aria-checked={on}
                onClick={() => onToggle(t)}
              >
                <span
                  className={cx(
                    'center h-4 w-4 flex-none rounded-[3px] border',
                    on ? 'border-accent bg-accent text-on-accent' : 'border-line',
                  )}
                >
                  {on && <Icon name="check" size={10} strokeWidth={3} />}
                </span>
                <span className="grow">{t}</span>
              </button>
            )
          })}
        </div>
      </Popover>
    </div>
  )
}

function FilterBar({
  filters,
  onPatch,
  onReset,
  dirty,
  comfortable,
  onComfortable,
}: {
  filters: FilterState
  onPatch: (p: Partial<FilterState>) => void
  onReset: () => void
  dirty: boolean
  comfortable: boolean
  onComfortable: (v: boolean) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 rounded-lg border border-hair bg-panel px-3 py-2.5">
      <div className="relative min-w-[220px] grow">
        <Icon
          name="search"
          size={14}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-3"
        />
        <input
          className="input h-8 pl-8 pr-14"
          placeholder="Search by problem title, number, or keyword…"
          aria-label="Search problems"
          value={filters.q}
          onChange={(e) => onPatch({ q: e.target.value })}
        />
        <span className="kbd absolute top-1/2 right-2.5 -translate-y-1/2">⌘K</span>
      </div>

      <RadioFilter
        label="Difficulty"
        icon="gauge"
        options={DIFFICULTIES}
        value={filters.difficulty}
        onChange={(v) => onPatch({ difficulty: v as FilterState['difficulty'] })}
        dirty={filters.difficulty !== 'All'}
      />
      <RadioFilter
        label="Status"
        icon="checkCircle"
        options={STATUSES}
        value={filters.status}
        onChange={(v) => onPatch({ status: v as FilterState['status'] })}
        dirty={filters.status !== 'All'}
      />
      <TagFilter
        options={ALL_TAGS}
        selected={filters.tags}
        onToggle={(t) =>
          onPatch({
            tags: filters.tags.includes(t) ? filters.tags.filter((x) => x !== t) : [...filters.tags, t],
          })
        }
      />
      <RadioFilter
        label="Companies"
        icon="building"
        options={['All', ...ALL_COMPANIES]}
        value={filters.company}
        onChange={(v) => onPatch({ company: v })}
        dirty={filters.company !== 'All'}
      />

      {dirty && (
        <button type="button" className="btn btn-ghost h-8 text-ink-3" onClick={onReset}>
          Reset
        </button>
      )}

      <span className="grow" />

      <div className="flex items-center gap-1 rounded-md border border-hair p-0.5" role="group" aria-label="Row density">
        <button
          type="button"
          className={cx('icon-btn h-6 w-6', comfortable && 'bg-wash text-ink')}
          aria-label="Comfortable rows"
          aria-pressed={comfortable}
          onClick={() => onComfortable(true)}
        >
          <Icon name="list" size={14} />
        </button>
        <button
          type="button"
          className={cx('icon-btn h-6 w-6', !comfortable && 'bg-wash text-ink')}
          aria-label="Compact rows"
          aria-pressed={!comfortable}
          onClick={() => onComfortable(false)}
        >
          <Icon name="alignLeft" size={14} />
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function ProblemTable({ problems, comfortable }: { problems: Problem[]; comfortable: boolean }) {
  const navigate = useNavigate()

  if (!problems.length) {
    return (
      <EmptyState
        icon="search"
        title="No problems match your filters"
        hint="Try a different keyword, or clear the difficulty, status and tag filters."
      />
    )
  }

  const cell = comfortable ? 'py-3' : 'py-1.5'
  return (
    <table className="ntable">
      <thead>
        <tr>
          <th className="w-[52px] pl-4">Status</th>
          <th className="w-[56px]">#</th>
          <th>Title</th>
          <th className="hidden w-[110px] text-right md:table-cell">Acceptance</th>
          <th className="w-[112px]">Difficulty</th>
          <th className="hidden w-[230px] lg:table-cell">Tags</th>
          <th className="w-[64px] pr-4 text-right">Action</th>
        </tr>
      </thead>
      <tbody>
        {problems.map((p) => (
          <tr
            key={p.id}
            className="cursor-pointer"
            tabIndex={0}
            role="link"
            aria-label={`Open ${p.title}`}
            onClick={() => navigate(`/problems/${p.id}`)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigate(`/problems/${p.id}`)
            }}
          >
            <td className={cx(cell, 'pl-4')}>
              <ProblemStatusIcon status={p.status} />
            </td>
            <td className={cx(cell, 'tnum text-ink-3')}>{p.num}</td>
            <td className={cx(cell)}>
              <span className="flex flex-wrap items-center gap-2">
                <span className="t-ui-med text-ink">{p.title}</span>
                {p.daily && <span className="tag tag-blue">Daily</span>}
              </span>
            </td>
            <td className={cx(cell, 'tnum hidden text-right text-ink-2 md:table-cell')}>
              {p.acceptance.toFixed(1)}%
            </td>
            <td className={cx(cell)}>
              <DifficultyBadge difficulty={p.difficulty} />
            </td>
            <td className={cx(cell, 'hidden lg:table-cell')}>
              <span className="flex flex-wrap gap-1.5">
                {p.tags.slice(0, 3).map((t) => (
                  <Tag key={t} tone={p.topicTone[t] ?? 'gray'}>
                    {t}
                  </Tag>
                ))}
              </span>
            </td>
            <td className={cx(cell, 'pr-4 text-right')}>
              <button
                type="button"
                className="icon-btn reveal inline-flex"
                aria-label={`Open workspace for ${p.title}`}
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/problems/${p.id}`)
                }}
              >
                <Icon name="terminalSquare" size={16} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* ------------------------------------------------------------------ */

function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPage,
  onPageSize,
}: {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPage: (p: number) => void
  onPageSize: (s: number) => void
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  const pages: Array<number | 'gap'> = []
  if (totalPages <= 6) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('gap')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('gap')
    pages.push(totalPages)
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <span className="t-caption text-ink-2">
          Showing <span className="tnum font-medium text-ink">{from}–{to}</span> of{' '}
          <span className="tnum font-medium text-ink">{total}</span> problems
        </span>
        <label className="t-caption flex items-center gap-2 text-ink-2">
          Show:
          <select
            className="input select h-7 w-[104px] text-[13px]"
            value={pageSize}
            aria-label="Problems per page"
            onChange={(e) => onPageSize(Number(e.target.value))}
          >
            <option value={12}>12 / page</option>
            <option value={24}>24 / page</option>
          </select>
        </label>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="btn btn-ghost btn-sm h-7"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <Icon name="chevronLeft" size={13} />
          Prev
        </button>
        {pages.map((p, i) =>
          p === 'gap' ? (
            <span key={`gap-${i}`} className="px-1 text-ink-3">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={cx(
                'tnum h-7 min-w-7 rounded px-2 text-[13px] transition-colors',
                p === page ? 'bg-accent text-on-accent' : 'text-ink-2 hover:bg-wash',
              )}
              aria-current={p === page ? 'page' : undefined}
              onClick={() => onPage(p)}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          className="btn btn-ghost btn-sm h-7"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          Next
          <Icon name="chevronRight" size={13} />
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function ProgressRail() {
  const { push } = useToast()
  const [registered, setRegistered] = useState(false)
  const s = PROFILE.solved
  const overall = (s.done / s.total) * 100
  const levels = [
    { label: 'Easy', done: s.easy.done, total: s.easy.total, color: 'var(--success)' },
    { label: 'Medium', done: s.medium.done, total: s.medium.total, color: 'var(--warning)' },
    { label: 'Hard', done: s.hard.done, total: s.hard.total, color: 'var(--error)' },
  ]

  return (
    <aside className="stack gap-4 xl:sticky xl:top-16">
      {/* Overall progress */}
      <section className="card stack gap-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="t-h3 text-ink">Your Progress</h2>
          <span className="tag tag-gray tnum">Level 7</span>
        </div>
        <div className="flex items-center gap-5">
          <Donut
            size={112}
            thickness={10}
            segments={[
              { value: s.done, color: 'var(--accent)' },
              { value: s.total - s.done, color: 'var(--bg-active)' },
            ]}
          >
            <span className="t-h2 tnum text-ink" style={{ fontSize: 24 }}>
              {s.done}
            </span>
            <span className="t-caption text-ink-3">/ {s.total}</span>
          </Donut>
          <div className="stack gap-1">
            <p className="t-overline text-ink-3">Overall solved</p>
            <p className="t-h1 tnum text-ink">{overall.toFixed(1)}%</p>
            <p className="t-caption flex items-center gap-1 text-success">
              <Icon name="arrowUpRight" size={12} />
              Top 14% of cohort
            </p>
          </div>
        </div>
        <div className="stack gap-2.5">
          {levels.map((l) => (
            <div key={l.label} className="stack gap-1.5">
              <div className="flex justify-between t-caption">
                <span className="flex items-center gap-1.5 text-ink-2">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: l.color }} aria-hidden />
                  {l.label}
                </span>
                <span className="tnum text-ink-3">
                  {l.done} / {l.total}
                </span>
              </div>
              <div
                className="progress"
                role="progressbar"
                aria-valuenow={l.done}
                aria-valuemin={0}
                aria-valuemax={l.total}
              >
                <i style={{ width: `${(l.done / l.total) * 100}%`, background: l.color }} />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 border-t border-hair pt-4">
          <div>
            <p className="t-overline text-ink-3">Accuracy</p>
            <p className="t-h3 tnum mt-1 text-ink">{PROFILE.accuracy}%</p>
            <p className="t-caption text-ink-3">first attempt</p>
          </div>
          <div>
            <p className="t-overline text-ink-3">Streak</p>
            <p className="t-h3 tnum mt-1 text-ink">
              {PROFILE.streak} Days <span aria-hidden>🔥</span>
            </p>
            <div className="mt-1.5 flex gap-1" aria-hidden>
              {Array.from({ length: 7 }).map((_, i) => (
                <span key={i} className={cx('h-1.5 w-1.5 rounded-full', i < 6 ? 'bg-accent' : 'bg-active')} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Curated tracks */}
      <section className="card stack gap-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="t-h3 text-ink">Curated Tracks</h2>
          <Link to="/prep" className="link t-caption">
            View All
          </Link>
        </div>
        {TRACKS.map((t) => (
          <div key={t.name} className="stack gap-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="t-ui-med truncate text-ink">{t.name}</span>
              <span className="tag tag-gray tnum">
                {t.done}/{t.total}
              </span>
            </div>
            <p className="t-caption text-ink-3">{t.meta}</p>
            <Progress value={(t.done / t.total) * 100} />
          </div>
        ))}
      </section>

      {/* Live competition */}
      <section className="card stack gap-3 p-5">
        <p className="t-overline flex items-center gap-2 text-ink-3">
          <Icon name="trophy" size={13} />
          Live competition
        </p>
        <div className="stack gap-1.5">
          <h3 className="t-h3 text-ink">{CONTEST.name}</h3>
          <p className="t-caption text-ink-2">{CONTEST.meta}</p>
          <p className="t-code-tag flex items-center gap-2 text-ink-2">
            <Icon name="clock" size={13} />
            {CONTEST.starts}
          </p>
        </div>
        <button
          type="button"
          className={cx('btn btn-block', registered ? 'btn-secondary' : 'btn-primary')}
          onClick={() => {
            if (registered) return
            setRegistered(true)
            push({
              title: `Registered for ${CONTEST.name}`,
              description: 'We will remind you 15 minutes before the start.',
              tone: 'success',
            })
          }}
        >
          {registered ? (
            <>
              <Icon name="check" size={14} />
              Registered
            </>
          ) : (
            <>
              Register Now
              <Icon name="arrowRight" size={14} />
            </>
          )}
        </button>
      </section>
    </aside>
  )
}
