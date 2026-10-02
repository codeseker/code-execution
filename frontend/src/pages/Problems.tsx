import { useMemo, useState } from 'react'
import { Icon } from '../components/icons'
import { DifficultyBadge, EmptyState, ProblemStatusIcon } from '../components/ui'
import { PROBLEMS } from '../data'
import type { Problem } from '../data'
import CustomLink from '../components/CustomLink'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'

const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'] as const
type DifficultyFilter = (typeof DIFFICULTIES)[number]

function filterProblems(problems: Problem[], query: string, difficulty: DifficultyFilter) {
  const search = query.trim().toLowerCase()

  return problems.filter((problem) => {
    const matchesSearch =
      !search ||
      problem.title.toLowerCase().includes(search) ||
      String(problem.num).includes(search) ||
      problem.tags.some((tag) => tag.toLowerCase().includes(search))
    const matchesDifficulty = difficulty === 'All' || problem.difficulty === difficulty

    return matchesSearch && matchesDifficulty
  })
}

function ProblemRow({ problem }: { problem: Problem }) {
  return (
    <div className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 sm:grid-cols-[40px_minmax(0,1fr)_120px_100px] sm:px-5">
      <span className="text-right text-sm tabular-nums text-muted-foreground">{problem.num}</span>
      <div className="min-w-0">
        <CustomLink
          variant="unstyled"
          to={`/problems/${problem.id}`}
          className="text-sm font-medium text-foreground hover:text-primary"
        >
          {problem.title}
        </CustomLink>
        <div className="mt-1 hidden flex-wrap gap-1.5 sm:flex">
          {problem.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="rounded-sm px-1.5 py-0 text-[11px] font-normal">{tag}</Badge>
          ))}
        </div>
      </div>
      <DifficultyBadge difficulty={problem.difficulty} />
      <span className="hidden justify-self-end sm:inline-flex">
        <ProblemStatusIcon status={problem.status} />
      </span>
    </div>
  )
}

export default function Problems() {
  const [query, setQuery] = useState('')
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('All')
  const filteredProblems = useMemo(
    () => filterProblems(PROBLEMS, query, difficulty),
    [query, difficulty],
  )

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="mx-auto w-full max-w-[1040px] px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Practice</p>
            <h1 className="mt-1 text-3xl font-semibold text-foreground">Problems</h1>
            <p className="mt-1 text-sm text-muted-foreground">Search the problem set and open one to start coding.</p>
          </div>
          <span className="text-xs text-muted-foreground">{filteredProblems.length} problems</span>
        </header>

        <Card className="overflow-hidden rounded-lg border-border bg-card p-0 shadow-none" aria-label="Problem list">
          <div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row sm:items-center sm:p-4">
            <label className="relative min-w-0 grow">
              <Icon
                name="search"
                size={15}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                className="pl-9"
                type="search"
                placeholder="Search problems"
                aria-label="Search problems"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>

            <div className="flex w-full flex-wrap gap-1 sm:w-auto" role="group" aria-label="Filter by difficulty">
              {DIFFICULTIES.map((option) => (
                <Button
                  key={option}
                  variant={difficulty === option ? 'default' : 'ghost'}
                  size="sm"
                  type="button"
                  aria-pressed={difficulty === option}
                  onClick={() => setDifficulty(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 bg-muted px-4 py-2 text-xs font-semibold uppercase text-muted-foreground sm:grid-cols-[40px_minmax(0,1fr)_120px_100px] sm:px-5">
            <span className="text-right">#</span>
            <span>Title</span>
            <span>Difficulty</span>
            <span className="hidden justify-self-end sm:block">Status</span>
          </div>

          {filteredProblems.length ? (
            filteredProblems.map((problem) => <ProblemRow key={problem.id} problem={problem} />)
          ) : (
            <EmptyState
              icon="search"
              title="No problems found"
              hint="Try another title, number, keyword, or difficulty."
            />
          )}
        </Card>
      </div>
    </main>
  )
}
