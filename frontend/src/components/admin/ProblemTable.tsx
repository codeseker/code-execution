import { Icon } from '../../components/icons'
import { BaseTooltip } from '../BaseTooltip'
import CustomLink from '../CustomLink'
import { Button } from '../ui/button'
import { Progress } from '../../components/ui'
import { DifficultyBadge } from '../../components/ui'
import { Skeleton } from '../../components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { EmptyState } from '../../components/ui'
import { useUpdateProblem } from '../../hooks/problems/admin/useProblemMutations'
import type { AdminProblem, CreateProblemPayload } from '../../hooks/problems/types'
import { cx } from '../../components/ui'

type Props = {
  problems: AdminProblem[]
  loading: boolean
  /** Soft delete - confirmation and the request live in the page. */
  onArchive: (problem: AdminProblem) => void
}

/** Presentational row set for the admin catalogue. */
export function ProblemTable({ problems, loading, onArchive }: Props) {
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-5">Title</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead>Difficulty</TableHead>
          <TableHead className="hidden lg:table-cell">Topics</TableHead>
          <TableHead className="hidden md:table-cell">Test cases</TableHead>
          <TableHead>Visibility</TableHead>
          <TableHead className="pr-5 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {problems.map((problem) => (
          <TableRow key={problem._id}>
<TableCell className="pl-5">
              <CustomLink
                variant="unstyled"
                to={`/admin/problems/${problem._id}`}
                className="text-sm font-medium text-foreground hover:text-primary"
              >
                {problem.title}
              </CustomLink>
              {problem.description && (
                <p className="max-w-80 truncate text-xs text-muted-foreground">{problem.description}</p>
              )}
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">{problem.slug}</TableCell>
            <TableCell>
              <DifficultyBadge difficulty={problem.difficulty} />
            </TableCell>
            <TableCell className="hidden lg:table-cell">
                <span className="flex flex-wrap gap-1.5">
                  {problem.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                      {tag}
                    </span>
                  ))}
                </span>
            </TableCell>
            <TableCell className="hidden text-sm tabular-nums text-muted-foreground md:table-cell">{problem.testCaseCount}</TableCell>
            <TableCell>
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
            </TableCell>
            <TableCell className="pr-5 text-right">
              <span className="flex justify-end gap-1">
                <BaseTooltip content="Open problem details">
                  <CustomLink
                    variant="unstyled"
                    to={`/admin/problems/${problem._id}`}
                    className="inline-flex size-7 flex-none items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label={`Edit ${problem.title}`}
                  >
                    <Icon name="pencil" size={15} />
                  </CustomLink>
                </BaseTooltip>
                <BaseTooltip content="Soft delete">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Delete ${problem.title}`}
                    onClick={() => onArchive(problem)}
                  >
                    <Icon name="folder" size={15} />
                  </Button>
                </BaseTooltip>
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
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