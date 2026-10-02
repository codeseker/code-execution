import { Icon } from '../icons'
import { EmptyState } from '../ui'
import { Button } from '../ui/button'
import { Skeleton } from '../ui/skeleton'
import { apiErrorMessage } from '../../utils/api/errors'

/** Skeleton rows matching the catalogue grid - shown while the query loads. */
export function ProblemListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading problems">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 sm:grid-cols-[40px_minmax(0,1fr)_120px_120px_100px] sm:px-5"
        >
          <Skeleton className="h-4 w-6" />
          <div className="flex min-w-0 flex-col gap-1.5">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-4/5" />
          </div>
          <Skeleton className="h-5 w-16" />
          <Skeleton className="hidden h-4 w-12 sm:block" />
          <Skeleton className="hidden size-8 sm:block" />
        </div>
      ))}
    </div>
  )
}

/** Backend failure surface - retry re-runs the same query key. */
export function ProblemListError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <EmptyState
      icon="alert"
      title="We could not load the problem set"
      hint={apiErrorMessage(error, 'The catalogue service did not respond. Please try again.')}
      action={
        <Button type="button" variant="outline" onClick={onRetry}>
          <Icon name="refresh" size={14} />
          Retry
        </Button>
      }
    />
  )
}

/** No rows for the current filter combination. */
export function ProblemListEmpty({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  if (!hasFilters) {
    return <EmptyState icon="file" title="No problems published yet" hint="Check back once the catalogue is seeded." />
  }
  return (
    <EmptyState
      icon="search"
      title="No problems found"
      hint="Try another title, keyword, tag, or difficulty."
      action={
        <Button type="button" variant="outline" onClick={onClear}>
          Clear filters
        </Button>
      }
    />
  )
}