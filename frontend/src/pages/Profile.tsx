import { useMemo, useState } from 'react'

import { DifficultyBadge, Progress, Tag, cx } from '../components/ui'
import { Icon } from '../components/icons'
import { Heatmap } from '../components/charts'
import {
  BADGES,
  PROFILE,
  PROFILE_SUBMISSIONS,
  PROBLEMS,
  SOLVED_BY_TOPIC,
  buildHeatmap,
} from '../data'
import type { SubmissionStatus } from '../data'
import CustomButton from '../components/ui/CustomButton'
import CustomLink from '../components/ui/CustomLink'

type ActivityTab = 'Recent Submissions' | 'Solved Problems' | 'Badges'

const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function SubStatusPill({ status }: { status: SubmissionStatus }) {
  const tone =
    status === 'Accepted' ? 'pill-success' : status === 'Time Limit Exceeded' ? 'pill-warning' : 'pill-error'
  const icon =
    status === 'Accepted' ? 'checkCircle' : status === 'Time Limit Exceeded' ? 'timer' : 'xCircle'
  return (
    <span className={cx('pill', tone)}>
      <Icon name={icon} size={12} />
      {status}
    </span>
  )
}

export default function Profile() {
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState(PROFILE.bio)
  const [year, setYear] = useState<'2024' | '2023'>('2024')
  const [tab, setTab] = useState<ActivityTab>('Recent Submissions')

  // Stable pseudo-random activity grid per selected year.
  const grid = useMemo(() => buildHeatmap(year === '2024' ? 20240412 : 20230107), [year])

  const solved = PROBLEMS.filter((p) => p.status === 'solved')

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-canvas">
      <main className="mx-auto w-full max-w-[1280px] grow px-4 py-6 lg:px-8">
        <div className="stack gap-4">
          {/* -------- Identity card -------- */}
          <section className="card p-5 lg:p-6">
            <div className="flex flex-wrap items-start gap-5">
              <div className="relative">
                <span
                  className="center h-20 w-20 rounded-full text-[26px] font-semibold text-ink"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent-soft), var(--bg-wash))',
                    boxShadow: 'inset 0 0 0 2px var(--accent)',
                  }}
                >
                  {PROFILE.name.split(' ').map((p) => p[0]).join('')}
                </span>
                <span
                  className="absolute right-0.5 bottom-0.5 h-4 w-4 rounded-full border-[3px] border-panel bg-success"
                  title="Active now"
                  aria-label="Active now"
                />
              </div>

              <div className="min-w-0 grow stack gap-2.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <h1 className="t-h1 text-ink">{PROFILE.name}</h1>
                  <span className="t-ui text-ink-3">{PROFILE.handle}</span>
                  <span className="pill pill-accent">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
                    {PROFILE.title}
                  </span>
                </div>

                {editing ? (
                  <div className="stack max-w-[640px] gap-2">
                    <textarea
                      className="input min-h-[72px] py-2"
                      value={bio}
                      aria-label="Bio"
                      onChange={(e) => setBio(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <CustomButton variant="unstyled"
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setEditing(false)
                          // push({ title: 'Profile updated', tone: 'success' })
                        }}
                      >
                        Save changes
                      </CustomButton>
                      <CustomButton variant="unstyled"
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setBio(PROFILE.bio)
                          setEditing(false)
                        }}
                      >
                        Cancel
                      </CustomButton>
                    </div>
                  </div>
                ) : (
                  <p className="t-reading max-w-[640px] text-ink-2">{bio}</p>
                )}

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 t-ui text-ink-2">
                  <span className="flex items-center gap-1.5">
                    <Icon name="mapPin" size={14} className="text-ink-3" />
                    {PROFILE.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Icon name="calendar" size={14} className="text-ink-3" />
                    {PROFILE.joined}
                  </span>
                  <a
                    href={`https://${PROFILE.github}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 hover:text-ink"
                  >
                    <Icon name="github" size={14} className="text-ink-3" />
                    {PROFILE.github}
                  </a>
                </div>
              </div>

              <div className="flex flex-none gap-2">
                <CustomButton variant="unstyled" type="button" className="btn btn-secondary" onClick={() => setEditing((v) => !v)}>
                  <Icon name="pencil" size={13} />
                  {editing ? 'Close editor' : 'Edit Profile'}
                </CustomButton>
                <CustomButton variant="unstyled"
                  type="button"
                  className="btn btn-primary"
                  // onClick={() => push({ title: 'Profile link copied', description: 'codeforge.io/u/alex_dev', tone: 'success' })}
                >
                  <Icon name="share" size={13} />
                  Share
                </CustomButton>
              </div>
            </div>
          </section>

          <StatCards />

          <HeatmapCard year={year} onYear={setYear} grid={grid} />

          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
            <ActivityCard tab={tab} onTab={setTab} solved={solved} />
            <div className="stack gap-4">
              <TopicsCard />
              <BadgesCard onShowAll={() => setTab('Badges')} />
            </div>
          </div>
        </div>
      </main>

    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Four headline stat cards                                            */
/* ------------------------------------------------------------------ */

function StatCards() {
  const s = PROFILE.solved
  const levels = [
    { label: 'Easy', ...s.easy, color: 'var(--success)' },
    { label: 'Medium', ...s.medium, color: 'var(--warning)' },
    { label: 'Hard', ...s.hard, color: 'var(--error)' },
  ]
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* Problems solved */}
      <section className="card stack gap-3 p-5">
        <div className="flex items-center justify-between">
          <p className="t-overline text-ink-3">Problems Solved</p>
          <span className="tag tag-green tnum">{((s.done / s.total) * 100).toFixed(1)}% Done</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="t-page-title-m tnum text-ink">{s.done}</span>
          <span className="t-ui tnum text-ink-3">/ {s.total}</span>
        </div>
        <Progress value={(s.done / s.total) * 100} />
        <div className="stack gap-2 border-t border-hair pt-3">
          {levels.map((l) => (
            <div key={l.label} className="stack gap-1">
              <div className="flex justify-between t-caption">
                <span className="flex items-center gap-1.5 text-ink-2">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: l.color }} aria-hidden />
                  {l.label}
                </span>
                <span className="tnum text-ink-3">
                  {l.done} / {l.total}
                </span>
              </div>
              <div className="progress h-1.5">
                <i style={{ width: `${(l.done / l.total) * 100}%`, background: l.color }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Accuracy */}
      <section className="card stack gap-3 p-5">
        <div className="flex items-center justify-between">
          <p className="t-overline text-ink-3">Accuracy</p>
          <span className="tag tag-purple">Top 12%</span>
        </div>
        <span className="t-page-title-m tnum text-ink">{PROFILE.accuracy}%</span>
        <p className="t-caption text-ink-2">First-attempt acceptance rate across all tested submissions.</p>
        <div className="mt-auto stack gap-2 border-t border-hair pt-3">
          <div className="flex justify-between t-caption">
            <span className="text-ink-2">Pass Rate Index</span>
            <span className="text-success">High Accuracy</span>
          </div>
          <Progress value={PROFILE.accuracy} />
        </div>
      </section>

      {/* Streak */}
      <section className="card stack gap-3 p-5">
        <div className="flex items-center justify-between">
          <p className="t-overline text-ink-3">Solve Streak</p>
          <span className="tag tag-orange">
            <span aria-hidden>🔥</span> Active
          </span>
        </div>
        <span className="t-page-title-m tnum text-ink">{PROFILE.streak} Days</span>
        <p className="t-caption text-ink-2">
          Longest consecutive streak: <span className="tnum">{PROFILE.longestStreak} days</span>
        </p>
        <div className="mt-auto stack gap-2 border-t border-hair pt-3">
          <p className="t-overline text-ink-3">This week</p>
          <div className="flex justify-between">
            {PROFILE.week.map((done, i) => (
              <span key={i} className="stack items-center gap-1">
                <span
                  className={cx(
                    'center h-6 w-6 rounded-full text-[11px]',
                    done ? 'bg-accent text-on-accent' : 'border border-hair bg-wash text-ink-4',
                  )}
                  aria-label={done ? 'Solved' : 'No activity'}
                >
                  {done ? <Icon name="check" size={11} strokeWidth={3} /> : ''}
                </span>
                <span className="t-caption text-ink-3">{WEEK_LABELS[i]}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Global standing */}
      <section className="card stack gap-3 p-5">
        <div className="flex items-center justify-between">
          <p className="t-overline text-ink-3">Global Standing</p>
          <span className="tag tag-blue">{PROFILE.topPercent}</span>
        </div>
        <span className="t-page-title-m tnum text-ink">{PROFILE.rank}</span>
        <p className="t-caption text-ink-2">
          Contest Rating: <span className="tnum font-medium text-ink">{PROFILE.rating}</span>
        </p>
        <div className="mt-auto flex items-center justify-between border-t border-hair pt-3">
          <span className="t-ui text-ink-2">Attended Contests</span>
          <span className="t-ui-med tnum text-ink">{PROFILE.contests} events</span>
        </div>
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Submission heatmap                                                  */
/* ------------------------------------------------------------------ */

const YEAR_STATS = {
  2024: { subs: 1248, days: 184 },
  2023: { subs: 942, days: 151 },
} as const

function HeatmapCard({
  year,
  onYear,
  grid,
}: {
  year: '2024' | '2023'
  onYear: (y: '2024' | '2023') => void
  grid: number[][]
}) {
  const stats = YEAR_STATS[year]
  return (
    <section className="card stack gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="t-h3 text-ink">
            <span className="tnum">{stats.subs.toLocaleString()}</span> Submissions in the past year
          </h2>
          <p className="t-caption mt-1 text-ink-2">
            Active days: <span className="tnum">{stats.days} / 365</span> ({((stats.days / 365) * 100).toFixed(1)}%) ·
            Max streak: <span className="tnum">{PROFILE.longestStreak} days</span>
          </p>
        </div>
        <div className="seg" role="tablist" aria-label="Year">
          {(['2024', '2023'] as const).map((y) => (
            <CustomButton variant="unstyled"
              key={y}
              type="button"
              role="tab"
              aria-selected={year === y}
              className={cx('seg-btn tnum', year === y && 'is-active')}
              onClick={() => onYear(y)}
            >
              {y}
            </CustomButton>
          ))}
        </div>
      </div>
      <Heatmap grid={grid} />
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Activity card: recent submissions / solved problems / badges        */
/* ------------------------------------------------------------------ */

function ActivityCard({
  tab,
  onTab,
  solved,
}: {
  tab: ActivityTab
  onTab: (t: ActivityTab) => void
  solved: typeof PROBLEMS
}) {
  const tabs: Array<{ id: ActivityTab; icon: Parameters<typeof Icon>[0]['name']; badge?: string }> = [
    { id: 'Recent Submissions', icon: 'history' },
    { id: 'Solved Problems', icon: 'checkCircle' },
    { id: 'Badges', icon: 'award', badge: String(BADGES.length) },
  ]
  return (
    <section className="card min-w-0">
      <div className="flex gap-1 overflow-x-auto border-b border-hair px-3 pt-1.5">
        {tabs.map((t) => (
          <CustomButton variant="unstyled"
            key={t.id}
            type="button"
            className={cx('tab flex-none', tab === t.id && 'is-active')}
            aria-current={tab === t.id}
            onClick={() => onTab(t.id)}
          >
            <Icon name={t.icon} size={14} />
            {t.id}
            {t.badge && <span className="tag tag-gray tnum">{t.badge}</span>}
          </CustomButton>
        ))}
      </div>

      <div className="p-4">
        {tab === 'Recent Submissions' && (
          <div className="stack gap-3">
            <div className="overflow-x-auto">
              <table className="ntable">
                <thead>
                  <tr>
                    <th className="pl-2">Problem</th>
                    <th>Status</th>
                    <th className="hidden sm:table-cell">Language</th>
                    <th className="hidden sm:table-cell">Runtime</th>
                    <th className="pr-2 text-right">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {PROFILE_SUBMISSIONS.map((s) => (
                    <tr key={s.id}>
                      <td className="pl-2">
                        <CustomLink
                          to={`/problems/${s.problemId}`}
                          className="flex items-center gap-2.5 hover:text-accent"
                        >
                          <span className="t-code-tag tnum text-ink-3">{s.problemNum}.</span>
                          <span className="t-ui-med text-ink">{s.problemTitle}</span>
                        </CustomLink>
                      </td>
                      <td>
                        <SubStatusPill status={s.status} />
                      </td>
                      <td className="t-ui hidden text-ink-2 sm:table-cell">{s.language}</td>
                      <td className="t-ui tnum hidden text-ink-2 sm:table-cell">
                        {s.runtimeMs === null ? 'N/A' : `${s.runtimeMs} ms`}
                      </td>
                      <td className="t-caption pr-2 text-right whitespace-nowrap text-ink-3">{s.submitted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="t-caption text-ink-3">Showing latest {PROFILE_SUBMISSIONS.length} submissions</span>
              <CustomLink to="/problems/two-sum/submissions" className="link t-ui-med inline-flex items-center gap-1.5">
                View all submissions
                <Icon name="arrowRight" size={13} />
              </CustomLink>
            </div>
          </div>
        )}

        {tab === 'Solved Problems' && (
          <ul className="stack gap-1">
            {solved.map((p) => (
              <li key={p.id}>
                <CustomLink variant="unstyled"
                  to={`/problems/${p.id}`}
                  className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-wash"
                >
                  <span className="t-code-tag tnum text-ink-3">{p.num}</span>
                  <span className="t-ui-med min-w-0 grow truncate text-ink">{p.title}</span>
                  <Tag tone={p.topicTone[p.tags[0]] ?? 'gray'}>{p.tags[0]}</Tag>
                  <DifficultyBadge difficulty={p.difficulty} />
                </CustomLink>
              </li>
            ))}
          </ul>
        )}

        {tab === 'Badges' && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {BADGES.map((b) => (
              <div key={b.name} className="stack items-center gap-1.5 rounded-md border border-hair bg-code px-3 py-4 text-center">
                <span className="text-[24px]" aria-hidden>
                  {b.icon}
                </span>
                <span className="t-caption truncate font-medium text-ink">{b.name}</span>
                <span className="t-caption text-ink-3">{b.meta}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Right rail: topics + recent badges                                  */
/* ------------------------------------------------------------------ */

function TopicsCard() {
  return (
    <section className="card stack gap-3.5 p-5">
      <div className="flex items-center justify-between">
        <h2 className="t-h3 text-ink">Solved by Topic</h2>
        <span className="t-caption text-ink-3">Top Areas</span>
      </div>
      {SOLVED_BY_TOPIC.map((t) => (
        <div key={t.topic} className="stack gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="t-ui truncate text-ink">{t.topic}</span>
            <span className="t-caption tnum shrink-0 text-ink-3">
              {t.done} ({t.percent}%)
            </span>
          </div>
          <Progress value={t.percent} className="h-1.5" />
        </div>
      ))}
    </section>
  )
}

function BadgesCard({ onShowAll }: { onShowAll: () => void }) {
  return (
    <section className="card stack gap-3.5 p-5">
      <div className="flex items-center justify-between">
        <h2 className="t-h3 text-ink">Recent Badges</h2>
        <CustomButton variant="unstyled" type="button" className="link t-caption" onClick={onShowAll}>
          All ({BADGES.length})
        </CustomButton>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {BADGES.slice(0, 3).map((b) => (
          <div key={b.name} className="stack items-center gap-1.5 rounded-md border border-hair bg-code px-2 py-3 text-center">
            <span className="text-[22px]" aria-hidden>
              {b.icon}
            </span>
            <span className="t-caption w-full truncate font-medium text-ink">{b.name}</span>
            <span className="t-caption text-ink-3">{b.meta}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
