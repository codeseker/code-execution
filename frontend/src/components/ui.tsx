import type { ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'
import { useTheme } from '../theme'
import { Icon } from './icons'
import type { ProblemStatus } from '../data'
import type { Difficulty as ApiDifficulty } from '../types/domain'
import { difficultyLabel, statusLabel, statusToneClass } from '../lib/format'
import type { StatusValue } from '../lib/format'
import CustomButton from './CustomButton'
import { Badge } from './ui/badge'
import { Progress as ShadcnProgress } from './ui/progress'
import { Button } from './ui/button'

/** Tiny class-name joiner. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** CodeForge logo: rounded accent tile with `</>` + wordmark. */
export function Logo({
  size = 28,
  wordmark = true,
  className,
}: {
  size?: number
  wordmark?: boolean
  className?: string
}) {
  const tileSize = size <= 24 ? 'size-6' : size <= 28 ? 'size-7' : 'size-8'
  return (
    <span className={cx('inline-flex items-center gap-2', className)}>
      <span className={cx('inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground', tileSize)} aria-hidden>
        <Icon name="codeXml" size={Math.round(size * 0.58)} strokeWidth={2.2} />
      </span>
      {wordmark && (
        <span className="font-sans text-sm font-semibold text-foreground">
          CodeForge
        </span>
      )}
    </span>
  )
}

/** Persistent light/dark toggle used in every topbar (⌘⇧L). */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolved, toggle } = useTheme()
  return (
    <CustomButton variant="unstyled"
      type="button"
      className={cx('icon-btn tip', className)}
      data-tip="Toggle theme ⌘⇧L"
      aria-label={`Switch to ${resolved === 'dark' ? 'light' : 'dark'} theme`}
      onClick={toggle}
    >
      <Icon name={resolved === 'dark' ? 'sun' : 'moon'} size={17} />
    </CustomButton>
  )
}

export function Avatar({
  initials,
  size = 26,
  className,
}: {
  initials: string
  size?: number
  className?: string
}) {
  const avatarSize = size <= 24 ? 'size-6 text-xs' : size <= 28 ? 'size-7 text-xs' : 'size-8 text-sm'
  return (
    <span
      className={cx(
        'flex shrink-0 items-center justify-center rounded-full bg-secondary font-medium text-secondary-foreground',
        avatarSize,
        className,
      )}
      aria-hidden
    >
      {initials}
    </span>
  )
}

/** Overlapping avatar row (auth/landing social proof). */
export function AvatarStack({ initials, size = 26 }: { initials: string[]; size?: number }) {
  const avatarSize = size <= 24 ? 'size-6 text-xs' : 'size-7 text-xs'
  return (
    <span className="flex" aria-hidden>
      {initials.map((s, i) => (
        <span
          key={s + i}
          className={cx('inline-flex items-center justify-center rounded-full border-2 border-card font-medium', avatarSize, i > 0 && '-ml-2', i % 3 === 0 ? 'bg-primary text-primary-foreground' : i % 3 === 1 ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground')}
        >
          {s}
        </span>
      ))}
    </span>
  )
}

/** Soft Notion-style tag (4px radius). */
export function Tag({
  tone = 'gray',
  children,
  onRemove,
  className,
}: {
  tone?: string
  children: ReactNode
  onRemove?: () => void
  className?: string
}) {
  const toneClass = tone === 'red' || tone === 'orange' || tone === 'pink'
    ? 'border-transparent bg-destructive/10 text-destructive'
    : tone === 'green'
      ? 'border-transparent bg-primary/10 text-primary'
      : tone === 'yellow'
        ? 'border-transparent bg-muted text-muted-foreground'
        : 'border-transparent bg-secondary text-secondary-foreground'
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium', toneClass, className)}>
      {children}
      {onRemove && (
        <Button variant="ghost" size="icon"
          type="button"
          className="ml-0.5 size-6"
          aria-label="Remove tag"
          onClick={onRemove}
        >
          <Icon name="x" size={10} strokeWidth={2.4} />
        </Button>
      )}
    </span>
  )
}

type PillTone = 'success' | 'error' | 'warning' | 'accent' | 'neutral'

/** Semantic status inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium (always paired with an icon or label). */
export function Pill({
  tone = 'neutral',
  icon,
  children,
  className,
}: {
  tone?: PillTone
  icon?: ReactNode
  children: ReactNode
  className?: string
}) {
  const toneClass = tone === 'success' || tone === 'accent'
    ? 'bg-primary/10 text-primary'
    : tone === 'error'
      ? 'bg-destructive/10 text-destructive'
      : tone === 'warning'
        ? 'bg-muted text-muted-foreground'
        : 'bg-secondary text-secondary-foreground'
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium', toneClass, className)}>
      {icon}
      {children}
    </span>
  )
}

export function Progress({
  value,
  className,
  barClassName,
}: {
  value: number
  className?: string
  barClassName?: string
}) {
  return <ShadcnProgress value={value} className={className} indicatorClassName={barClassName} aria-valuemin={0} aria-valuemax={100} />
}

/** Difficulty colors remain semantic so the theme controls every route consistently. */
export function DifficultyBadge({ difficulty, className }: { difficulty: ApiDifficulty; className?: string }) {
  const label = difficultyLabel(difficulty)
  const tone = difficulty === 'EASY'
    ? 'bg-difficulty-easy/10 text-difficulty-easy'
    : difficulty === 'MEDIUM'
      ? 'bg-difficulty-medium/10 text-difficulty-medium'
      : 'bg-difficulty-hard/10 text-difficulty-hard'
  return <Badge variant="outline" className={cx('border-transparent', tone, className)}>{label}</Badge>
}

/**
 * Status pill for verdicts, queue states and the legacy display strings from
 * `data.ts` - all normalised through `lib/format`.
 */
export function StatusBadge({ status, className }: { status: StatusValue; className?: string }) {
  return <Badge className={cx('gap-1.5 border-transparent', statusToneClass(status), className)}>{statusLabel(status)}</Badge>
}

/** Row status glyph: solved ✓ / attempted ◐ / todo ○ — shape + color, never color alone. */
export function ProblemStatusIcon({ status }: { status: ProblemStatus }) {
  const name = status === 'solved' ? 'checkCircle' : status === 'attempted' ? 'circleHalf' : 'circle'
  const tone = status === 'solved' ? 'text-primary' : 'text-muted-foreground'
  const label = status === 'solved' ? 'Solved' : status === 'attempted' ? 'Attempted' : 'Not started'
  return (
    <span className={cx('inline-flex', tone)} title={label} aria-label={label}>
      <Icon name={name} size={17} />
    </span>
  )
}

/** Segmented control (mobile panels / chart ranges). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (v: T) => void
  ariaLabel: string
}) {
  return (
    <div className="seg" role="tablist" aria-label={ariaLabel}>
      {options.map((o) => (
        <CustomButton variant="unstyled"
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          className={cx('seg-btn', o.value === value && 'is-active')}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </CustomButton>
      ))}
    </div>
  )
}

/** Centered empty state: 48px outline icon + headline + helper + action. */
export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon: Parameters<typeof Icon>[0]['name']
  title: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="text-muted-foreground">
        <Icon name={icon} size={32} strokeWidth={1.5} />
      </span>
      <p className="text-base font-semibold text-foreground">{title}</p>
      {hint && <p className="max-w-95 text-sm leading-6 text-muted-foreground">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/** Small spinner used while "executing" runs/submissions. */
export function Spinner({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <LoaderCircle size={size} className={cx('animate-spin text-muted-foreground motion-reduce:animate-none', className)} aria-hidden />
  )
}
