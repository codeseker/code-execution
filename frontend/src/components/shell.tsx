import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../theme'
import { Icon } from './icons'
import { Avatar, Logo, ThemeToggle, cx } from './ui'
import { PROBLEMS } from '../data'
import type { IconName } from './icons'
import CustomButton from './CustomButton'
import CustomLink from './CustomLink'
import { Separator } from './ui/separator'

const PORTAL_NAV: Array<{ label: string; to: string }> = [
  { label: 'Problems', to: '/problems' },
]

const NOTIFICATIONS = [
  { title: 'Daily Challenge is live', body: '146. LRU Cache · +20 XP if you solve it today.', unread: true },
  { title: 'Editorial published', body: 'New O(n) walkthrough for Two Sum.', unread: false },
]

/* ------------------------------------------------------------------ */
/* Command palette (⌘K)                                                */
/* ------------------------------------------------------------------ */

type PaletteAction = { group: string; icon: IconName; label: string; hint?: string; run: () => void }

function CommandPalette({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const { toggle } = useTheme()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const actions = useMemo<PaletteAction[]>(() => {
    const q = query.trim().toLowerCase()
    const navActions: PaletteAction[] = [
      ...PORTAL_NAV.map((n) => ({
        group: 'Navigate',
        icon: 'arrowRight' as IconName,
        label: n.label,
        run: () => navigate(n.to),
      })),
      { group: 'Navigate', icon: 'user' as IconName, label: 'Profile', run: () => navigate('/profile') },
      { group: 'Navigate', icon: 'grid' as IconName, label: 'Admin console', run: () => navigate('/admin') },
      { group: 'Navigate', icon: 'user' as IconName, label: 'Log in', run: () => navigate('/login') },
    ]
    const pageActions: PaletteAction[] = [
      { group: 'Actions', icon: 'moon' as IconName, label: 'Toggle light / dark theme', hint: '⌘⇧L', run: toggle },
    ]
    const problemActions: PaletteAction[] = PROBLEMS.filter(
      (p) =>
        !q ||
        p.title.toLowerCase().includes(q) ||
        String(p.num).includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)),
    )
      .slice(0, 7)
      .map((p) => ({
        group: 'Problems',
        icon: 'file' as IconName,
        label: `${p.num}. ${p.title}`,
        hint: p.difficulty,
        run: () => navigate(`/problems/${p.id}`),
      }))

    return [...problemActions, ...navActions, ...pageActions].filter(
      (a) => !q || a.label.toLowerCase().includes(q.toLowerCase()) || a.group === 'Problems',
    )
  }, [query, navigate, toggle])

  // Close on Escape; Enter runs the first hit.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter' && document.activeElement === inputRef.current) {
        e.preventDefault()
        const first = actions[0]
        if (first) {
          first.run()
          onClose()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [actions, onClose])

  const groups = actions.reduce<Record<string, PaletteAction[]>>((acc, a) => {
    ;(acc[a.group] ??= []).push(a)
    return acc
  }, {})

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-background/80 pt-[14vh]"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-[600px] overflow-hidden rounded-xl border border-border bg-popover shadow-e3 anim-scale-in"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Icon name="search" size={16} className="text-muted-foreground" />
          <input
            ref={inputRef}
            className="h-12 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
            placeholder="Search problems, pages and actions…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="kbd">esc</span>
        </div>
        <div className="scroll-y max-h-[380px] p-2">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group} className="mb-1.5 last:mb-0">
              <p className="text-sm font-semibold px-2 pt-2 pb-1 text-muted-foreground">{group}</p>
              {items.map((a) => (
                <CustomButton variant="unstyled"
                  key={group + a.label}
                  type="button"
                  className="menu-item h-8"
                  onClick={() => {
                    a.run()
                    onClose()
                  }}
                >
                  <Icon name={a.icon} size={15} className="text-muted-foreground" />
                  <span className="grow truncate text-left">{a.label}</span>
                  {a.hint && <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">{a.hint}</span>}
                </CustomButton>
              ))}
            </div>
          ))}
          {actions.length === 0 && (
            <p className="text-sm px-2 py-6 text-center text-muted-foreground">
              No matches for “{query}”
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Topbar                                                              */
/* ------------------------------------------------------------------ */

export function PortalTopbar({ active }: { active?: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [palette, setPalette] = useState(false)
  const [panel, setPanel] = useState<'none' | 'bell' | 'user' | 'mobile'>('none')

  // ⌘K opens the palette anywhere in the portal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPalette((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Close popovers on navigation.
  useEffect(() => {
    setPanel('none')
  }, [location.pathname])

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="flex h-11 items-center gap-3 px-4">
        <CustomButton variant="unstyled"
          type="button"
          className="icon-btn md:hidden"
          aria-label="Open navigation"
          onClick={() => setPanel(panel === 'mobile' ? 'none' : 'mobile')}
        >
          <Icon name="menu" size={17} />
        </CustomButton>
        <CustomLink variant="unstyled" to="/problems" aria-label="CodeForge home">
          <Logo size={24} />
        </CustomLink>
        <span className="hidden h-4 w-px bg-hair md:block" aria-hidden />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Portal">
          {PORTAL_NAV.map((n) => (
            <CustomLink variant="unstyled"
              key={n.to}
              to={n.to}
              className={cx(
                'rounded px-2.5 py-1 text-[14px] transition-colors hover:bg-muted/40',
                active === n.label ? 'bg-muted/40 font-medium text-foreground' : 'text-muted-foreground',
              )}
            >
              {n.label}
            </CustomLink>
          ))}
        </nav>

        <span className="grow" />

        {/* Search trigger (opens ⌘K palette) */}
        <CustomButton variant="unstyled"
          type="button"
          className="input hidden h-7 w-[240px] cursor-pointer items-center gap-2 border-border text-left text-muted-foreground lg:flex"
          onClick={() => setPalette(true)}
          aria-label="Search problems (Command K)"
        >
          <Icon name="search" size={13} />
          <span className="grow text-[13px]">Search problems…</span>
          <span className="kbd">⌘K</span>
        </CustomButton>
        <CustomButton variant="unstyled"
          type="button"
          className="icon-btn lg:hidden"
          aria-label="Search (Command K)"
          onClick={() => setPalette(true)}
        >
          <Icon name="search" size={16} />
        </CustomButton>

        <ThemeToggle />

        <div className="relative">
          <CustomButton variant="unstyled"
            type="button"
            className="icon-btn relative"
            aria-label="Notifications"
            aria-expanded={panel === 'bell'}
            onClick={() => setPanel(panel === 'bell' ? 'none' : 'bell')}
          >
            <Icon name="bell" size={16} />
            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
          </CustomButton>
          {panel === 'bell' && (
            <>
              <CustomButton variant="unstyled"
                type="button"
                className="fixed inset-0 z-40 cursor-default"
                aria-label="Close notifications"
                onClick={() => setPanel('none')}
              />
              <div className="absolute right-0 z-50 mt-2 w-[320px] popover anim-fade-up">
                <p className="text-sm font-semibold px-2 pt-1.5 pb-1 text-muted-foreground">Notifications</p>
                {NOTIFICATIONS.map((n) => (
                  <div key={n.title} className="menu-item h-auto items-start gap-2.5 px-2 py-2">
                    <span
                      className={cx('mt-1.5 h-1.5 w-1.5 flex-none rounded-full', n.unread ? 'bg-primary' : 'bg-hair')}
                      aria-hidden
                    />
                    <span className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{n.title}</span>
                      <span className="text-xs text-muted-foreground">{n.body}</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <CustomButton variant="unstyled"
            type="button"
            className="flex items-center gap-2 rounded px-1.5 py-1 transition-colors hover:bg-muted/40"
            aria-haspopup="menu"
            aria-expanded={panel === 'user'}
            onClick={() => setPanel(panel === 'user' ? 'none' : 'user')}
          >
            <Avatar initials="GU" size={24} />
            <span className="text-sm font-medium hidden text-foreground sm:block">Guest</span>
            <Icon name="chevronDown" size={13} className="text-muted-foreground" />
          </CustomButton>
          {panel === 'user' && (
            <>
              <CustomButton variant="unstyled"
                type="button"
                className="fixed inset-0 z-40 cursor-default"
                aria-label="Close menu"
                onClick={() => setPanel('none')}
              />
              <div className="absolute right-0 z-50 mt-2 w-[240px] popover anim-fade-up" role="menu">
                <div className="border-b border-border px-2 pt-1.5 pb-2">
                  <p className="text-sm font-medium truncate text-foreground">Guest</p>
                  <p className="text-xs truncate text-muted-foreground">Public access</p>
                </div>
                <div className="pt-1">
                  <CustomButton variant="unstyled" type="button" className="menu-item" role="menuitem" onClick={() => navigate('/profile')}>
                    <Icon name="user" size={15} className="text-muted-foreground" />
                    Profile
                  </CustomButton>
                  <CustomButton variant="unstyled" type="button" className="menu-item" role="menuitem" onClick={() => navigate('/admin')}>
                    <Icon name="grid" size={15} className="text-muted-foreground" />
                    Admin console
                  </CustomButton>
                  <CustomLink variant="unstyled" to="/login" className="menu-item" role="menuitem" onClick={() => setPanel('none')}>
                    <Icon name="user" size={15} className="text-muted-foreground" />
                    Log in
                  </CustomLink>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {panel === 'mobile' && (
        <nav className="border-t border-border px-3 py-2 md:hidden" aria-label="Mobile">
          {PORTAL_NAV.map((n) => (
            <CustomLink variant="unstyled" key={n.to} to={n.to} className="side-row">
              {n.label}
            </CustomLink>
          ))}
          <CustomLink variant="unstyled" to="/profile" className="side-row">
            Profile
          </CustomLink>
        </nav>
      )}

      {palette && <CommandPalette onClose={() => setPalette(false)} />}
    </header>
  )
}

/* ------------------------------------------------------------------ */
/* Status bars                                                         */
/* ------------------------------------------------------------------ */

/** Workspace bottom bar: editor state without fabricated runner telemetry. */
export function EngineStatusBar({
  cursorPosition = { lineNumber: 1, column: 1 },
  tabSize = 4,
}: {
  cursorPosition?: { lineNumber: number; column: number }
  tabSize?: number
}) {
  const version = import.meta.env.VITE_APP_VERSION
  return (
    <footer className="flex h-8 flex-none items-center justify-between gap-3 border-t border-border bg-card px-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-3">
        <span>{version ? `CodeForge v${version}` : 'CodeForge'}</span>
        <Separator orientation="vertical" className="h-4" />
        <span>Editor ready</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden tabular-nums sm:inline">Ln {cursorPosition.lineNumber}, Col {cursorPosition.column}</span>
        <Separator orientation="vertical" className="hidden h-4 sm:block" />
        <span className="hidden sm:inline">Spaces: {tabSize}</span>
        <Separator orientation="vertical" className="h-4" />
        <span>UTF-8</span>
      </div>
    </footer>
  )
}

/** Portal bottom bar: system status + quick links. */
export function SystemStatusBar() {
  return (
    <div className="flex h-9 flex-wrap items-center justify-between gap-3 border-t border-border bg-background px-4">
      <span className="font-mono text-xs flex items-center gap-2 text-muted-foreground">
        CODEFORGE SYSTEM STATUS
        <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
        ONLINE // CLUSTER-US-EAST
      </span>
      <nav className="flex gap-5 text-muted-foreground" aria-label="Footer">
        {['API', 'Documentation', 'Privacy', 'Terms'].map((l) => (
          <a key={l} href={`#${l.toLowerCase()}`} className="text-xs hover:text-muted-foreground">
            {l}
          </a>
        ))}
      </nav>
    </div>
  )
}
