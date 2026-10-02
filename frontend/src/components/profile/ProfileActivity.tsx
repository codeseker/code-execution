import { Icon } from '../icons'
import { DifficultyBadge, EmptyState } from '../ui'
import { Tag } from '../ui'
import { Badge } from '../ui/badge'
import { Skeleton } from '../ui/skeleton'
import CustomLink from '../CustomLink'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { languageLabel, relativeTime, statusLabel, statusToneClass } from '../../lib/format'
import type { SubmissionSummary } from '../../hooks/submissions/types'
import type { ProblemSummary } from '../../hooks/lists/types'

export type ActivityTab = 'Recent Submissions' | 'Bookmarks'

type Props = {
  tab: ActivityTab
  onTab: (tab: ActivityTab) => void
  submissions: SubmissionSummary[]
  bookmarks: ProblemSummary[]
  loading: boolean
  bookmarksLoading: boolean
  slugByProblemId: Map<string, string>
}

const TABS: Array<{ id: ActivityTab; icon: Parameters<typeof Icon>[0]['name'] }> = [
  { id: 'Recent Submissions', icon: 'history' },
  { id: 'Bookmarks', icon: 'bookmark' },
]

/** Recent runs and starred problems, both served by `/users/me/**`. */
export default function ProfileActivity({
  tab,
  onTab,
  submissions,
  bookmarks,
  loading,
  bookmarksLoading,
  slugByProblemId,
}: Props) {
  const slugFor = (problemId: string) => slugByProblemId.get(problemId) ?? problemId

  return (
    <Tabs value={tab} onValueChange={(value) => onTab(value as ActivityTab)} className="min-w-0">
      <section className="min-w-0 rounded-xl border border-border bg-card shadow-sm">
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-border bg-transparent px-3 pt-1.5 shadow-none">
          {TABS.map((item) => (
            <TabsTrigger key={item.id} value={item.id} className="flex-none">
              <Icon name={item.icon} size={14} />
              {item.id}
              <span className="rounded-md border border-border bg-secondary px-2 py-0.5 text-xs tabular-nums text-secondary-foreground">
                {item.id === 'Recent Submissions' ? submissions.length : bookmarks.length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="p-4">
          {tab === 'Recent Submissions' &&
            (loading ? (
              <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading submissions">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-9 w-full" />
                ))}
              </div>
            ) : submissions.length === 0 ? (
              <EmptyState icon="history" title="No submissions yet" hint="Solve a problem to start your history." />
            ) : (
              <ul className="flex flex-col">
                {submissions.map((submission) => (
                  <li key={submission.id}>
                    <CustomLink
                      variant="unstyled"
                      to={`/problems/${slugFor(submission.problemId)}/submissions`}
                      className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/40"
                    >
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${statusToneClass(submission.verdict ?? submission.status)}`}
                      >
                        {submission.verdict ?? statusLabel(submission.status)}
                      </span>
                      <Badge variant="secondary">{languageLabel(submission.language)}</Badge>
                      <span className="grow truncate text-xs text-muted-foreground">
                        {submission.type === 'FULL_SUBMISSION' ? 'Submit' : submission.type === 'EXAMPLE_EVAL' ? 'Samples' : 'Run'}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(submission.createdAt)}</span>
                    </CustomLink>
                  </li>
                ))}
              </ul>
            ))}

          {tab === 'Bookmarks' &&
            (bookmarksLoading ? (
              <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading bookmarks">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-9 w-full" />
                ))}
              </div>
            ) : bookmarks.length === 0 ? (
              <EmptyState icon="bookmark" title="No bookmarks yet" hint="Star a problem to keep it here." />
            ) : (
              <ul className="flex flex-col gap-1">
                {bookmarks.map((problem) => (
                  <li key={problem._id}>
                    <CustomLink
                      variant="unstyled"
                      to={`/problems/${problem.slug}`}
                      className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/40"
                    >
                      <Icon name="bookmark" size={14} className="shrink-0 fill-current text-primary" />
                      <span className="min-w-0 grow truncate text-sm font-medium text-foreground">{problem.title}</span>
                      {problem.tags[0] && <Tag tone="blue">{problem.tags[0]}</Tag>}
                      <DifficultyBadge difficulty={problem.difficulty} />
                    </CustomLink>
                  </li>
                ))}
              </ul>
            ))}
        </div>
      </section>
    </Tabs>
  )
}