import { useState } from 'react'
import type { ReactNode } from 'react'
import { PortalTopbar, SystemStatusBar } from '../components/shell'
import { Icon } from '../components/icons'
import { Progress, Tag, cx } from '../components/ui'
import { useToast } from '../toast'
import { CONTESTS, DISCUSS_THREADS, PREP_TRACKS } from '../data'

function PageShell({ active, children }: { active?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <PortalTopbar active={active} />
      <main className="mx-auto w-full max-w-[1080px] grow px-4 py-8 lg:px-8">{children}</main>
      <SystemStatusBar />
    </div>
  )
}

function PageHead({ overline, title, sub, action }: { overline: string; title: string; sub: string; action?: ReactNode }) {
  return (
    <div className="stack gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-[640px]">
          <p className="t-code-tag text-ink-3">{overline}</p>
          <h1 className="t-page-title mt-1.5 text-ink">{title}</h1>
          <p className="t-reading mt-1.5 text-ink-2">{sub}</p>
        </div>
        {action}
      </div>
    </div>
  )
}

/* ================================================================== */
/* Contests                                                            */
/* ================================================================== */

const LEADERBOARD = [
  { rank: 1, handle: '@avance', score: 184, time: '71:12' },
  { rank: 2, handle: '@chen_w', score: 176, time: '74:48' },
  { rank: 3, handle: '@alex_dev', score: 171, time: '77:05' },
  { rank: 4, handle: '@sarah_k', score: 164, time: '80:31' },
  { rank: 5, handle: '@elena_r', score: 152, time: '84:57' },
]

export function Contests() {
  const { push } = useToast()
  const [registered, setRegistered] = useState<Record<string, boolean>>(
    Object.fromEntries(CONTESTS.map((c) => [c.name, c.registered])),
  )

  return (
    <PageShell active="Contests">
      <PageHead
        overline="LIVE COMPETITION"
        title="Contests"
        sub="Weekly and biweekly rated rounds, plus the daily challenge. Register once — we remind you before start."
      />

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {CONTESTS.map((c) => (
          <article key={c.name} className="card stack gap-3 p-5">
            <div className="flex items-center justify-between gap-3">
              <span
                className={cx(
                  'pill',
                  c.live ? 'pill-success' : c.when.startsWith('Ended') ? 'pill-neutral' : 'pill-accent',
                )}
              >
                {c.live && (
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" aria-hidden />
                )}
                {c.when}
              </span>
              <Icon name="trophy" size={17} className="text-ink-3" />
            </div>
            <div>
              <h2 className="t-h3 text-ink">{c.name}</h2>
              <p className="t-caption mt-1 text-ink-2">
                {c.problems} problems · {c.duration} · rating eligible
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Arrays', 'DP', 'Graphs', 'Greedy'].slice(0, c.problems === 1 ? 1 : 4).map((t) => (
                <Tag key={t} tone="blue">
                  {t}
                </Tag>
              ))}
            </div>
            <button
              type="button"
              className={cx('btn btn-block', registered[c.name] ? 'btn-secondary' : 'btn-primary')}
              onClick={() => {
                if (c.when.startsWith('Ended')) {
                  push({ title: `${c.name} results`, description: 'You placed #128 · rating +14.', tone: 'neutral' })
                  return
                }
                if (registered[c.name]) {
                  push({ title: `Leaving ${c.name}`, tone: 'neutral' })
                  setRegistered((r) => ({ ...r, [c.name]: false }))
                } else {
                  push({ title: `Registered for ${c.name}`, description: 'Reminder set for 15 minutes before start.', tone: 'success' })
                  setRegistered((r) => ({ ...r, [c.name]: true }))
                }
              }}
            >
              {c.when.startsWith('Ended')
                ? 'See results'
                : registered[c.name]
                  ? (
                    <>
                      <Icon name="check" size={14} />
                      Registered
                    </>
                  )
                  : (
                    <>
                      Register now
                      <Icon name="arrowRight" size={14} />
                    </>
                  )}
            </button>
          </article>
        ))}
      </div>

      <section className="card mt-6 overflow-hidden">
        <div className="border-b border-hair px-5 py-4">
          <h2 className="t-h3 text-ink">Weekly Contest 401 — final standings</h2>
          <p className="t-caption text-ink-2">Top 5 of 4,218 participants</p>
        </div>
        <table className="ntable">
          <thead>
            <tr>
              <th className="pl-5">Rank</th>
              <th>Handle</th>
              <th className="text-right">Score</th>
              <th className="pr-5 text-right">Time</th>
            </tr>
          </thead>
          <tbody>
            {LEADERBOARD.map((row) => (
              <tr key={row.handle} className={row.handle === '@alex_dev' ? 'bg-accent-soft' : undefined}>
                <td className="t-num tnum pl-5 font-medium text-ink">#{row.rank}</td>
                <td className="t-ui-med text-ink">{row.handle}</td>
                <td className="t-ui tnum text-right text-ink-2">{row.score}</td>
                <td className="t-ui tnum pr-5 text-right text-ink-2">{row.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </PageShell>
  )
}

/* ================================================================== */
/* Discuss                                                             */
/* ================================================================== */

const THREAD_TONES: Record<string, string> = {
  Intuition: 'green',
  Question: 'blue',
  Interview: 'orange',
  Article: 'purple',
  Contest: 'pink',
}

export function Discuss() {
  const { push } = useToast()
  const [filter, setFilter] = useState('All')
  const categories = ['All', 'Intuition', 'Question', 'Interview', 'Article', 'Contest']
  const threads = DISCUSS_THREADS.filter((t) => filter === 'All' || t.tag === filter)

  return (
    <PageShell active="Discuss">
      <PageHead
        overline="COMMUNITY"
        title="Discuss"
        sub="Patterns, post-mortems and interview debriefs from engineers grinding the same ladder."
        action={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => push({ title: 'Composer opened', description: 'Draft posts are demo-only in this build.', tone: 'neutral' })}
          >
            <Icon name="plus" size={14} />
            New post
          </button>
        }
      />

      <div className="mt-6 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            className={cx('btn btn-sm h-7 rounded-full', filter === c ? 'btn-primary' : 'btn-secondary')}
            aria-pressed={filter === c}
            onClick={() => setFilter(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <section className="card mt-4 overflow-hidden">
        {threads.map((t, i) => (
          <article
            key={t.title}
            className={cx(
              'flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 transition-colors hover:bg-wash',
              i > 0 && 'border-t border-hair',
            )}
            onClick={() => push({ title: 'Thread opened', description: t.title, tone: 'neutral' })}
          >
            <div className="min-w-0 grow stack gap-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="t-ui-med truncate text-ink">{t.title}</h2>
                <Tag tone={THREAD_TONES[t.tag] ?? 'gray'}>{t.tag}</Tag>
              </div>
              <p className="t-caption text-ink-3">
                {t.author} · {t.age} ago
              </p>
            </div>
            <div className="flex items-center gap-5">
              <span className="t-caption tnum flex items-center gap-1.5 text-ink-2">
                <Icon name="arrowUpRight" size={13} className="text-ink-3" />
                {t.votes}
              </span>
              <span className="t-caption tnum flex items-center gap-1.5 text-ink-2">
                <Icon name="message" size={13} className="text-ink-3" />
                {t.replies}
              </span>
              <Icon name="chevronRight" size={15} className="text-ink-3" />
            </div>
          </article>
        ))}
        {!threads.length && <p className="t-ui px-5 py-10 text-center text-ink-3">No threads in this category yet.</p>}
      </section>
    </PageShell>
  )
}

/* ================================================================== */
/* Interview Prep                                                      */
/* ================================================================== */

const WEEK_PLAN = [
  { label: 'Solve 3 sliding-window problems', done: true },
  { label: 'Revisit LRU Cache from memory', done: true },
  { label: 'One system design write-up', done: false },
  { label: 'Mock interview (45 min)', done: false },
]

export function InterviewPrep() {
  const { push } = useToast()
  const [plan, setPlan] = useState(WEEK_PLAN)
  const done = plan.filter((p) => p.done).length

  return (
    <PageShell active="Interview Prep">
      <PageHead
        overline="STUDY PLAN"
        title="Interview Prep"
        sub="Structured tracks with spaced repetition — finish a track, unlock the next mock interview."
        action={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => push({ title: 'Mock interview scheduled', description: '45 min · Thursday 6:00 PM · systems track.', tone: 'success' })}
          >
            <Icon name="play" size={13} />
            Start mock interview
          </button>
        }
      />

      <div className="mt-8 grid items-start gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <section className="stack gap-3">
          {PREP_TRACKS.map((t) => (
            <article key={t.name} className="card stack gap-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="t-h3 text-ink">{t.name}</h2>
                  <p className="t-caption text-ink-2">{t.meta}</p>
                </div>
                <span className="tag tag-gray tnum">
                  {t.done}/{t.lessons}
                </span>
              </div>
              <Progress value={(t.done / t.lessons) * 100} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="t-caption text-ink-3">
                  {t.lessons - t.done} lessons remaining
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => push({ title: `Resuming ${t.name}`, description: 'Picking up at the next lesson.', tone: 'neutral' })}
                >
                  Resume track
                  <Icon name="arrowRight" size={13} />
                </button>
              </div>
            </article>
          ))}
        </section>

        <div className="stack gap-4">
          <section className="card stack gap-3 p-5">
            <div className="flex items-center justify-between">
              <h2 className="t-h3 text-ink">This week</h2>
              <span className="tag tag-blue tnum">
                {done}/{plan.length}
              </span>
            </div>
            <ul className="stack gap-2.5">
              {plan.map((item, i) => (
                <li key={item.label}>
                  <label className="flex cursor-pointer items-start gap-2.5 t-ui text-ink-2">
                    <input
                      type="checkbox"
                      className="checkbox mt-0.5"
                      checked={item.done}
                      onChange={(e) =>
                        setPlan((list) => list.map((p, idx) => (idx === i ? { ...p, done: e.target.checked } : p)))
                      }
                    />
                    <span className={item.done ? 'text-ink-3 line-through' : ''}>{item.label}</span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="border-t border-hair pt-3">
              <Progress value={(done / plan.length) * 100} />
              <p className="t-caption mt-2 text-ink-3">
                {done === plan.length ? 'Week complete — streak extended to 15 days 🔥' : 'Keep the streak alive — finish before Sunday.'}
              </p>
            </div>
          </section>

          <section className="card stack gap-3 p-5">
            <div className="flex items-center gap-2.5">
              <span className="center h-8 w-8 rounded-md bg-accent-soft text-accent">
                <Icon name="graduation" size={16} />
              </span>
              <h2 className="t-h3 text-ink">System Design 101</h2>
            </div>
            <p className="t-ui text-ink-2">
              4 / 25 lessons done. Next up: consistent hashing &amp; cache invalidation.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => push({ title: 'Lesson opened', description: 'Consistent hashing & cache invalidation.', tone: 'neutral' })}
            >
              Continue learning
            </button>
          </section>
        </div>
      </div>
    </PageShell>
  )
}
