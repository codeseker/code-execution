import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { useTheme } from '../theme'
import { useToast } from '../toast'
import { Icon } from './icons'
import { Avatar, Logo, ThemeToggle, cx } from './ui'
import { PROBLEMS } from '../data'
import type { IconName } from './icons'

const PORTAL_NAV: Array<{ label: string; to: string }> = [
  { label: 'Problems', to: '/problems' },
  { label: 'Contests', to: '/contests' },
  { label: 'Discuss', to: '/discuss' },
  { label: 'Interview Prep', to: '/prep' },
]

const NOTIFICATIONS = [
  { title: 'Daily Challenge is live', body: '146. LRU Cache · +20 XP if you solve it today.', unread: true },
  { title: 'Weekly Contest 402 starts soon', body: 'Starts in 2d 14h — registration open.', unread: true },
  { title: 'Editorial published', body: 'New O(n) walkthrough for Two Sum.', unread: false },
]

/* ------------------------------------------------------------------ */
/* Command palette (⌘K)                                                */
/* ------------------------------------------------------------------ */

type PaletteAction = { group: string; icon: IconName; label: string; hint?: string; run: () => void }

function CommandPalette({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
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
    ]
    if (user?.role === 'admin') {
      navActions.push({ group: 'Navigate', icon: 'grid' as IconName, label: 'Admin console', run: () => navigate('/admin') })
    }
    const pageActions: PaletteAction[] = [
      { group: 'Actions', icon: 'moon' as IconName, label: 'Toggle light / dark theme', hint: '⌘⇧L', run: toggle },
      {
        group: 'Actions',
        icon: 'lock' as IconName,
        label: 'Log out',
        run: () => {
          logout()
          navigate('/')
        },
      },
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
  }, [query, navigate, user, logout, toggle])

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
      className="fixed inset-0 z-[70] flex items-start justify-center bg-[var(--scrim)] pt-[14vh] anim-fade"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-[600px] overflow-hidden rounded-xl border border-hair bg-raised shadow-e3 anim-scale-in"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="flex items-center gap-3 border-b border-hair px-4">
          <Icon name="search" size={16} className="text-ink-3" />
          <input
            ref={inputRef}
            className="h-12 w-full bg-transparent text-[15px] outline-none placeholder:text-ink-4"
            placeholder="Search problems, pages and actions…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="kbd">esc</span>
        </div>
        <div className="scroll-y max-h-[380px] p-2">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group} className="mb-1.5 last:mb-0">
              <p className="t-overline px-2 pt-2 pb-1 text-ink-3">{group}</p>
              {items.map((a) => (
                <button
                  key={group + a.label}
                  type="button"
                  className="menu-item h-8"
                  onClick={() => {
                    a.run()
                    onClose()
                  }}
                >
                  <Icon name={a.icon} size={15} className="text-ink-3" />
                  <span className="grow truncate text-left">{a.label}</span>
                  {a.hint && <span className="tag tag-gray">{a.hint}</span>}
                </button>
              ))}
            </div>
          ))}
          {actions.length === 0 && (
            <p className="t-ui px-2 py-6 text-center text-ink-3">
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
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { push } = useToast()
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

  const doLogout = () => {
    logout()
    push({ title: 'Signed out', tone: 'neutral' })
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-hair bg-canvas">
      <div className="flex h-11 items-center gap-3 px-4">
        <button
          type="button"
          className="icon-btn md:hidden"
          aria-label="Open navigation"
          onClick={() => setPanel(panel === 'mobile' ? 'none' : 'mobile')}
        >
          <Icon name="menu" size={17} />
        </button>
        <Link to="/problems" aria-label="CodeForge home">
          <Logo size={24} />
        </Link>
        <span className="hidden h-4 w-px bg-hair md:block" aria-hidden />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Portal">
          {PORTAL_NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={cx(
                'rounded px-2.5 py-1 text-[14px] transition-colors hover:bg-wash',
                active === n.label ? 'bg-wash font-medium text-ink' : 'text-ink-2',
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <span className="grow" />

        {/* Search trigger (opens ⌘K palette) */}
        <button
          type="button"
          className="input hidden h-7 w-[240px] cursor-pointer items-center gap-2 border-hair text-left text-ink-4 lg:flex"
          onClick={() => setPalette(true)}
          aria-label="Search problems (Command K)"
        >
          <Icon name="search" size={13} />
          <span className="grow text-[13px]">Search problems…</span>
          <span className="kbd">⌘K</span>
        </button>
        <button
          type="button"
          className="icon-btn lg:hidden"
          aria-label="Search (Command K)"
          onClick={() => setPalette(true)}
        >
          <Icon name="search" size={16} />
        </button>

        <ThemeToggle />

        <div className="relative">
          <button
            type="button"
            className="icon-btn relative"
            aria-label="Notifications"
            aria-expanded={panel === 'bell'}
            onClick={() => setPanel(panel === 'bell' ? 'none' : 'bell')}
          >
            <Icon name="bell" size={16} />
            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
          </button>
          {panel === 'bell' && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 cursor-default"
                aria-label="Close notifications"
                onClick={() => setPanel('none')}
              />
              <div className="absolute right-0 z-50 mt-2 w-[320px] popover anim-fade-up">
                <p className="t-overline px-2 pt-1.5 pb-1 text-ink-3">Notifications</p>
                {NOTIFICATIONS.map((n) => (
                  <div key={n.title} className="menu-item h-auto items-start gap-2.5 px-2 py-2">
                    <span
                      className={cx('mt-1.5 h-1.5 w-1.5 flex-none rounded-full', n.unread ? 'bg-accent' : 'bg-hair')}
                      aria-hidden
                    />
                    <span className="stack">
                      <span className="t-ui-med text-ink">{n.title}</span>
                      <span className="t-caption text-ink-2">{n.body}</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            className="flex items-center gap-2 rounded px-1.5 py-1 transition-colors hover:bg-wash"
            aria-haspopup="menu"
            aria-expanded={panel === 'user'}
            onClick={() => setPanel(panel === 'user' ? 'none' : 'user')}
          >
            <Avatar initials={user?.initials ?? 'ND'} size={24} />
            <span className="t-ui-med hidden text-ink sm:block">{user?.handle ?? 'Guest'}</span>
            <Icon name="chevronDown" size={13} className="text-ink-3" />
          </button>
          {panel === 'user' && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 cursor-default"
                aria-label="Close menu"
                onClick={() => setPanel('none')}
              />
              <div className="absolute right-0 z-50 mt-2 w-[240px] popover anim-fade-up" role="menu">
                <div className="border-b border-hair px-2 pt-1.5 pb-2">
                  <p className="t-ui-med truncate text-ink">{user?.name}</p>
                  <p className="t-caption truncate text-ink-2">{user?.email}</p>
                  <span className="tag tag-blue mt-1.5">{user?.role}</span>
                </div>
                <div className="pt-1">
                  <button type="button" className="menu-item" role="menuitem" onClick={() => navigate('/profile')}>
                    <Icon name="user" size={15} className="text-ink-3" />
                    Profile
                  </button>
                  {user?.role === 'admin' && (
                    <button type="button" className="menu-item" role="menuitem" onClick={() => navigate('/admin')}>
                      <Icon name="grid" size={15} className="text-ink-3" />
                      Admin console
                    </button>
                  )}
                  <button type="button" className="menu-item" role="menuitem" onClick={doLogout}>
                    <Icon name="lock" size={15} className="text-ink-3" />
                    Log out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {panel === 'mobile' && (
        <nav className="border-t border-hair px-3 py-2 md:hidden" aria-label="Mobile">
          {PORTAL_NAV.map((n) => (
            <Link key={n.to} to={n.to} className="side-row">
              {n.label}
            </Link>
          ))}
          <Link to="/profile" className="side-row">
            Profile
          </Link>
        </nav>
      )}

      {palette && <CommandPalette onClose={() => setPalette(false)} />}
    </header>
  )
}

/* ------------------------------------------------------------------ */
/* Status bars                                                         */
/* ------------------------------------------------------------------ */

/** Workspace bottom bar: engine + runtime telemetry. */
export function EngineStatusBar() {
  return (
    <div className="flex h-7 items-center justify-between border-t border-hair bg-canvas px-4 text-ink-3">
      <div className="flex items-center gap-4">
        <span className="t-code-tag">CodeForge v2.4.0</span>
        <span className="t-code-tag flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
          Engine Ready (v8-isolate)
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="t-code-tag tnum hidden sm:inline">Lat: 34ms</span>
        <span className="t-code-tag tnum hidden sm:inline">Mem: 42.1MB</span>
        <span className="t-code-tag">UTF-8</span>
      </div>
    </div>
  )
}

/** Portal bottom bar: system status + quick links. */
export function SystemStatusBar() {
  return (
    <div className="flex h-9 flex-wrap items-center justify-between gap-3 border-t border-hair bg-canvas px-4">
      <span className="t-code-tag flex items-center gap-2 text-ink-3">
        CODEFORGE SYSTEM STATUS
        <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
        ONLINE // CLUSTER-US-EAST
      </span>
      <nav className="flex gap-5 text-ink-3" aria-label="Footer">
        {['API', 'Documentation', 'Privacy', 'Terms'].map((l) => (
          <a key={l} href={`#${l.toLowerCase()}`} className="t-caption hover:text-ink-2">
            {l}
          </a>
        ))}
      </nav>
    </div>
  )
}
