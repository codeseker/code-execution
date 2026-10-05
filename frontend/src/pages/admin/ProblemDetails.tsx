import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import AdminLayout from './AdminLayout'
import { Icon } from '../../components/icons'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { DifficultyBadge, EmptyState } from '../../components/ui'
import { Input } from '../../components/ui/input'
import { Skeleton } from '../../components/ui/skeleton'
import { Textarea } from '../../components/ui/textarea'
import CustomLink from '../../components/CustomLink'
import ConfirmDeleteDialog, { FormField } from '../../components/admin/ConfirmDeleteDialog'
import { TestcaseForm, draftToFile, isTestcaseDraftReady, type TestcaseDraft } from '../../components/admin/TestcaseForm'
import useAdminProblem from '../../hooks/problems/admin/useAdminProblem'
import { useUpdateProblem } from '../../hooks/problems/admin/useProblemMutations'
import { useDeleteProblem, useDeleteTestCase, useUploadTestCase } from '../../hooks/problems/admin/useTestCaseMutations'
import { DIFFICULTIES, type Difficulty } from '../../types/domain'
import { difficultyLabel, formatDateTime, formatKb, formatMs, relativeTime } from '../../lib/format'

/**
 * `/admin/problems/:id` - the dedicated view for one problem.
 *
 * This replaced the former editor modal: a problem carries a full markdown
 * statement, a tag list and an arbitrary number of test cases, which do not fit
 * in an overlay. A real route also means the page is linkable, survives a
 * refresh, and can go back to the catalogue without losing scroll position.
 */
export default function AdminProblemDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [statement, setStatement] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM')
  const [tagsDraft, setTagsDraft] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [drafts, setDrafts] = useState<TestcaseDraft[]>([])
  const [pendingTestCase, setPendingTestCase] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [dirty, setDirty] = useState(false)
  /** Problem id whose server values are currently mirrored in the form. */
  const seededId = useRef<string | null>(null)

  const { details, loading, error, refetch } = useAdminProblem(id)
  const { updateProblem, loading: saving } = useUpdateProblem()
  const { uploadTestCase, loading: uploading } = useUploadTestCase()
  const { deleteTestCase, loading: removing } = useDeleteTestCase()
  const { deleteProblem, loading: deleting } = useDeleteProblem()

  const problem = details?.problem

  // Seeds the form once per problem id. Deliberately *not* re-run on every
  // refetch: that would discard whatever the author is currently typing. After a
  // successful save the seed is cleared, so the revalidated document (with the
  // server's own trimming) does replace the fields.
  useEffect(() => {
    if (!problem) return;
    if (seededId.current === problem._id) return;
    seededId.current = problem._id;
    setTitle(problem.title);
    setDescription(problem.description ?? '');
    setStatement(problem.problemStatement);
    setDifficulty(problem.difficulty);
    setTagsDraft(problem.tags.join(', '));
    setIsPublished(problem.isPublished);
    setDirty(false);
  }, [problem]);

  const tags = tagsDraft
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  const readyDrafts = drafts.filter(isTestcaseDraftReady);
  const testCases = details?.testCases ?? [];
  const sampleCount = testCases.filter((testCase) => testCase.isSample).length;
  const dirtyFields = [
    title !== (problem?.title ?? ''),
    description !== (problem?.description ?? ''),
    statement !== (problem?.problemStatement ?? ''),
    difficulty !== (problem?.difficulty ?? 'MEDIUM'),
    tagsDraft !== (problem?.tags.join(', ') ?? ''),
    isPublished !== (problem?.isPublished ?? false),
  ].filter(Boolean).length;

  /** Wraps a setter so any keystroke marks the form dirty. */
  const edit = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setDirty(true);
  };

  const save = async () => {
    if (!id || !title.trim() || !statement.trim()) return;
    try {
      await updateProblem({
        id,
        payload: {
          title: title.trim(),
          description: description.trim() || null,
          problemStatement: statement.trim(),
          difficulty,
          tags,
          isPublished,
        },
      });
      // Let the revalidated document refill the form.
      seededId.current = null;
      setDirty(false);
    } catch {
      // Toast handled by the hook.
    }
  };

  /**
   * The API takes one input/output pair per request, so a batch of drafts is
   * uploaded in order and the first failure stops the batch. Drafts stay in
   * place on failure so the author can fix and retry without retyping.
   */
  const uploadAll = async () => {
    for (const draft of readyDrafts) {
      try {
        await uploadTestCase({
          id: id ?? '',
          payload: {
            input: draftToFile(draft, 'input'),
            output: draftToFile(draft, 'output'),
            isSample: draft.isSample,
            explanation: draft.explanation.trim() || null,
          },
        });
      } catch {
        // Toast handled by the hook; stop so the author is not spammed.
        return;
      }
    }
    setDrafts([]);
  };

  if (error || !id) {
    return (
      <AdminLayout>
        <div className="mx-auto w-full max-w-360 px-4 py-6 lg:px-8">
          <EmptyState
            icon="alert"
            title="We could not load this problem"
            hint={
              id
                ? 'It may have been deleted, or your account lacks the problem:read permission.'
                : 'No problem id was supplied in the URL.'
            }
            action={
              <div className="flex gap-2.5">
                <Button type="button" variant="outline" onClick={() => void refetch()}>
                  Retry
                </Button>
                <Button type="button" onClick={() => navigate('/admin/problems')}>
                  Back to catalog
                </Button>
              </div>
            }
          />
        </div>
      </AdminLayout>
    );
  }

  if (loading || !problem) {
    return (
      <AdminLayout>
        <div className="mx-auto flex w-full max-w-360 flex-col gap-5 px-4 py-6 lg:px-8" aria-busy="true" aria-label="Loading problem">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-10 w-96" />
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto flex w-full max-w-360 flex-col gap-5 px-4 py-6 lg:px-8">
        {/* ---- Header ---- */}
        <div className="flex flex-col gap-3">
          <nav className="flex flex-wrap items-center gap-1.5 font-mono text-xs text-muted-foreground" aria-label="Breadcrumb">
            <CustomLink variant="unstyled" to="/admin/problems" className="hover:text-foreground">
              ADMIN / PROBLEMS
            </CustomLink>
            <Icon name="chevronRight" size={12} />
            <span className="text-foreground">/{problem.slug}</span>
          </nav>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">{problem.title}</h1>
                <DifficultyBadge difficulty={problem.difficulty} />
                <Badge variant={problem.isPublished ? 'default' : 'secondary'}>
                  {problem.isPublished ? 'Published' : 'Draft'}
                </Badge>
                {problem.isDeleted && <Badge variant="destructive">Deleted</Badge>}
              </div>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="font-mono">GET /admin/problems/{problem._id}</span>
                <span>
                  Created {formatDateTime(problem.createdAt)} · updated {relativeTime(problem.updatedAt)}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {problem.isPublished && (
                <CustomLink
                  variant="unstyled"
                  to={`/problems/${problem.slug}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <Icon name="arrowUpRight" size={14} />
                  View live
                </CustomLink>
              )}
              <Button
                variant="outline"
                type="button"
                disabled={deleting || problem.isDeleted}
                onClick={() => setConfirmDelete(true)}
              >
                <Icon name="trash" size={14} />
                Delete
              </Button>
              <Button type="button" disabled={saving || !dirty || dirtyFields === 0} onClick={() => void save()}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </div>

          {dirty && dirtyFields > 0 && (
            <p className="inline-flex w-fit items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-2.5 py-1.5 text-xs font-medium text-warning" role="status">
              <Icon name="alert" size={13} />
              {dirtyFields} unsaved change{dirtyFields === 1 ? '' : 's'}
            </p>
          )}
        </div>

        {/* ---- Overview ---- */}
        <section className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-lg font-semibold text-foreground">Overview</h2>
            <p className="text-xs text-muted-foreground">
              {problem.totalSubmissions} submissions · {problem.acceptedSubmissions} accepted ·{' '}
              {problem.testCaseCount} test case{problem.testCaseCount === 1 ? '' : 's'} ({sampleCount} sample)
            </p>
          </div>

          <div className="flex flex-col gap-5 p-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <FormField label="Title" htmlFor="detail-title">
                <Input
                  id="detail-title"
                  className="h-9"
                  maxLength={200}
                  value={title}
                  onChange={(event) => edit(setTitle)(event.target.value)}
                />
              </FormField>

              <FormField label="Description" htmlFor="detail-description" hint="One-line summary shown in listings.">
                <Input
                  id="detail-description"
                  className="h-9"
                  maxLength={500}
                  value={description}
                  onChange={(event) => edit(setDescription)(event.target.value)}
                />
              </FormField>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <FormField label="Slug" htmlFor="detail-slug" hint="Generated on creation and stable afterwards.">
                <Input id="detail-slug" className="h-9 font-mono" value={problem.slug} readOnly disabled />
              </FormField>

              <FormField label="Tags" htmlFor="detail-tags" hint="Comma separated.">
                <Input
                  id="detail-tags"
                  className="h-9"
                  value={tagsDraft}
                  onChange={(event) => edit(setTagsDraft)(event.target.value)}
                />
              </FormField>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1" role="group" aria-label="Difficulty">
                {DIFFICULTIES.map((option) => (
                  <Button
                    key={option}
                    type="button"
                    size="sm"
                    variant={difficulty === option ? 'default' : 'outline'}
                    aria-pressed={difficulty === option}
                    onClick={() => edit(setDifficulty)(option)}
                  >
                    {difficultyLabel(option)}
                  </Button>
                ))}
              </div>

              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(event) => edit(setIsPublished)(event.target.checked)}
                />
                Published
              </label>
            </div>

            <FormField label="Problem statement" htmlFor="detail-statement">
              <Textarea
                id="detail-statement"
                rows={12}
                spellCheck={false}
                className="font-mono text-sm leading-6"
                value={statement}
                onChange={(event) => edit(setStatement)(event.target.value)}
              />
            </FormField>
          </div>
        </section>

        {/* ---- Test cases ---- */}
        <section className="rounded-xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Test Cases</h2>
              <p className="text-xs text-muted-foreground">
                {testCases.length} stored · {sampleCount} public sample{sampleCount === 1 ? '' : 's'}
              </p>
            </div>
            <Badge variant="outline" className="tabular-nums">
              POST /admin/problems/{problem._id}/testcases
            </Badge>
          </div>

          <div className="flex flex-col gap-5 p-5">
            {testCases.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                No test cases yet. This problem cannot be judged until it has at least one.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {testCases.map((testCase, index) => (
                  <li key={testCase._id} className="flex flex-wrap items-center gap-3 py-2.5 text-xs">
                    <span className="flex size-6 flex-none items-center justify-center rounded-md bg-muted font-mono text-muted-foreground">
                      {index + 1}
                    </span>
                    <Icon name="file" size={14} className="flex-none text-muted-foreground" />
                    <span className="min-w-0 grow truncate font-mono text-muted-foreground">
                      {testCase.inputFilePath} → {testCase.outputFilePath}
                    </span>
                    {testCase.isSample && <Badge variant="secondary">Sample</Badge>}
                    {testCase.explanation && (
                      <span
                        className="hidden min-w-0 max-w-56 truncate text-muted-foreground lg:inline"
                        title={testCase.explanation}
                      >
                        {testCase.explanation}
                      </span>
                    )}
                    <span className="flex-none tabular-nums text-muted-foreground">
                      {formatMs(testCase.timeLimitMs)} · {formatKb(testCase.memoryLimitKb)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      type="button"
                      className="flex-none text-muted-foreground hover:text-destructive"
                      aria-label={`Remove test case ${index + 1}`}
                      onClick={() => setPendingTestCase(testCase._id)}
                    >
                      <Icon name="trash" size={13} />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-col gap-3 border-t border-border pt-5">
              <h3 className="text-sm font-semibold text-foreground">Add test cases</h3>
              <TestcaseForm
                drafts={drafts}
                onChange={setDrafts}
                disabled={uploading}
                uploading={uploading}
                footerHint="Each case is sent as multipart input + output."
              />

              <div className="flex flex-wrap items-center gap-2.5">
                <Button type="button" size="sm" disabled={uploading || readyDrafts.length === 0} onClick={() => void uploadAll()}>
                  {uploading
                    ? 'Uploading…'
                    : readyDrafts.length > 1
                      ? `Upload ${readyDrafts.length} test cases`
                      : 'Upload test case'}
                </Button>
                {drafts.length > 0 && (
                  <Button type="button" size="sm" variant="ghost" disabled={uploading} onClick={() => setDrafts([])}>
                    Clear
                  </Button>
                )}
                {drafts.some((draft) => !isTestcaseDraftReady(draft)) && (
                  <span className="text-xs text-muted-foreground">Incomplete cases are skipped.</span>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {pendingTestCase && (
        <ConfirmDeleteDialog
          title="Remove this test case?"
          description="The test case document and its files are permanently removed."
          loading={removing}
          onCancel={() => setPendingTestCase(null)}
          onConfirm={() => {
            const target = pendingTestCase;
            setPendingTestCase(null);
            void deleteTestCase({ id: problem._id, testCaseId: target });
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmDeleteDialog
          title={`Delete “${problem.title}”?`}
          description="The problem is soft-deleted: it leaves the public catalogue while its test cases and files are kept for history."
          loading={deleting}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false);
            void deleteProblem(problem._id).then(() => navigate('/admin/problems'));
          }}
        />
      )}
    </AdminLayout>
  );
}