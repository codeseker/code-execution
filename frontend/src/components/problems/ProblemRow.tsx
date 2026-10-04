import { Icon } from '../icons'
import { DifficultyBadge } from '../ui'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { BaseTooltip } from '../BaseTooltip'
import CustomLink from '../CustomLink'
import { formatPercent } from '../../lib/format'
import type { PublicProblem } from '../../hooks/problems/types'
import type { ProblemStatus } from '../../data'

type Props = {
  problem: PublicProblem
  /** 1-based position within the filtered result set. */
  position: number
  status: ProblemStatus
  bookmarked: boolean
  bookmarkPending: boolean
  onToggleBookmark: (problemId: string) => void
}

const STATUS_GLYPH = {
  solved: 'checkCircle',
  attempted: 'circleHalf',
  todo: 'circle',
} as const

const STATUS_TITLE = {
  solved: 'Solved',
  attempted: 'Attempted',
  todo: 'Not started',
} as const

const STATUS_TONE = {
  solved: 'text-primary',
  attempted: 'text-muted-foreground',
  todo: 'text-muted-foreground',
} as const

/** One row of the public catalogue. Presentational only. */
export default function ProblemRow({
  problem,
  position,
  status,
  bookmarked,
  bookmarkPending,
  onToggleBookmark,
}: Props) {
  return (
    <div className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 sm:grid-cols-[40px_minmax(0,1fr)_120px_120px_100px] sm:px-5">
      <span className="text-right text-sm tabular-nums text-muted-foreground">{position}</span>

      <div className="min-w-0">
        <CustomLink
          variant="unstyled"
          to={`/problems/${problem.slug}`}
          className="text-sm font-medium text-foreground hover:text-primary"
        >
          {problem.title}
        </CustomLink>
        {problem.description && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{problem.description}</p>
        )}
        <div className="mt-1 hidden flex-wrap gap-1.5 sm:flex">
          {problem.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="rounded-sm px-1.5 py-0 text-xs font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <DifficultyBadge difficulty={problem.difficulty} />

      <span className="hidden text-xs tabular-nums text-muted-foreground sm:inline">
        {formatPercent(problem.acceptanceRate)}
      </span>

      <div className="flex items-center justify-end gap-1">
        <BaseTooltip content={bookmarked ? 'Remove bookmark' : 'Bookmark problem'}>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={bookmarkPending}
            aria-label={bookmarked ? `Remove bookmark for ${problem.title}` : `Bookmark ${problem.title}`}
            aria-pressed={bookmarked}
            onClick={() => onToggleBookmark(problem.id)}
          >
            <Icon name="bookmark" size={16} className={bookmarked ? 'fill-current text-primary' : undefined} />
          </Button>
        </BaseTooltip>
        <span
          className={`inline-flex ${STATUS_TONE[status]}`}
          title={STATUS_TITLE[status]}
          aria-label={STATUS_TITLE[status]}
        >
          <Icon name={STATUS_GLYPH[status]} size={17} />
        </span>
      </div>
    </div>
  )
}