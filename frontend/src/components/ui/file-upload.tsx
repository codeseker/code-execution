import { useId, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, KeyboardEvent } from 'react'
import { Icon } from '../icons'
import { Button } from './button'
import { cx } from '../ui'

/** Progress states the control can render; the parent owns `uploading`. */
export type FileUploadStatus = 'idle' | 'uploading' | 'success' | 'error'

export type FileUploadProps = {
  /** Currently selected file, or null. */
  value: File | null
  onChange: (file: File | null) => void
  /** Visible field label, e.g. "Input file". */
  label?: string
  /** `accept` attribute; also rendered in the hint. */
  accept?: string
  /** Human readable accepted types for the hint. */
  acceptHint?: string
  /** Rejected size, in bytes. */
  maxSizeBytes?: number
  disabled?: boolean
  status?: FileUploadStatus
  /** Message shown for `status="error"`, and as the aria live region. */
  statusMessage?: string | null
  /** Renders a denser control for use inside a two-column grid. */
  compact?: boolean
  className?: string
}

const DEFAULT_ACCEPT = '.txt,.in,.out,.json,.csv,.md'
const DEFAULT_ACCEPT_HINT = '.txt, .in, .out, .json, .csv, .md'
const DEFAULT_MAX_SIZE = 1_048_576 // 1 MiB

/** `1048576` -> "1.0 MB". */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Drag-and-drop file picker.
 *
 * A native `<input type="file">` stays the single source of truth (so
 * keyboard and screen-reader behaviour is the browser's own); the rest is the
 * themed dropzone: dashed idle border, highlighted drag-over state, a selected
 * file row with name + size and an X to clear, plus the parent-driven
 * uploading / success / error feedback.
 */
export function FileUpload({
  value,
  onChange,
  label = 'File',
  accept = DEFAULT_ACCEPT,
  acceptHint = DEFAULT_ACCEPT_HINT,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  disabled = false,
  status = 'idle',
  statusMessage,
  compact = false,
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const describedBy = useId()
  const error = localError ?? (status === 'error' ? statusMessage : null)
  const draggingRef = useRef(false)

  const pick = (files: FileList | null | undefined) => {
    const file = files?.[0] ?? null
    if (!file) return
    if (file.size > maxSizeBytes) {
      setLocalError(
        `${file.name} is ${formatBytes(file.size)} — the limit is ${formatBytes(maxSizeBytes)}.`,
      )
      onChange(null)
      return
    }
    setLocalError(null)
    onChange(file)
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    draggingRef.current = false
    setDragging(false)
    if (disabled) return
    pick(event.dataTransfer?.files)
  }

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    pick(event.target.files)
    // Allow re-picking the same file after a clear.
    event.target.value = ''
  }

  const open = () => {
    if (!disabled) inputRef.current?.click()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return
    event.preventDefault()
    open()
  }

  const dropzone = (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      aria-label={`${label}: drag and drop or press Enter to browse`}
      aria-describedby={describedBy}
      onClick={open}
      onKeyDown={onKeyDown}
      onDragEnter={(event) => {
        event.preventDefault()
        if (disabled) return
        draggingRef.current = true
        setDragging(true)
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        event.preventDefault()
        // Ignore the leave events fired while moving onto a child node.
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
        draggingRef.current = false
        setDragging(false)
      }}
      onDrop={onDrop}
      className={cx(
        'flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center transition-colors',
        compact ? 'px-3 py-3' : 'px-4 py-6',
        disabled
          ? 'cursor-not-allowed border-border bg-muted/30 opacity-60'
          : 'cursor-pointer border-control-border bg-background hover:border-primary hover:bg-muted/40',
        dragging && 'border-primary bg-primary/5',
        error && !dragging && 'border-destructive bg-destructive/5',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        className="sr-only"
        tabIndex={-1}
        onChange={onInputChange}
      />
      <span className="text-muted-foreground">
        <Icon name="uploadCloud" size={compact ? 16 : 22} />
      </span>
      <p className={cx('font-medium text-foreground', compact ? 'text-xs' : 'text-sm')}>
        Drag &amp; drop or <span className="text-primary">click to browse</span>
      </p>
      <p id={describedBy} className="text-xs text-muted-foreground">
        Accepts {acceptHint} · up to {formatBytes(maxSizeBytes)}
      </p>
    </div>
  )

  return (
    <div className={cx('flex min-w-0 flex-col gap-1.5', className)}>
      {label && <p className="text-xs font-medium text-muted-foreground">{label}</p>}
      {value ? (
        <div
          className={cx(
            'flex min-w-0 items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2',
            error && 'border-destructive/50',
          )}
        >
          <span className="flex-none text-muted-foreground">
            <Icon name="file" size={16} />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-mono text-xs text-foreground" title={value.name}>
              {value.name}
            </span>
            <span className="text-xs text-muted-foreground">{formatBytes(value.size)}</span>
          </span>
          <span className="grow" />
          {status === 'uploading' && (
            <span className="flex-none text-xs text-muted-foreground" role="status">
              Uploading…
            </span>
          )}
          {status === 'success' && (
            <span className="flex-none text-success" title="Uploaded" aria-label="Uploaded">
              <Icon name="checkCircle" size={16} />
            </span>
          )}
          {status === 'error' && (
            <span className="flex-none text-destructive" title="Upload failed" aria-label="Upload failed">
              <Icon name="alert" size={16} />
            </span>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove ${value.name}`}
            disabled={disabled}
            onClick={() => {
              setLocalError(null)
              onChange(null)
            }}
          >
            <Icon name="x" size={14} />
          </Button>
        </div>
      ) : (
        dropzone
      )}

      <p
        role={error ? 'alert' : 'status'}
        aria-live="polite"
        className={cx('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}
      >
        {error ?? ''}
      </p>
    </div>
  )
}

export default FileUpload