import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import AdminLayout from './AdminLayout'
import { Icon } from '../../components/icons'
import { Tag } from '../../components/ui'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { TestcaseForm, createTestcaseDraft, draftToFile, isTestcaseDraftReady, nextTestcaseDraftId, type TestcaseDraft } from '../../components/admin/TestcaseForm'
import { useCreateProblem } from '../../hooks/problems/admin/useProblemMutations'
import { useUploadTestCase } from '../../hooks/problems/admin/useTestCaseMutations'
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

const TITLE_MAX = 200
const DESCRIPTION_MAX = 500
const STATEMENT_MIN = 40
const TOPICS_MAX = 8

type CreatedProblem = Awaited<ReturnType<ReturnType<typeof useCreateProblem>['createProblem']>>
type FieldErrors = { title?: string; statement?: string }

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

/* ------------------------------------------------------------------ */
/* Small layout helpers: these replace three copy-pasted section heads */
/* ------------------------------------------------------------------ */

function SectionCard({
  step,
  title,
  subtitle,
  aside,
  children,
}: {
  step: string
  title: string
  subtitle: string
  aside?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-3.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 font-mono text-xs text-primary">
            {step}
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {aside}
      </header>
      {children}
    </section>
  )
}

function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
}: {
  label: string
  htmlFor?: string
  required?: boolean
  hint?: ReactNode
  error?: string
  children: ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        {htmlFor ? (
          <label className="text-xs font-medium text-muted-foreground" htmlFor={htmlFor}>
            {label}
            {required && <span className="text-destructive"> *</span>}
          </label>
        ) : (
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
        )}
        {hint && <span className="font-mono text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
      {error && (
        <p id={htmlFor ? `${htmlFor}-error` : undefined} className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * `POST /admin/problems` - the backend derives the slug from the title, so the
 * preview below is informational only and never sent back to the API.
 */
export default function AddProblem() {
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM')
  const [topics, setTopics] = useState<string[]>([])
  const [topicDraft, setTopicDraft] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [markdown, setMarkdown] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState<CreatedProblem | null>(null)
  const [testcases, setTestcases] = useState<TestcaseDraft[]>([
    createTestcaseDraft(nextTestcaseDraftId(), { isSample: true }),
  ])

  // Drafts that already reached the server, so a retry never uploads them twice.
  const uploadedRef = useRef<Set<TestcaseDraft['id']>>(new Set())

  const { createProblem, loading } = useCreateProblem()
  const { uploadTestCase } = useUploadTestCase()

  const busy = submitting || loading
  // Once the problem exists, its core fields can no longer be changed from this page.
  const locked = created !== null
  const fieldsDisabled = busy || locked

  const slug = slugify(title)
  const readyTestcases = testcases.filter(isTestcaseDraftReady)
  const incompleteCount = testcases.length - readyTestcases.length

  // Warn before closing the tab with unsaved work.
  const dirty = !created && Boolean(title || description || markdown || topics.length)
  useEffect(() => {
    if (!dirty) return
    const handler = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  /* ---------------------------- topics ---------------------------- */

  const commitTopic = () => {
    const value = (topicDraft ?? '').trim().replace(/,+$/, '').trim()
    setTopicDraft(null)
    if (!value) return
    setTopics((list) =>
      list.length >= TOPICS_MAX || list.some((item) => item.toLowerCase() === value.toLowerCase())
        ? list
        : [...list, value],
    )
  }

  /* ---------------------------- submit ---------------------------- */

  const validate = () => {
    const next: FieldErrors = {}
    if (!title.trim()) next.title = 'Enter a problem title.'
    if (markdown.trim().length < STATEMENT_MIN) {
      next.statement = `Write at least ${STATEMENT_MIN} characters so candidates have a real prompt.`
    }
    setErrors(next)
    if (next.title) document.getElementById('p-title')?.focus()
    else if (next.statement) document.getElementById('p-statement')?.focus()
    return Object.keys(next).length === 0
  }

  const submit = async () => {
    if (busy) return
    setFormError('')
    if (!created && !validate()) return

    setSubmitting(true)
    try {
      let problem = created

      if (!problem) {
        try {
          problem = await createProblem({
            title: title.trim(),
            description: description.trim() || null,
            problemStatement: markdown.trim(),
            difficulty,
            tags: topics,
            isPublished,
          })
          setCreated(problem)
        } catch {
          // The hook already toasted the backend message.
          return
        }
      }

      // Test cases need the problem id, so they are uploaded straight after the
      // problem exists. A failed upload keeps the author on this page with the
      // drafts intact, and a retry resumes from the first one that failed.
      for (const draft of readyTestcases) {
        if (uploadedRef.current.has(draft.id)) continue
        try {
          await uploadTestCase({
            id: problem._id,
            payload: {
              input: draftToFile(draft, 'input'),
              output: draftToFile(draft, 'output'),
              isSample: draft.isSample,
              explanation: draft.explanation.trim() || null,
            },
          })
          uploadedRef.current.add(draft.id)
        } catch {
          setFormError(
            `“${problem.title}” was created, but a test case failed to upload. Fix it and select Retry upload. Test cases already uploaded are skipped.`,
          )
          return
        }
      }

      const count = readyTestcases.length
      const where = `/p/${problem.slug}`
      const state = isPublished ? `is live at ${where}` : `was saved as a draft (${where})`
      successToast(
        count > 0
          ? `“${problem.title}” ${state} with ${count} test case${count > 1 ? 's' : ''}.`
          : `“${problem.title}” ${state}. Add test cases to make it judgeable.`,
      )
      navigate('/admin/problems')
    } finally {
      setSubmitting(false)
    }
  }

  const submitLabel = submitting
    ? created
      ? 'Uploading test cases…'
      : 'Creating…'
    : created
      ? 'Retry upload'
      : isPublished
        ? 'Create and publish'
        : 'Create draft'

  return (
    <AdminLayout>
      <div className="mx-auto flex w-full max-w-295 flex-col gap-5 px-4 pt-6 lg:px-8">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-xs text-muted-foreground">ADMIN / PROBLEMS / NEW PROBLEM</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Create New Problem</h1>
        </div>

        {locked && (
          <p className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground" role="status">
            <Icon name="info" size={14} className="mt-0.5 flex-none" />
            This problem has been created. Title, difficulty and statement are locked here; edit them from the problem catalog.
          </p>
        )}

        {/* ---- 01 Basic information ---- */}
        <SectionCard step="01" title="Basic Information" subtitle="Title, difficulty and algorithmic taxonomy">
          <div className="flex flex-col gap-5 p-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <Field
                label="Problem title"
                htmlFor="p-title"
                required
                hint={`${title.length} / ${TITLE_MAX}`}
                error={errors.title}
              >
                <Input
                  id="p-title"
                  className="h-9"
                  maxLength={TITLE_MAX}
                  placeholder={DEFAULT_TITLE}
                  value={title}
                  disabled={fieldsDisabled}
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby={errors.title ? 'p-title-error' : undefined}
                  onChange={(event) => {
                    setTitle(event.target.value)
                    setErrors((current) => ({ ...current, title: undefined }))
                  }}
                />
              </Field>

              <Field label="Generated slug">
                <div className="flex h-9 min-w-0 items-center overflow-hidden rounded-md border border-border bg-muted/30 px-3">
                  <span className="shrink-0 font-mono text-sm text-muted-foreground">codeforge.io/p/</span>
                  <span className="min-w-0 grow truncate font-mono text-sm text-foreground" aria-live="polite">
                    {slug || '…'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Preview only. The server generates the final slug from the title.</p>
              </Field>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Field label="Difficulty">
                <div
                  className="grid h-9 grid-cols-3 divide-x divide-border overflow-hidden rounded-md border border-border"
                  role="group"
                  aria-label="Difficulty"
                >
                  {DIFFICULTIES.map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={difficulty === option}
                      disabled={fieldsDisabled}
                      className={`text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/60 disabled:cursor-not-allowed disabled:opacity-60 ${difficulty === option
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                        }`}
                      onClick={() => setDifficulty(option)}
                    >
                      {difficultyLabel(option)}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Algorithmic topics" hint={`${topics.length} / ${TOPICS_MAX}`}>
                <div className="flex min-h-9 flex-wrap items-center gap-2 rounded-md border border-border px-2.5 py-1.5">
                  {topics.map((topic) => (
                    <Tag
                      key={topic}
                      tone="blue"
                      onRemove={fieldsDisabled ? undefined : () => setTopics((list) => list.filter((item) => item !== topic))}
                    >
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
                        if (event.key === 'Enter' || event.key === ',') {
                          event.preventDefault()
                          commitTopic()
                        }
                        if (event.key === 'Escape') setTopicDraft(null)
                      }}
                      onBlur={commitTopic}
                    />
                  ) : (
                    topics.length < TOPICS_MAX && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 gap-1 px-1.5 text-xs"
                        disabled={fieldsDisabled}
                        onClick={() => setTopicDraft('')}
                      >
                        <Icon name="plus" size={12} className="shrink-0" />
                        Add tag
                      </Button>
                    )
                  )}
                </div>
              </Field>
            </div>

            <Field
              label="Short description"
              htmlFor="p-description"
              hint={`${description.length} / ${DESCRIPTION_MAX}`}
            >
              <Input
                id="p-description"
                className="h-9"
                maxLength={DESCRIPTION_MAX}
                placeholder="One line shown in the problem listing"
                value={description}
                disabled={fieldsDisabled}
                onChange={(event) => setDescription(event.target.value)}
              />
            </Field>

            <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm text-muted-foreground">
              <input
                type="checkbox"
                className="size-4 cursor-pointer accent-primary"
                checked={isPublished}
                disabled={fieldsDisabled}
                onChange={(event) => setIsPublished(event.target.checked)}
              />
              Publish immediately
              <span className="text-xs">({isPublished ? 'visible to candidates' : 'saved as a draft'})</span>
            </label>
          </div>
        </SectionCard>

        {/* ---- 02 Problem statement ---- */}
        <SectionCard
          step="02"
          title="Problem Statement"
          subtitle="Markdown prompt served to candidates"
          aside={
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-muted-foreground">{markdown.trim().length} chars</span>
              {!markdown && !fieldsDisabled && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setMarkdown(DEFAULT_MARKDOWN)}
                >
                  Insert example
                </Button>
              )}
            </div>
          }
        >
          <Textarea
            id="p-statement"
            className="block min-h-80 w-full resize-y rounded-none border-0 bg-background px-5 py-4 font-mono text-sm leading-6 shadow-none focus-visible:ring-0"
            aria-label="Problem statement in markdown"
            aria-invalid={Boolean(errors.statement)}
            aria-describedby={errors.statement ? 'p-statement-error' : undefined}
            placeholder="Describe the task, then list constraints and examples. Markdown is supported."
            value={markdown}
            disabled={fieldsDisabled}
            spellCheck={false}
            onChange={(event) => {
              setMarkdown(event.target.value)
              setErrors((current) => ({ ...current, statement: undefined }))
            }}
          />
          {errors.statement && (
            <p id="p-statement-error" className="border-t border-border px-5 py-2.5 text-xs font-medium text-destructive" role="alert">
              {errors.statement}
            </p>
          )}
        </SectionCard>

        {/* ---- 03 Test cases ---- */}
        <SectionCard
          step="03"
          title="Test Cases"
          subtitle="Uploaded right after the problem is created"
          aside={
            <span className="rounded-md border border-border bg-secondary px-2 py-1 font-mono text-xs text-secondary-foreground">
              {readyTestcases.length} ready
            </span>
          }
        >
          <div className="flex flex-col gap-3 p-5">
            {incompleteCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {incompleteCount} incomplete test case{incompleteCount > 1 ? 's' : ''} will be skipped. A test case needs both input and output.
              </p>
            )}
            <TestcaseForm
              drafts={testcases}
              onChange={setTestcases}
              disabled={busy}
              uploading={submitting}
              footerHint="Paste the data, or drop a file to fill the field."
            />
          </div>
        </SectionCard>

        {/* ---- Actions: sticky so they stay reachable on long forms ---- */}
        <div className="sticky bottom-0 z-10 -mx-4 mt-1 border-t border-border bg-background/90 px-4 py-3 backdrop-blur lg:-mx-8 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              {formError && (
                <p className="inline-flex items-start gap-2 rounded-md bg-destructive/10 px-2.5 py-1.5 text-left text-xs font-medium text-destructive" role="alert">
                  <Icon name="alert" size={13} className="mt-0.5 flex-none" />
                  {formError}
                </p>
              )}
            </div>
            <div className="flex flex-none gap-2.5">
              <Button variant="outline" type="button" disabled={busy} onClick={() => navigate('/admin/problems')}>
                {locked ? 'Back to catalog' : 'Cancel'}
              </Button>
              <Button type="button" className="gap-1.5" disabled={busy} onClick={() => void submit()}>
                {submitLabel}
                {!busy && <Icon name="arrowRight" size={14} className="shrink-0" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}