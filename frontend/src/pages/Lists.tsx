import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { EmptyState, Spinner, cx } from '../components/ui'
import { Icon } from '../components/icons'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Skeleton } from '../components/ui/skeleton'
import { Textarea } from '../components/ui/textarea'
import CustomLink from '../components/CustomLink'
import {
  useAddProblemToList,
  useCreateList,
  useDeleteList,
  useProblemList,
  useProblemLists,
  useRemoveProblemFromList,
  useUpdateList,
} from '../hooks/lists/useLists'
import { useBookmarks } from '../hooks/lists/useLists'
import usePublicProblems from '../hooks/problems/public/usePublicProblems'
import { relativeTime } from '../lib/format'
import type { ProblemList } from '../hooks/lists/types'

/** Create form. Owns its own field state and resets after a success. */
function CreateListForm() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const { createList, loading } = useCreateList()

  const submit = async () => {
    if (!name.trim()) return
    try {
      await createList({ name: name.trim(), description: description.trim() || null })
      setName('')
      setDescription('')
    } catch {
      // Toast handled by the hook.
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-foreground">New list</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Curated study plans, kept private to your account.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="list-name">
          Name
        </label>
        <Input
          id="list-name"
          className="h-9"
          maxLength={100}
          placeholder="Blind 75 · week 1"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="list-description">
          Description
        </label>
        <Textarea
          id="list-description"
          rows={3}
          maxLength={500}
          placeholder="What this list covers"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <Button type="button" disabled={loading || !name.trim()} onClick={() => void submit()}>
        <Icon name="plus" size={14} />
        {loading ? 'Creating…' : 'Create list'}
      </Button>
    </section>
  )
}

/** One list card with rename + delete. Self-contained editing state. */
function ListCard({ list, onOpen }: { list: ProblemList; onOpen: () => void }) {
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(list.name)
  const { updateList, loading: updating } = useUpdateList()
  const { deleteList, loading: deleting } = useDeleteList()

  const save = async () => {
    if (!name.trim() || name.trim() === list.name) {
      setRenaming(false)
      return
    }
    try {
      await updateList({ id: list._id, payload: { name: name.trim(), description: list.description } })
      setRenaming(false)
    } catch {
      // Toast handled by the hook.
    }
  }

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="min-w-0 grow">
          {renaming ? (
            <Input
              className="h-8"
              value={name}
              maxLength={100}
              aria-label="List name"
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void save()
                if (event.key === 'Escape') {
                  setName(list.name)
                  setRenaming(false)
                }
              }}
            />
          ) : (
            <button type="button" className="text-left" onClick={onOpen}>
              <h3 className="truncate text-sm font-semibold text-foreground hover:text-primary">{list.name}</h3>
            </button>
          )}
          {list.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{list.description}</p>
          )}
        </div>
        {list.system && <Badge variant="secondary">System</Badge>}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline" className="tabular-nums">
          {list.problemCount} problems
        </Badge>
        <span>Updated {relativeTime(list.updatedAt)}</span>
      </div>

      {!list.system && (
        <div className="flex items-center gap-1.5 border-t border-border pt-3">
          <Button variant="ghost" size="sm" type="button" className="h-7" onClick={onOpen}>
            <Icon name="eye" size={13} />
            Open
          </Button>
          <span className="grow" />
          <Button variant="ghost" size="sm" type="button" className="h-7" onClick={() => setRenaming((value) => !value)}>
            <Icon name="pencil" size={13} />
            Rename
          </Button>
          {renaming && (
            <Button size="sm" type="button" className="h-7" disabled={updating} onClick={() => void save()}>
              {updating ? 'Saving…' : 'Save'}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="h-7 text-destructive"
            disabled={deleting}
            onClick={() => void deleteList(list._id)}
          >
            <Icon name="x" size={13} />
            Delete
          </Button>
        </div>
      )}
    </article>
  )
}

/** Drill-down for a single list: append a problem or remove one. */
function ListDetailPanel({ list, onClose }: { list: ProblemList; onClose: () => void }) {
  const { list: meta, problems, loading } = useProblemList(list._id)
  const { addProblem, loading: adding } = useAddProblemToList()
  const { removeProblem } = useRemoveProblemFromList()
  const { problems: catalogue } = usePublicProblems({ page: 1, limit: 100 })
  const navigate = useNavigate()

  const inList = useMemo(() => new Set(meta?.problemIds ?? list.problemIds), [meta, list])
  const candidates = useMemo(
    () => catalogue.filter((problem) => !inList.has(problem.id)),
    [catalogue, inList],
  )
  const [selected, setSelected] = useState('')

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="min-w-0 grow">
          <h2 className="truncate text-lg font-semibold text-foreground">{meta?.name ?? list.name}</h2>
          {meta?.description && <p className="mt-0.5 text-xs text-muted-foreground">{meta.description}</p>}
        </div>
        <Button variant="ghost" size="icon" type="button" className="size-8" aria-label="Close list" onClick={onClose}>
          <Icon name="x" size={15} />
        </Button>
      </div>

      <div className="flex gap-2">
        <select
          className="input select h-9 grow text-sm"
          aria-label="Problem to append"
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
        >
          <option value="">Select a problem…</option>
          {candidates.map((problem) => (
            <option key={problem.id} value={problem.id}>
              {problem.title}
            </option>
          ))}
        </select>
        <Button
          type="button"
          className="h-9"
          disabled={adding || !selected}
          onClick={() => {
            if (!selected) return
            void addProblem({ id: list._id, payload: { problemId: selected } }).then(() => setSelected(''))
          }}
        >
          <Icon name="plus" size={14} />
          Add
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading list">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </div>
      ) : problems.length === 0 ? (
        <EmptyState icon="list" title="This list is empty" hint="Append a problem to get started." />
      ) : (
        <ul className="flex flex-col">
          {problems.map((problem) => (
            <li key={problem._id} className="flex items-center gap-2 border-b border-border last:border-b-0">
              <CustomLink
                variant="unstyled"
                to={`/problems/${problem.slug}`}
                className="min-w-0 grow truncate rounded-md px-2 py-2 text-sm text-foreground hover:bg-muted/40"
              >
                {problem.title}
              </CustomLink>
              <span className="shrink-0 text-xs text-muted-foreground">{problem.difficulty}</span>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                className="size-7 shrink-0"
                aria-label={`Remove ${problem.title} from the list`}
                onClick={() => void removeProblem({ id: list._id, problemId: problem._id })}
              >
                <Icon name="x" size={13} />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        Open a problem to{' '}
        <button type="button" className="link" onClick={() => navigate('/problems')}>
          browse the catalogue
        </button>
        .
      </p>
    </section>
  )
}

/** `/lists` - study plans plus the starred problems (`/users/me/**`). */
export default function Lists() {
  const { lists, loading, error } = useProblemLists()
  const { bookmarks, loading: bookmarksLoading } = useBookmarks()
  const [openListId, setOpenListId] = useState<string | null>(null)

  const openList = lists.find((list) => list._id === openListId) ?? null

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-background">
        <Spinner size={24} className="text-muted-foreground" />
      </div>
    )
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Library</p>
            <h1 className="mt-1 text-3xl font-semibold text-foreground">Lists &amp; bookmarks</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Curate study plans and keep the problems you want to revisit close at hand.
            </p>
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">
            {lists.length} lists · {bookmarks.length} bookmarks
          </span>
        </header>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex flex-col gap-4">
            {error ? (
              <EmptyState icon="alert" title="We could not load your lists" hint="Please retry in a moment." />
            ) : openList ? (
              <ListDetailPanel list={openList} onClose={() => setOpenListId(null)} />
            ) : lists.length === 0 ? (
              <EmptyState
                icon="list"
                title="No lists yet"
                hint="Create your first study plan to group problems together."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {lists.map((list) => (
                  <ListCard key={list._id} list={list} onOpen={() => setOpenListId(list._id)} />
                ))}
              </div>
            )}

            <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">Bookmarks</h2>
              {bookmarksLoading ? (
                <div className="mt-3 flex flex-col gap-2" aria-busy="true" aria-label="Loading bookmarks">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-8 w-full" />
                  ))}
                </div>
              ) : bookmarks.length === 0 ? (
                <p className={cx('mt-3 text-sm text-muted-foreground')}>
                  Nothing starred yet — use the bookmark icon on any problem.
                </p>
              ) : (
                <ul className="mt-3 flex flex-col">
                  {bookmarks.map((problem) => (
                    <li key={problem._id} className="flex items-center gap-2 border-b border-border last:border-b-0">
                      <CustomLink
                        variant="unstyled"
                        to={`/problems/${problem.slug}`}
                        className="min-w-0 grow truncate rounded-md px-2 py-2 text-sm text-foreground hover:bg-muted/40"
                      >
                        {problem.title}
                      </CustomLink>
                      <Badge variant="secondary">{problem.difficulty}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <CreateListForm />
        </div>
      </div>
    </main>
  )
}