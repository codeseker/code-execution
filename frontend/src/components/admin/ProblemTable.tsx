import { Icon } from '../../components/icons'
import { Progress } from '../../components/ui'
import { DifficultyBadge } from '../../components/ui'
import { Skeleton } from '../../components/ui/skeleton'
import { EmptyState } from '../../components/ui'
import { useUpdateProblem } from '../../hooks/problems/admin/useProblemMutations'
import type { AdminProblem, CreateProblemPayload } from '../../hooks/problems/types'
import { cx } from '../../components/ui'

type Props = {
  problems: AdminProblem[]
  loading: boolean
  onOpen: (problem: AdminProblem) => void
  /** Soft delete - confirmation and the request live in the page. */
  onArchive: (problem: AdminProblem) => void
}

/** Presentational row set for the admin catalogue. */
export function ProblemTable({ problems, loading, onOpen, onArchive }: Props) {
  const { updateProblem, loading: updating } = useUpdateProblem()

  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-4" aria-busy="true" aria-label="Loading catalogue">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-11 w-full" />
        ))}
      </div>
    )
  }

  if (problems.length === 0) {
    return <EmptyState icon="search" title="No problems found" hint="Try a different keyword or difficulty." />
  }

  const setPublished = (problem: AdminProblem, isPublished: boolean) => {
    const payload: CreateProblemPayload = {
      title: problem.title,
      description: problem.description,
      problemStatement: problem.problemStatement,
      difficulty: problem.difficulty,
      tags: problem.tags,
      isPublished,
    };
    void updateProblem({ id: problem._id, payload });
  }

  return (
    <div className="overflow-x-auto">
      <table className="ntable">
        <thead>
          <tr>
            <th className="pl-5">Title</th>
            <th>Slug</th>
            <th>Difficulty</th>
            <th className="hidden lg:table-cell">Topics</th>
            <th className="hidden md:table-cell">Test cases</th>
            <th>Visibility</th>
            <th className="pr-5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {problems.map((problem) => (
            <tr key={problem._id}>
              <td className="pl-5">
                <button type="button" className="text-sm font-medium text-foreground hover:text-primary" onClick={() => onOpen(problem)}>
                  {problem.title}
                </button>
                {problem.description && (
                  <p className="max-w-80 truncate text-xs text-muted-foreground">{problem.description}</p>
                )}
              </td>
              <td className="font-mono text-xs text-muted-foreground">{problem.slug}</td>
              <td>
                <DifficultyBadge difficulty={problem.difficulty} />
              </td>
              <td className="hidden lg:table-cell">
                <span className="flex flex-wrap gap-1.5">
                  {problem.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                      {tag}
                    </span>
                  ))}
                </span>
              </td>
              <td className="hidden text-sm tabular-nums text-muted-foreground md:table-cell">{problem.testCaseCount}</td>
              <td>
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => setPublished(problem, !problem.isPublished)}
                  aria-pressed={problem.isPublished}
                  className={cx(
                    'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium',
                    problem.isPublished ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                  {problem.isPublished ? 'Published' : 'Draft'}
                </button>
              </td>
              <td className="pr-5 text-right">
                <span className="flex justify-end gap-1">
                  <button
                    type="button"
                    className="icon-btn tip"
                    data-tip="Open in workspace"
                    aria-label={`Open ${problem.title}`}
                    onClick={() => onOpen(problem)}
                  >
                    <Icon name="pencil" size={15} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn tip"
                    data-tip="Soft delete"
                    aria-label={`Delete ${problem.title}`}
                    onClick={() => onArchive(problem)}
                  >
                    <Icon name="folder" size={15} />
                  </button>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Catalogue health derived from the counters on each problem row. */
export function CatalogueHealth({ problems }: { problems: AdminProblem[] }) {
  if (problems.length === 0) return null;

  const published = problems.filter((problem) => problem.isPublished).length;
  const percent = (published / problems.length) * 100;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card px-3 py-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Published on this page</span>
        <span className="tabular-nums text-foreground">
          {published} / {problems.length}
        </span>
      </div>
      <Progress value={percent} className="h-1.5" />
    </div>
  )
}