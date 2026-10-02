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
import CustomLink from '../components/CustomLink'
import { Button } from '../components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Textarea } from '../components/ui/textarea'

type ActivityTab = 'Recent Submissions' | 'Solved Problems' | 'Badges'

const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function SubStatusPill({ status }: { status: SubmissionStatus }) {
  const tone =
    status === 'Accepted' ? 'bg-primary/10 text-primary' : status === 'Time Limit Exceeded' ? 'bg-muted text-muted-foreground' : 'bg-destructive/10 text-destructive'
  const icon =
    status === 'Accepted' ? 'checkCircle' : status === 'Time Limit Exceeded' ? 'timer' : 'xCircle'
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium', tone)}>
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
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-background">
      <main className="mx-auto w-full max-w-[1280px] grow px-4 py-6 lg:px-8">
        <div className="flex flex-col gap-4">
          {/* -------- Identity card -------- */}
          <section className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-5 lg:p-6">
            <div className="flex flex-wrap items-start gap-5">
              <div className="relative">
                <span className="inline-flex size-20 items-center justify-center rounded-full bg-secondary text-xl font-semibold text-secondary-foreground ring-2 ring-primary">
                  {PROFILE.name.split(' ').map((p) => p[0]).join('')}
                </span>
                <span
                  className="absolute bottom-0 right-0 size-4 rounded-full border-2 border-card bg-primary"
                  title="Active now"
                  aria-label="Active now"
                />
              </div>

              <div className="min-w-0 grow flex flex-col gap-2.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">{PROFILE.name}</h1>
                  <span className="text-sm text-muted-foreground">{PROFILE.handle}</span>
                  <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium bg-primary/10 text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                    {PROFILE.title}
                  </span>
                </div>

                {editing ? (
                  <div className="flex flex-col max-w-[640px] gap-2">
                    <Textarea
                      className="min-h-[72px]"
                      value={bio}
                      aria-label="Bio"
                      onChange={(e) => setBio(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setEditing(false)
                          // push({ title: 'Profile updated', tone: 'success' })
                        }}
                      >
                        Save changes
                      </Button>
                      <Button
                        variant="outline"
                        type="button"
                        size="sm"
                        onClick={() => {
                          setBio(PROFILE.bio)
                          setEditing(false)
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-7 max-w-[640px] text-muted-foreground">{bio}</p>
                )}

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Icon name="mapPin" size={14} className="text-muted-foreground" />
                    {PROFILE.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Icon name="calendar" size={14} className="text-muted-foreground" />
                    {PROFILE.joined}
                  </span>
                  <a
                    href={`https://${PROFILE.github}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 hover:text-foreground"
                  >
                    <Icon name="github" size={14} className="text-muted-foreground" />
                    {PROFILE.github}
                  </a>
                </div>
              </div>

              <div className="flex flex-none gap-2">
                <Button variant="outline" type="button" onClick={() => setEditing((v) => !v)}>
                  <Icon name="pencil" size={13} />
                  {editing ? 'Close editor' : 'Edit Profile'}
                </Button>
                <Button
                  type="button"
                  variant="default"
                  // onClick={() => push({ title: 'Profile link copied', description: 'codeforge.io/u/alex_dev', tone: 'success' })}
                >
                  <Icon name="share" size={13} />
                  Share
                </Button>
              </div>
            </div>
          </section>

          <StatCards />

          <HeatmapCard year={year} onYear={setYear} grid={grid} />

          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
            <ActivityCard tab={tab} onTab={setTab} solved={solved} />
            <div className="flex flex-col gap-4">
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
    { label: 'Easy', ...s.easy, barClass: 'bg-chart-1' },
    { label: 'Medium', ...s.medium, barClass: 'bg-chart-2' },
    { label: 'Hard', ...s.hard, barClass: 'bg-chart-3' },
  ]
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* Problems solved */}
      <section className="rounded-xl border border-border bg-card text-card-foreground shadow-sm flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-muted-foreground">Problems Solved</p>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-0.5 text-xs text-secondary-foreground tabular-nums">{((s.done / s.total) * 100).toFixed(1)}% Done</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">{s.done}</span>
          <span className="text-sm tabular-nums text-muted-foreground">/ {s.total}</span>
        </div>
        <Progress value={(s.done / s.total) * 100} />
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          {levels.map((l) => (
            <div key={l.label} className="flex flex-col gap-1">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className={cx('size-1.5 rounded-full', l.barClass)} aria-hidden />
                  {l.label}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {l.done} / {l.total}
                </span>
              </div>
              <Progress value={(l.done / l.total) * 100} className="h-1.5" barClassName={l.barClass} />
            </div>
          ))}
        </div>
      </section>

      {/* Accuracy */}
      <section className="rounded-xl border border-border bg-card text-card-foreground shadow-sm flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-muted-foreground">Accuracy</p>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">Top 12%</span>
        </div>
        <span className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">{PROFILE.accuracy}%</span>
        <p className="text-xs text-muted-foreground">First-attempt acceptance rate across all tested submissions.</p>
        <div className="mt-auto flex flex-col gap-2 border-t border-border pt-3">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Pass Rate Index</span>
            <span className="text-primary">High Accuracy</span>
          </div>
          <Progress value={PROFILE.accuracy} />
        </div>
      </section>

      {/* Streak */}
      <section className="rounded-xl border border-border bg-card text-card-foreground shadow-sm flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-muted-foreground">Solve Streak</p>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
            <span aria-hidden>🔥</span> Active
          </span>
        </div>
        <span className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">{PROFILE.streak} Days</span>
        <p className="text-xs text-muted-foreground">
          Longest consecutive streak: <span className="tabular-nums">{PROFILE.longestStreak} days</span>
        </p>
        <div className="mt-auto flex flex-col gap-2 border-t border-border pt-3">
          <p className="text-sm font-semibold text-muted-foreground">This week</p>
          <div className="flex justify-between">
            {PROFILE.week.map((done, i) => (
              <span key={i} className="flex flex-col items-center gap-1">
                <span
                  className={cx(
                    'center h-6 w-6 rounded-full text-[11px]',
                    done ? 'bg-primary text-primary-foreground' : 'border border-border bg-muted/40 text-muted-foreground',
                  )}
                  aria-label={done ? 'Solved' : 'No activity'}
                >
                  {done ? <Icon name="check" size={11} strokeWidth={3} /> : ''}
                </span>
                <span className="text-xs text-muted-foreground">{WEEK_LABELS[i]}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Global standing */}
      <section className="rounded-xl border border-border bg-card text-card-foreground shadow-sm flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-muted-foreground">Global Standing</p>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">{PROFILE.topPercent}</span>
        </div>
        <span className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">{PROFILE.rank}</span>
        <p className="text-xs text-muted-foreground">
          Contest Rating: <span className="tabular-nums font-medium text-foreground">{PROFILE.rating}</span>
        </p>
        <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm text-muted-foreground">Attended Contests</span>
          <span className="text-sm font-medium tabular-nums text-foreground">{PROFILE.contests} events</span>
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
    <section className="rounded-xl border border-border bg-card text-card-foreground shadow-sm flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            <span className="tabular-nums">{stats.subs.toLocaleString()}</span> Submissions in the past year
          </h2>
          <p className="text-xs mt-1 text-muted-foreground">
            Active days: <span className="tabular-nums">{stats.days} / 365</span> ({((stats.days / 365) * 100).toFixed(1)}%) ·
            Max streak: <span className="tabular-nums">{PROFILE.longestStreak} days</span>
          </p>
        </div>
        <div className="flex items-center gap-1" role="group" aria-label="Year">
          {(['2024', '2023'] as const).map((y) => (
            <Button
              key={y}
              type="button"
              variant={year === y ? 'default' : 'outline'}
              size="sm"
              aria-pressed={year === y}
              onClick={() => onYear(y)}
            >
              {y}
            </Button>
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
    <Tabs value={tab} onValueChange={(value) => onTab(value as ActivityTab)} className="min-w-0">
    <section className="rounded-xl border border-border bg-card text-card-foreground shadow-sm min-w-0">
      <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-border bg-transparent px-3 pt-1.5 shadow-none">
        {tabs.map((t) => (
          <TabsTrigger key={t.id} value={t.id} className="flex-none">
            <Icon name={t.icon} size={14} />
            {t.id}
            {t.badge && <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-0.5 text-xs text-secondary-foreground tabular-nums">{t.badge}</span>}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="p-4">
        {tab === 'Recent Submissions' && (
          <div className="flex flex-col gap-3">
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
                          className="flex items-center gap-2.5 hover:text-primary"
                        >
                          <span className="font-mono text-xs tabular-nums text-muted-foreground">{s.problemNum}.</span>
                          <span className="text-sm font-medium text-foreground">{s.problemTitle}</span>
                        </CustomLink>
                      </td>
                      <td>
                        <SubStatusPill status={s.status} />
                      </td>
                      <td className="text-sm hidden text-muted-foreground sm:table-cell">{s.language}</td>
                      <td className="text-sm tabular-nums hidden text-muted-foreground sm:table-cell">
                        {s.runtimeMs === null ? 'N/A' : `${s.runtimeMs} ms`}
                      </td>
                      <td className="text-xs pr-2 text-right whitespace-nowrap text-muted-foreground">{s.submitted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">Showing latest {PROFILE_SUBMISSIONS.length} submissions</span>
              <CustomLink to="/problems/two-sum/submissions" className="link text-sm font-medium inline-flex items-center gap-1.5">
                View all submissions
                <Icon name="arrowRight" size={13} />
              </CustomLink>
            </div>
          </div>
        )}

        {tab === 'Solved Problems' && (
          <ul className="flex flex-col gap-1">
            {solved.map((p) => (
              <li key={p.id}>
                <CustomLink variant="unstyled"
                  to={`/problems/${p.id}`}
                  className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/40"
                >
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">{p.num}</span>
                  <span className="text-sm font-medium min-w-0 grow truncate text-foreground">{p.title}</span>
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
              <div key={b.name} className="flex flex-col items-center gap-1.5 rounded-md border border-border bg-muted/50 px-3 py-4 text-center">
                <span className="text-[24px]" aria-hidden>
                  {b.icon}
                </span>
                <span className="text-xs truncate font-medium text-foreground">{b.name}</span>
                <span className="text-xs text-muted-foreground">{b.meta}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
    </Tabs>
  )
}

/* ------------------------------------------------------------------ */
/* Right rail: topics + recent badges                                  */
/* ------------------------------------------------------------------ */

function TopicsCard() {
  return (
    <section className="rounded-xl border border-border bg-card text-card-foreground shadow-sm flex flex-col gap-3.5 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Solved by Topic</h2>
        <span className="text-xs text-muted-foreground">Top Areas</span>
      </div>
      {SOLVED_BY_TOPIC.map((t) => (
        <div key={t.topic} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm truncate text-foreground">{t.topic}</span>
            <span className="text-xs tabular-nums shrink-0 text-muted-foreground">
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
    <section className="rounded-xl border border-border bg-card text-card-foreground shadow-sm flex flex-col gap-3.5 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Recent Badges</h2>
        <Button variant="ghost" size="sm" type="button" onClick={onShowAll}>
          All ({BADGES.length})
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {BADGES.slice(0, 3).map((b) => (
          <div key={b.name} className="flex flex-col items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2 py-3 text-center">
            <span className="text-[22px]" aria-hidden>
              {b.icon}
            </span>
            <span className="text-xs w-full truncate font-medium text-foreground">{b.name}</span>
            <span className="text-xs text-muted-foreground">{b.meta}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
