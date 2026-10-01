import { useMemo, useState } from 'react'
import { Icon } from '../components/icons'
import { DifficultyBadge, EmptyState, ProblemStatusIcon, cx } from '../components/ui'
import { PROBLEMS } from '../data'
import type { Problem } from '../data'
import CustomButton from '../components/ui/CustomButton'
import CustomLink from '../components/ui/CustomLink'

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
    <div className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 border-b border-hair px-4 py-3 last:border-b-0 sm:grid-cols-[40px_minmax(0,1fr)_120px_100px] sm:px-5">
      <span className="tnum text-right text-ink-3">{problem.num}</span>
      <div className="min-w-0">
        <CustomLink
          variant="unstyled"
          to={`/problems/${problem.id}`}
          className="t-ui-med text-ink hover:text-accent"
        >
          {problem.title}
        </CustomLink>
        <div className="mt-1 hidden flex-wrap gap-1.5 sm:flex">
          {problem.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="tag tag-gray">{tag}</span>
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
    <main className="min-h-[calc(100vh-3.5rem)] bg-canvas">
      <div className="mx-auto w-full max-w-[1040px] px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="t-overline text-ink-3">PRACTICE</p>
            <h1 className="t-page-title mt-1 text-ink">Problems</h1>
            <p className="t-ui mt-1 text-ink-2">Search the problem set and open one to start coding.</p>
          </div>
          <span className="t-caption text-ink-3">{filteredProblems.length} problems</span>
        </header>

        <section className="overflow-hidden rounded-lg border border-hair bg-panel" aria-label="Problem list">
          <div className="flex flex-col gap-3 border-b border-hair p-3 sm:flex-row sm:items-center sm:p-4">
            <label className="relative min-w-0 grow">
              <Icon
                name="search"
                size={15}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-3"
              />
              <input
                className="input h-9 w-full pl-9"
                type="search"
                placeholder="Search problems"
                aria-label="Search problems"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>

            <div className="seg w-full sm:w-auto" role="group" aria-label="Filter by difficulty">
              {DIFFICULTIES.map((option) => (
                <CustomButton
                  key={option}
                  variant="unstyled"
                  type="button"
                  className={cx('seg-btn', difficulty === option && 'is-active')}
                  aria-pressed={difficulty === option}
                  onClick={() => setDifficulty(option)}
                >
                  {option}
                </CustomButton>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 bg-wash px-4 py-2 text-ink-3 sm:grid-cols-[40px_minmax(0,1fr)_120px_100px] sm:px-5">
            <span className="text-right t-overline">#</span>
            <span className="t-overline">TITLE</span>
            <span className="t-overline">DIFFICULTY</span>
            <span className="hidden justify-self-end t-overline sm:block">STATUS</span>
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
        </section>
      </div>
    </main>
  )
}
