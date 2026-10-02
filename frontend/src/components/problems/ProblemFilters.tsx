import { useEffect, useState } from 'react'
import { Icon } from '../icons'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { DIFFICULTIES, type Difficulty } from '../../types/domain'
import { difficultyLabel } from '../../lib/format'

export type ProblemFiltersValue = {
  search: string
  difficulty: Difficulty | 'ALL'
  tags: string
}

type Props = {
  value: ProblemFiltersValue
  onChange: (value: ProblemFiltersValue) => void
  /** Free-text tag suggestions harvested from the current page. */
  tagSuggestions?: string[]
}

/** Debounce so typing does not fire a request per keystroke. */
const SEARCH_DEBOUNCE_MS = 300

/**
 * Search + difficulty + tag filters. All three are server-side query params
 * of `GET /problems`, so the component only owns its own input state and
 * reports the committed value upward.
 */
export default function ProblemFilters({ value, onChange, tagSuggestions = [] }: Props) {
  const [searchDraft, setSearchDraft] = useState(value.search)

  // Re-sync when the parent resets the filters.
  useEffect(() => setSearchDraft(value.search), [value.search])

  useEffect(() => {
    if (searchDraft === value.search) return
    const timer = window.setTimeout(() => onChange({ ...value, search: searchDraft }), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [searchDraft, value, onChange])

  return (
    <div className="flex flex-col gap-3 border-b border-border p-3 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative min-w-0 grow">
          <Icon
            name="search"
            size={15}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            className="pl-9"
            type="search"
            placeholder="Search title or keyword"
            aria-label="Search problems"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
          />
        </label>

        <div className="flex items-center gap-1.5">
          <Icon name="filter" size={14} className="text-muted-foreground" aria-hidden />
          <Input
            className="h-9 w-40"
            placeholder="Filter by tag"
            aria-label="Filter by tag"
            value={value.tags}
            onChange={(event) => onChange({ ...value, tags: event.target.value })}
          />
        </div>
      </div>

      <div className="flex w-full flex-wrap gap-1" role="group" aria-label="Filter by difficulty">
        <Button
          variant={value.difficulty === 'ALL' ? 'default' : 'ghost'}
          size="sm"
          type="button"
          aria-pressed={value.difficulty === 'ALL'}
          onClick={() => onChange({ ...value, difficulty: 'ALL' })}
        >
          All
        </Button>
        {DIFFICULTIES.map((option) => (
          <Button
            key={option}
            variant={value.difficulty === option ? 'default' : 'ghost'}
            size="sm"
            type="button"
            aria-pressed={value.difficulty === option}
            onClick={() => onChange({ ...value, difficulty: value.difficulty === option ? 'ALL' : option })}
          >
            {difficultyLabel(option)}
          </Button>
        ))}
      </div>

      {tagSuggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5" aria-label="Popular tags">
          {tagSuggestions.slice(0, 12).map((tag) => (
            <Button
              key={tag}
              variant={value.tags === tag ? 'secondary' : 'ghost'}
              size="sm"
              type="button"
              className="h-7 text-xs"
              aria-pressed={value.tags === tag}
              onClick={() => onChange({ ...value, tags: value.tags === tag ? '' : tag })}
            >
              {tag}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}