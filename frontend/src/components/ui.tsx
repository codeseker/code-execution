import type { ReactNode } from 'react'
import { useTheme } from '../theme'
import { Icon } from './icons'
import type { Difficulty, ProblemStatus } from '../data'
import { DIFFICULTY_TONE } from '../data'
import CustomButton from './ui/CustomButton'

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
  return (
    <span className={cx('inline-flex items-center gap-2', className)}>
      <span
        className="center rounded-[7px] bg-accent text-on-accent"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <Icon name="codeXml" size={Math.round(size * 0.58)} strokeWidth={2.2} />
      </span>
      {wordmark && (
        <span className="text-ink" style={{ fontSize: size * 0.54, fontWeight: 700, letterSpacing: '-0.02em' }}>
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
  return (
    <span
      className={cx(
        'center shrink-0 rounded-full bg-accent-soft text-accent font-semibold',
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden
    >
      {initials}
    </span>
  )
}

/** Overlapping avatar row (auth/landing social proof). */
export function AvatarStack({ initials, size = 26 }: { initials: string[]; size?: number }) {
  return (
    <span className="flex" aria-hidden>
      {initials.map((s, i) => (
        <span
          key={s + i}
          className="center rounded-full border-2 border-canvas font-semibold"
          style={{
            width: size,
            height: size,
            fontSize: size * 0.36,
            marginLeft: i === 0 ? 0 : -size * 0.32,
            background: i % 3 === 0 ? 'var(--accent)' : i % 3 === 1 ? '#6B7280' : '#E03E3E',
            color: '#fff',
          }}
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
  return (
    <span className={cx('tag', `tag-${tone}`, className)}>
      {children}
      {onRemove && (
        <CustomButton variant="unstyled"
          type="button"
          className="ml-0.5 rounded-xs opacity-60 hover:opacity-100"
          aria-label="Remove tag"
          onClick={onRemove}
        >
          <Icon name="x" size={10} strokeWidth={2.4} />
        </CustomButton>
      )}
    </span>
  )
}

type PillTone = 'success' | 'error' | 'warning' | 'accent' | 'neutral'

/** Semantic status pill (always paired with an icon or label). */
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
  return (
    <span className={cx('pill', `pill-${tone}`, className)}>
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
  return (
    <div className={cx('progress', className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <i className={barClassName} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

/** Difficulty badge: 3-bar glyph + label, green/yellow/red per design.md. */
export function DifficultyBadge({ difficulty, className }: { difficulty: Difficulty; className?: string }) {
  const filled = difficulty === 'Easy' ? 1 : difficulty === 'Medium' ? 2 : 3
  return (
    <span className={cx('tag', `tag-${DIFFICULTY_TONE[difficulty]}`, className)}>
      <span className="flex items-end gap-[1.5px]" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 3,
              height: 5 + i * 2,
              borderRadius: 1,
              background: 'currentColor',
              opacity: i < filled ? 1 : 0.3,
            }}
          />
        ))}
      </span>
      {difficulty}
    </span>
  )
}

/** Row status glyph: solved ✓ / attempted ◐ / todo ○ — shape + color, never color alone. */
export function ProblemStatusIcon({ status }: { status: ProblemStatus }) {
  const name = status === 'solved' ? 'checkCircle' : status === 'attempted' ? 'circleHalf' : 'circle'
  const tone = status === 'solved' ? 'text-success' : status === 'attempted' ? 'text-warning' : 'text-ink-4'
  const label = status === 'solved' ? 'Solved' : status === 'attempted' ? 'Attempted' : 'Not started'
  return (
    <span className={cx('tip inline-flex', tone)} data-tip={label} aria-label={label}>
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
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name={icon} size={48} strokeWidth={1.2} />
      </span>
      <p className="t-h3" style={{ fontSize: 16, fontWeight: 600 }}>
        {title}
      </p>
      {hint && <p className="t-ui max-w-[380px] text-ink-2">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/** Small spinner used while "executing" runs/submissions. */
export function Spinner({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cx('inline-block animate-spin rounded-full border-2 border-current border-t-transparent', className)}
      style={{ width: size, height: size }}
      aria-hidden
    />
  )
}
