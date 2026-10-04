import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import AdminLayout from './AdminLayout'
import { Icon } from '../../components/icons'
import { Tag } from '../../components/ui'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { useCreateProblem } from '../../hooks/problems/admin/useProblemMutations'
import { DIFFICULTIES, type Difficulty } from '../../types/domain'
import { difficultyLabel } from '../../lib/format'
import { successToast } from '../../toast'

const DEFAULT_TITLE = 'Lowest Common Ancestor of a Binary Search Tree'

const DEFAULT_MARKDOWN = `Given a binary search tree (BST), find the lowest common ancestor (LCA) node of two given nodes in the BST.

According to the definition of LCA on Wikipedia: "The lowest common ancestor is defined between two nodes 'p' and 'q' as the lowest node in 'T' that has both 'p' and 'q' as descendants (where we allow a node to be a descendant of itself)."

Constraints
- The number of nodes in the tree is in the range [2, 10^4].
- -10^9 <= Node.val <= 10^9
- All Node.val are unique.
- p != q
- p and q will exist in the BST.`

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

/**
 * `POST /admin/problems` - the backend derives the slug from the title, so the
 * preview below is informational only and never sent back to the API.
 */
export default function AddProblem() {
  const navigate = useNavigate()

  const [title, setTitle] = useState(DEFAULT_TITLE)
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM')
  const [topics, setTopics] = useState(['Trees', 'Binary Search Tree', 'Depth-First Search'])
  const [description, setDescription] = useState('')
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN)
  const [isPublished, setIsPublished] = useState(false)
  const [error, setError] = useState('')
  const [topicDraft, setTopicDraft] = useState<string | null>(null)

  const { createProblem, loading } = useCreateProblem()

  const slug = slugify(title)

  const publish = async () => {
    if (!title.trim()) return setError('A problem title is required.')
    if (markdown.trim().length < 40) return setError('The prompt needs at least a few sentences before publishing.')
    setError('')

    try {
      const problem = await createProblem({
        title: title.trim(),
        description: description.trim() || null,
        problemStatement: markdown.trim(),
        difficulty,
        tags: topics,
        isPublished,
      })
      successToast(`“${problem.title}” is live at /${problem.slug}. Upload test cases to make it judgeable.`)
      navigate('/admin/problems')
    } catch {
      // The hook already toasted the backend message.
    }
  }

  return (
    <AdminLayout>
      <div className="mx-auto flex w-full max-w-295 flex-col gap-5 px-4 py-6 lg:px-8">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-xs text-muted-foreground">ADMIN / PROBLEMS / NEW PROBLEM</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Create New Problem</h1>
            <span className="rounded-md border border-border bg-secondary px-2 py-1 font-mono text-xs text-secondary-foreground">
              POST /admin/problems
            </span>
          </div>
        </div>

        {/* ---- 01 Basic information ---- */}
        <section className="rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3.5 border-b border-border px-5 py-4">
            <span className="center size-7 rounded-md bg-primary/10 font-mono text-xs text-primary">01</span>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>
              <p className="text-xs text-muted-foreground">Title, difficulty and algorithmic taxonomy</p>
            </div>
          </div>

          <div className="flex flex-col gap-5 p-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between">
                  <label className="field-label" htmlFor="p-title">
                    Problem Title <span className="text-destructive">*</span>
                  </label>
                  <span className="font-mono text-xs text-muted-foreground">{title.length} / 200</span>
                </div>
                <Input
                  id="p-title"
                  className="h-9"
                  maxLength={200}
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value)
                    setError('')
                  }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="field-label flex items-center gap-1.5" htmlFor="p-slug">
                  Generated slug
                  <Icon name="info" size={13} className="text-muted-foreground" />
                </label>
                <div className="input flex h-9 items-center gap-0 overflow-hidden">
                  <span className="font-mono text-sm text-muted-foreground">codeforge.io/p/</span>
                  <span id="p-slug" className="min-w-0 grow truncate font-mono text-sm text-foreground">
                    {slug || '…'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-2">
                <p className="field-label">Difficulty</p>
                <div className="grid grid-cols-3 overflow-hidden rounded-md border border-border" role="radiogroup" aria-label="Difficulty">
                  {DIFFICULTIES.map((option) => (
                    <button
                      key={option}
                      type="button"
                      role="radio"
                      aria-checked={difficulty === option}
                      className={
                        difficulty === option
                          ? 'bg-primary px-3 py-2.5 font-mono text-xs font-semibold text-primary-foreground'
                          : 'px-3 py-2.5 text-xs text-muted-foreground hover:bg-muted/40'
                      }
                      onClick={() => setDifficulty(option)}
                    >
                      {difficultyLabel(option).toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="field-label">Algorithmic Topics</p>
                <div className="flex flex-wrap items-center gap-2 rounded-md border border-border px-2.5 py-2">
                  {topics.map((topic) => (
                    <Tag key={topic} tone="blue" onRemove={() => setTopics((list) => list.filter((item) => item !== topic))}>
                      {topic}
                    </Tag>
                  ))}
                  {topicDraft !== null ? (
                    <Input
                      autoFocus
                      className="h-6 w-32.5 border-none px-1 text-xs shadow-none focus-visible:ring-0"
                      placeholder="Tag name…"
                      aria-label="New topic tag"
                      value={topicDraft}
                      onChange={(event) => setTopicDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && topicDraft.trim()) {
                          setTopics((list) => [...list, topicDraft.trim()])
                          setTopicDraft(null)
                        }
                        if (event.key === 'Escape') setTopicDraft(null)
                      }}
                      onBlur={() => setTopicDraft(null)}
                    />
                  ) : (
                    <button type="button" className="btn btn-ghost btn-sm h-6 px-1.5 text-xs" onClick={() => setTopicDraft('')}>
                      <Icon name="plus" size={12} />
                      Add Tag
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="field-label" htmlFor="p-description">
                Short description
              </label>
              <Input
                id="p-description"
                className="h-9"
                maxLength={500}
                placeholder="One line shown in the problem listing"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
              <span className="text-xs text-muted-foreground">{description.length} / 500</span>
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(event) => setIsPublished(event.target.checked)}
              />
              Publish immediately (otherwise it stays a draft)
            </label>
          </div>
        </section>

        {/* ---- 02 Problem statement ---- */}
        <section className="rounded-xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4">
            <div className="flex items-center gap-3.5">
              <span className="center size-7 rounded-md bg-primary/10 font-mono text-xs text-primary">02</span>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Problem Statement</h2>
                <p className="text-xs text-muted-foreground">Markdown prompt served to candidates</p>
              </div>
            </div>
          </div>

          <Textarea
            className="block min-h-80 w-full resize-y rounded-none border-0 bg-background px-5 py-4 font-mono text-sm leading-6 shadow-none focus-visible:ring-0"
            aria-label="Problem statement in markdown"
            value={markdown}
            spellCheck={false}
            onChange={(event) => {
              setMarkdown(event.target.value)
              setError('')
            }}
          />
        </section>

        {/* ---- Actions ---- */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <div className="min-w-0">
            {error && (
              <p className="inline-flex items-start gap-2 rounded-md bg-destructive/10 px-2 py-1.5 text-left text-xs font-medium text-destructive" role="alert">
                <Icon name="alert" size={13} className="mt-0.5 flex-none" />
                {error}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button variant="outline" type="button" onClick={() => navigate('/admin/problems')}>
              Cancel
            </Button>
            <Button type="button" disabled={loading} onClick={() => void publish()}>
              {loading ? 'Creating…' : 'Create problem'}
              <Icon name="arrowRight" size={14} />
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}