import { useMemo, useState } from 'react'

import { EmptyState, Spinner, cx } from '../components/ui'
import { Icon } from '../components/icons'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import CustomLink from '../components/CustomLink'
import ProfileStats from '../components/profile/ProfileStats'
import ProfileActivity from '../components/profile/ProfileActivity'
import type { ActivityTab } from '../components/profile/ProfileActivity'
import useProfile from '../hooks/auth/profile/useProfile'
import useMyStats from '../hooks/stats/useMyStats'
import { useMySubmissions } from '../hooks/submissions/useSubmissions'
import usePublicProblems from '../hooks/problems/public/usePublicProblems'
import { useBookmarks } from '../hooks/lists/useLists'
import useToggleBookmark from '../hooks/lists/useToggleBookmark'
import { difficultyLabel, formatDateTime, initialsOf, roleLabel } from '../lib/format'
import { DIFFICULTIES, type Difficulty } from '../types/domain'

/**
 * Account overview backed by `GET /auth/profile`, `GET /users/me/stats`,
 * `GET /users/me/submissions` and `GET /users/me/bookmarks`. The catalogue is
 * only fetched to translate solved problem ids into slugs and to size the
 * per-difficulty breakdown.
 */
export default function Profile() {
  const { profile, loading: profileLoading } = useProfile()
  const { stats, loading: statsLoading } = useMyStats()
  const { problems: catalogue } = usePublicProblems({ page: 1, limit: 100 })
  const { bookmarks, loading: bookmarksLoading } = useBookmarks()
  const { toggle } = useToggleBookmark()

  const [tab, setTab] = useState<ActivityTab>('Recent Submissions')

  const { submissions, loading: submissionsLoading } = useMySubmissions({ limit: 10 })

  const slugByProblemId = useMemo(
    () => new Map(catalogue.map((problem) => [problem.id, problem.slug])),
    [catalogue],
  )

  const solvedIds = useMemo(() => new Set(stats?.solvedProblemIds ?? []), [stats])

  const breakdown = useMemo(
    () =>
      DIFFICULTIES.map((difficulty: Difficulty) => {
        const inBand = catalogue.filter((problem) => problem.difficulty === difficulty);
        return {
          label: difficultyLabel(difficulty),
          total: inBand.length,
          done: inBand.filter((problem) => solvedIds.has(problem.id)).length,
        };
      }),
    [catalogue, solvedIds],
  )

  if (profileLoading) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-background">
        <Spinner size={24} className="text-muted-foreground" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-background">
        <EmptyState
          icon="user"
          title="We could not load your profile"
          hint="Your session may have expired. Sign in again to continue."
          action={
            <CustomLink variant="unstyled" to="/login" className="btn btn-primary">
              Log in
            </CustomLink>
          }
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-background">
      <main className="mx-auto w-full max-w-[1280px] grow px-4 py-6 lg:px-8">
        <div className="flex flex-col gap-4">
          {/* -------- Identity card -------- */}
          <section className="rounded-xl border border-border bg-card p-5 shadow-sm lg:p-6">
            <div className="flex flex-wrap items-start gap-5">
              <div className="relative">
                <span className="inline-flex size-20 items-center justify-center rounded-full bg-secondary text-xl font-semibold text-secondary-foreground ring-2 ring-primary">
                  {initialsOf(profile.username)}
                </span>
                <span
                  className={cx(
                    'absolute bottom-0 right-0 size-4 rounded-full border-2 border-card',
                    profile.status === 'ACTIVE' ? 'bg-primary' : 'bg-muted',
                  )}
                  aria-label={profile.status === 'ACTIVE' ? 'Active' : 'Pending verification'}
                />
              </div>

              <div className="flex min-w-0 grow flex-col gap-2.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">{profile.username}</h1>
                  <span className="text-sm text-muted-foreground">{profile.email}</span>
                  <Badge className="gap-1.5 bg-primary/10 text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                    {roleLabel(profile.role)}
                  </Badge>
                  {profile.status === 'PENDING' && (
                    <Badge variant="outline" className="gap-1.5">
                      <Icon name="alert" size={12} />
                      Email not verified
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Icon name="calendar" size={14} className="text-muted-foreground" />
                    Joined {formatDateTime(profile.createdAt)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Icon name="shield" size={14} className="text-muted-foreground" />
                    {profile._id}
                  </span>
                </div>
              </div>

              <div className="flex flex-none gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void navigator.clipboard?.writeText(window.location.href)}
                >
                  <Icon name="share" size={13} />
                  Share
                </Button>
              </div>
            </div>
          </section>

          <ProfileStats stats={stats} loading={statsLoading} breakdown={breakdown} />

          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
            <ProfileActivity
              tab={tab}
              onTab={setTab}
              submissions={submissions}
              bookmarks={bookmarks}
              loading={submissionsLoading}
              bookmarksLoading={bookmarksLoading}
              slugByProblemId={slugByProblemId}
            />

            {/* -------- Bookmarks rail -------- */}
            <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-foreground">Bookmarks</h2>
                <CustomLink to="/lists" className="link text-sm font-medium">
                  All lists
                </CustomLink>
              </div>
              {bookmarks.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Star a problem from the catalogue to pin it here.
                </p>
              ) : (
                <ul className="mt-3 flex flex-col gap-1">
                  {bookmarks.slice(0, 8).map((problem) => (
                    <li key={problem._id} className="flex items-center gap-2">
                      <CustomLink
                        variant="unstyled"
                        to={`/problems/${problem.slug}`}
                        className="min-w-0 grow truncate rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted/40"
                      >
                        {problem.title}
                      </CustomLink>
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        className="size-7 shrink-0"
                        aria-label={`Remove bookmark for ${problem.title}`}
                        onClick={() => void toggle(problem._id)}
                      >
                        <Icon name="bookmark" size={14} className="fill-current text-primary" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}