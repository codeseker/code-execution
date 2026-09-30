import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth'
import { useToast } from '../../toast'
import { Icon } from '../../components/icons'
import { Avatar, Logo, ThemeToggle, cx } from '../../components/ui'
import type { IconName } from '../../components/icons'

const NAV: Array<{ to: string; label: string; icon: IconName; end?: boolean }> = [
  { to: '/admin', label: 'Dashboard', icon: 'grid', end: true },
  { to: '/admin/problems', label: 'Problems', icon: 'code' },
  { to: '/admin/problems/new', label: 'Add Problem', icon: 'plus' },
  { to: '/admin/users', label: 'Users', icon: 'users' },
  { to: '/admin/submissions', label: 'Submissions', icon: 'terminal' },
]

const FOOTER_NAV: Array<{ to: string; label: string; icon: IconName }> = [
  { to: '/admin/health', label: 'System Health', icon: 'activity' },
  { to: '/admin/settings', label: 'Settings', icon: 'settings' },
]

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation()
  const row = (item: { to: string; label: string; icon: IconName; end?: boolean }) => {
    const active = item.end ? pathname === item.to : pathname.startsWith(item.to)
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        onClick={onNavigate}
        className={cx('side-row h-9', active && 'is-active')}
        style={active ? { background: 'var(--accent-soft)', color: 'var(--accent)' } : undefined}
      >
        <Icon name={item.icon} size={17} />
        {item.label}
      </NavLink>
    )
  }

  return (
    <div className="flex h-full flex-col gap-1 p-3">
      <Link to="/" className="mb-3 flex items-center justify-between px-1" aria-label="CodeForge home">
        <Logo size={24} />
        <span className="t-code-tag text-ink-4">v2.14</span>
      </Link>
      <p className="t-overline px-2 pb-1 text-ink-3">Admin</p>
      {NAV.map(row)}
      <span className="grow" />
      <p className="t-overline px-2 pb-1 text-ink-3">Operations</p>
      {FOOTER_NAV.map(row)}
      <div className="mt-2 flex items-center gap-2.5 rounded-md border border-hair bg-wash px-3 py-2.5">
        <span className="center h-7 w-7 flex-none rounded-full bg-success-soft text-success">
          <Icon name="check" size={14} strokeWidth={2.6} />
        </span>
        <span className="min-w-0 stack">
          <span className="t-caption font-medium text-ink">All systems green</span>
          <span className="t-code-tag truncate text-ink-3">48 / 48 runners online</span>
        </span>
      </div>
    </div>
  )
}

/** Admin shell: sidebar + header + routed content. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { push } = useToast()
  const [drawer, setDrawer] = useState(false)
  const [menu, setMenu] = useState(false)
  const [query, setQuery] = useState('')

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[240px] flex-none border-r border-hair bg-sidebar lg:block">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[var(--scrim)]"
            aria-label="Close navigation"
            onClick={() => setDrawer(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[260px] bg-sidebar shadow-e3 anim-fade-up">
            <Sidebar onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 grow flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-hair bg-canvas px-4">
          <button
            type="button"
            className="icon-btn lg:hidden"
            aria-label="Open navigation"
            onClick={() => setDrawer(true)}
          >
            <Icon name="menu" size={17} />
          </button>
          <Link to="/admin" className="flex items-center gap-2.5">
            <Logo size={24} />
            <span className="hidden h-4 w-px bg-hair sm:block" aria-hidden />
            <span className="t-ui-med hidden text-ink-2 sm:block">Admin Console</span>
          </Link>

          <div className="relative mx-auto hidden w-full max-w-[440px] md:block">
            <Icon
              name="search"
              size={14}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-3"
            />
            <input
              className="input h-9 pl-8.5"
              style={{ paddingLeft: 34 }}
              placeholder="Search problems, users, or logs…"
              aria-label="Admin search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query.trim()) {
                  push({ title: `Searching for “${query}”`, description: 'Global admin search is demo-only.', tone: 'neutral' })
                }
              }}
            />
          </div>

          <span className="grow" />
          <ThemeToggle />
          <button
            type="button"
            className="icon-btn relative"
            aria-label="Notifications"
            onClick={() => push({ title: '3 new admin alerts', description: 'Runner capacity at 98% — review System Health.', tone: 'neutral' })}
          >
            <Icon name="bell" size={16} />
            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-warning" aria-hidden />
          </button>

          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-2.5 rounded px-1.5 py-1 hover:bg-wash"
              aria-haspopup="menu"
              aria-expanded={menu}
              onClick={() => setMenu((v) => !v)}
            >
              <span className="hidden text-right sm:block">
                <span className="block t-ui-med leading-4 text-ink">{user?.name ?? 'Admin'}</span>
                <span className="block t-caption leading-4 text-ink-3">{user?.title ?? 'Super Admin'}</span>
              </span>
              <Avatar initials={user?.initials ?? 'AV'} size={28} />
            </button>
            {menu && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-40 cursor-default"
                  aria-label="Close menu"
                  onClick={() => setMenu(false)}
                />
                <div className="absolute right-0 z-50 mt-2 w-[230px] popover anim-fade-up" role="menu">
                  <Link to="/profile" className="menu-item" role="menuitem" onClick={() => setMenu(false)}>
                    <Icon name="user" size={15} className="text-ink-3" />
                    User portal
                  </Link>
                  <Link to="/problems" className="menu-item" role="menuitem" onClick={() => setMenu(false)}>
                    <Icon name="file" size={15} className="text-ink-3" />
                    Problem bank
                  </Link>
                  <button
                    type="button"
                    className="menu-item"
                    role="menuitem"
                    onClick={() => {
                      logout()
                      push({ title: 'Signed out', tone: 'neutral' })
                      navigate('/')
                    }}
                  >
                    <Icon name="lock" size={15} className="text-ink-3" />
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="grow">{children}</main>
      </div>
    </div>
  )
}
