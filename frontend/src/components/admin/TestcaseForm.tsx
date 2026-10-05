import { useRef } from 'react'
import { Icon } from '../icons'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { FileUpload } from '../ui/file-upload'
import { BaseTooltip } from '../BaseTooltip'
import { cx } from '../ui'

/**
 * One test case being authored, either in the problem create/edit form or in
 * the problem detail modal's "Add testcase" flow. This component is the single
 * implementation of that form: both surfaces render it, so the fields,
 * validation, layout and behaviour cannot drift apart.
 */
export type TestcaseDraft = {
  /** Client-only identity; never sent to the API. */
  id: string
  input: string
  expectedOutput: string
  /** Sample cases are public and are run by the "Run samples" button. */
  isSample: boolean
  explanation: string
}

export function createTestcaseDraft(id: string, overrides: Partial<TestcaseDraft> = {}): TestcaseDraft {
  return {
    id,
    input: '',
    expectedOutput: '',
    isSample: false,
    explanation: '',
    ...overrides,
  }
}

let draftCounter = 0

/** Stable, collision-free id for a freshly added draft. */
export function nextTestcaseDraftId(): string {
  draftCounter += 1
  return `testcase-${Date.now().toString(36)}-${draftCounter}`
}

/** A draft is uploadable once it has an input and an expected output. */
export function isTestcaseDraftReady(draft: TestcaseDraft): boolean {
  return draft.input.trim().length > 0 && draft.expectedOutput.trim().length > 0
}

/** Drops trailing whitespace so the stored file has no stray blank lines. */
export function draftToFileContent(value: string): string {
  return value.replace(/\s+$/, '')
}

export function draftToFile(draft: TestcaseDraft, kind: 'input' | 'output'): File {
  const content = draftToFileContent(kind === 'input' ? draft.input : draft.expectedOutput)
  return new File([content], `${draft.id}.${kind === 'input' ? 'in' : 'out'}`, {
    type: 'text/plain',
  })
}

export type TestcaseFormProps = {
  drafts: TestcaseDraft[]
  onChange: (drafts: TestcaseDraft[]) => void
  disabled?: boolean
  /** `uploading` shows the per-file progress state on every dropzone. */
  uploading?: boolean
  /** Shown under the list, e.g. the endpoint the cases are posted to. */
  footerHint?: string
  className?: string
}

const monoField =
  'font-mono text-xs leading-5 md:text-xs'

/**
 * The shared testcase editor: a stack of case cards, each with an input and an
 * expected-output textarea, a sample/hidden switch, an optional explanation,
 * a per-case file import, and add/remove controls.
 */
export function TestcaseForm({
  drafts,
  onChange,
  disabled = false,
  uploading = false,
  footerHint,
  className,
}: TestcaseFormProps) {
  const filesRef = useRef(new Map<string, { input?: File; output?: File }>())

  const patch = (id: string, changes: Partial<TestcaseDraft>) => {
    onChange(drafts.map((draft) => (draft.id === id ? { ...draft, ...changes } : draft)))
  }

  const remove = (id: string) => {
    filesRef.current.delete(id)
    onChange(drafts.filter((draft) => draft.id !== id))
  }

  const add = () => {
    onChange([...drafts, createTestcaseDraft(nextTestcaseDraftId())])
  }

  /**
   * A dropped/picked file is read into the matching textarea, so both ways of
   * filling a case end up in the same place and the upload still goes through
   * the existing multipart endpoint.
   */
  const adoptFile = async (id: string, kind: 'input' | 'output', file: File | null) => {
    const slot = filesRef.current.get(id) ?? {}
    if (!file) {
      delete slot[kind]
      filesRef.current.set(id, slot)
      return
    }
    slot[kind] = file
    filesRef.current.set(id, slot)
    try {
      const text = await file.text()
      patch(id, kind === 'input' ? { input: text } : { expectedOutput: text })
    } catch {
      // A file that cannot be read simply leaves the textarea untouched.
    }
  }

  return (
    <div className={cx('flex flex-col gap-3', className)}>
      {drafts.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
          No test cases yet. Add one to make this problem judgeable.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {drafts.map((draft, index) => {
            const ready = isTestcaseDraftReady(draft)
            const inputEmpty = draft.input.trim().length === 0
            const expectedEmpty = draft.expectedOutput.trim().length === 0
            return (
              <li
                key={draft.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3"
                aria-label={`Test case ${index + 1}`}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 font-mono text-xs text-primary">
                    {index + 1}
                  </span>
                  <Label htmlFor={`${draft.id}-sample`} className="cursor-pointer gap-2">
                    <Switch
                      id={`${draft.id}-sample`}
                      size="sm"
                      checked={draft.isSample}
                      disabled={disabled}
                      onCheckedChange={(checked: boolean) => patch(draft.id, { isSample: checked })}
                    />
                    <span className="text-xs text-muted-foreground">
                      {draft.isSample ? 'Sample (public)' : 'Hidden'}
                    </span>
                  </Label>
                  <span className="grow" />
                  {!ready && (
                    <span className="text-xs text-muted-foreground" role="status">
                      {inputEmpty ? 'Input required' : 'Expected output required'}
                    </span>
                  )}
                  <BaseTooltip content={`Remove test case ${index + 1}`}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove test case ${index + 1}`}
                      disabled={disabled}
                      onClick={() => remove(draft.id)}
                    >
                      <Icon name="trash" size={14} />
                    </Button>
                  </BaseTooltip>
                </div>

                <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <Label htmlFor={`${draft.id}-input`} className="text-xs font-medium text-muted-foreground">
                      Input
                    </Label>
                    <Textarea
                      id={`${draft.id}-input`}
                      rows={4}
                      spellCheck={false}
                      disabled={disabled}
                      aria-invalid={inputEmpty}
                      className={cx(monoField, 'min-h-24 resize-y')}
                      placeholder="Raw stdin for this case"
                      value={draft.input}
                      onChange={(event) => patch(draft.id, { input: event.target.value })}
                    />
                    <FileUpload
                      compact
                      label="Import input file"
                      value={filesRef.current.get(draft.id)?.input ?? null}
                      onChange={(file) => void adoptFile(draft.id, 'input', file)}
                      disabled={disabled}
                      status={uploading ? 'uploading' : 'idle'}
                      acceptHint=".txt, .in, .json, .csv"
                    />
                  </div>

                  <div className="flex min-w-0 flex-col gap-1.5">
                    <Label htmlFor={`${draft.id}-output`} className="text-xs font-medium text-muted-foreground">
                      Expected Output
                    </Label>
                    <Textarea
                      id={`${draft.id}-output`}
                      rows={4}
                      spellCheck={false}
                      disabled={disabled}
                      aria-invalid={expectedEmpty}
                      className={cx(monoField, 'min-h-24 resize-y')}
                      placeholder="Exact stdout the judge compares against"
                      value={draft.expectedOutput}
                      onChange={(event) => patch(draft.id, { expectedOutput: event.target.value })}
                    />
                    <FileUpload
                      compact
                      label="Import expected output file"
                      value={filesRef.current.get(draft.id)?.output ?? null}
                      onChange={(file) => void adoptFile(draft.id, 'output', file)}
                      disabled={disabled}
                      status={uploading ? 'uploading' : 'idle'}
                      acceptHint=".txt, .out, .json, .csv"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor={`${draft.id}-explanation`}
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Explanation <span className="font-normal">(optional)</span>
                  </Label>
                  <Input
                    id={`${draft.id}-explanation`}
                    disabled={disabled}
                    maxLength={500}
                    placeholder="What this case checks"
                    value={draft.explanation}
                    onChange={(event) => patch(draft.id, { explanation: event.target.value })}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={add}>
          <Icon name="plus" size={14} />
          Add Test Case
        </Button>
        {footerHint && <p className="text-xs text-muted-foreground">{footerHint}</p>}
      </div>
    </div>
  )
}

export default TestcaseForm