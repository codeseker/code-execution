import { Icon } from '../icons'
import { Button } from '../ui/button'
import type { PaginationMeta } from '../../types/api-response'

type Props = {
  pagination: PaginationMeta | null
  page: number
  onPageChange: (page: number) => void
  noun?: string
}

/**
 * Pagination bar driven by the backend `PaginationMeta` (1-based `page`).
 * Falls back to a client-side slice count when the endpoint is unpaged.
 */
export default function PaginationBar({ pagination, page, onPageChange, noun = 'problems' }: Props) {
  const totalPages = pagination?.totalPages ?? 0
  const total = pagination?.totalElements ?? 0

  if (total === 0) return null

  const first = (page - 1) * (pagination?.limit ?? 10) + 1
  const last = Math.min(page * (pagination?.limit ?? 10), total)

  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5 sm:px-5">
      <span className="text-xs text-muted-foreground">
        Showing <span className="tabular-nums">{first}</span>–<span className="tabular-nums">{last}</span> of{' '}
        <span className="tabular-nums">{total}</span> {noun}
      </span>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            disabled={page <= 1}
            aria-label="Previous page"
            onClick={() => onPageChange(page - 1)}
          >
            <Icon name="chevronLeft" size={13} />
          </Button>
          <span className="px-1.5 text-xs tabular-nums text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            disabled={page >= totalPages}
            aria-label="Next page"
            onClick={() => onPageChange(page + 1)}
          >
            <Icon name="chevronRight" size={13} />
          </Button>
        </div>
      )}
    </div>
  )
}