import { useState } from 'react'
import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Icon } from '../../components/icons'
import { Avatar, Logo, ThemeToggle, cx } from '../../components/ui'
import type { IconName } from '../../components/icons'
import CustomButton from '../../components/CustomButton'
import CustomLink from '../../components/CustomLink'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'

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
        className={cx(
          'flex h-9 items-center gap-2 rounded-md px-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground',
        )}
      >
        <Icon name={item.icon} size={17} />
        {item.label}
      </NavLink>
    )
  }

  return (
    <div className="flex h-full flex-col gap-1 p-3">
      <CustomLink variant="unstyled" to="/" className="mb-3 flex items-center justify-between px-1" aria-label="CodeForge home">
        <Logo size={24} />
        <span className="font-mono text-xs text-muted-foreground">v2.14</span>
      </CustomLink>
      <p className="text-sm font-semibold px-2 pb-1 text-muted-foreground">Admin</p>
      {NAV.map(row)}
      <span className="grow" />
      <p className="text-sm font-semibold px-2 pb-1 text-muted-foreground">Operations</p>
      {FOOTER_NAV.map(row)}
      <div className="mt-2 flex items-center gap-2.5 rounded-md border border-border bg-muted/40 px-3 py-2.5">
        <span className="center h-7 w-7 flex-none rounded-full bg-primary/10 text-primary">
          <Icon name="check" size={14} strokeWidth={2.6} />
        </span>
        <span className="min-w-0 flex flex-col">
          <span className="text-xs font-medium text-foreground">All systems green</span>
          <span className="font-mono text-xs truncate text-muted-foreground">48 / 48 runners online</span>
        </span>
      </div>
    </div>
  )
}

/** Admin shell: sidebar + header + routed content. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const [drawer, setDrawer] = useState(false)
  const [menu, setMenu] = useState(false)
  const [query, setQuery] = useState('')

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-[240px] flex-none border-r border-border bg-sidebar lg:block">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <CustomButton variant="unstyled"
            type="button"
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
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
        <header className="sticky top-14 z-30 flex h-14 items-center gap-3 border-b border-border bg-background px-4">
          <CustomButton variant="unstyled"
            type="button"
            className="icon-btn lg:hidden"
            aria-label="Open navigation"
            onClick={() => setDrawer(true)}
          >
            <Icon name="menu" size={17} />
          </CustomButton>
          <CustomLink to="/admin" className="flex items-center gap-2.5">
            <Logo size={24} />
            <span className="hidden h-4 w-px bg-hair sm:block" aria-hidden />
            <span className="text-sm font-medium hidden text-muted-foreground sm:block">Admin Console</span>
          </CustomLink>

          <div className="relative mx-auto hidden w-full max-w-[440px] md:block">
            <Icon
              name="search"
              size={14}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              className="h-9 pl-9"
              placeholder="Search problems, users, or logs…"
              aria-label="Admin search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query.trim()) {
                  // push({ title: `Searching for “${query}”`, description: 'Global admin search is demo-only.', tone: 'neutral' })
                }
              }}
            />
          </div>

          <span className="grow" />
          <ThemeToggle />
          <Button variant="ghost" size="icon"
            type="button"
            className="relative"
            aria-label="Notifications"
            // onClick={() => push({ title: '3 new admin alerts', description: 'Runner capacity at 98% — review System Health.', tone: 'neutral' })}
          >
            <Icon name="bell" size={16} />
            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-muted" aria-hidden />
          </Button>

          <div className="relative">
            <Button variant="ghost"
              type="button"
              className="h-auto gap-2.5 rounded px-1.5 py-1"
              aria-haspopup="menu"
              aria-expanded={menu}
              onClick={() => setMenu((v) => !v)}
            >
              <span className="hidden text-right sm:block">
                <span className="block text-sm font-medium leading-4 text-foreground">Admin</span>
                <span className="block text-xs leading-4 text-muted-foreground">Public access</span>
              </span>
              <Avatar initials="AD" size={28} />
            </Button>
            {menu && (
              <>
                <CustomButton variant="unstyled"
                  type="button"
                  className="fixed inset-0 z-40 cursor-default"
                  aria-label="Close menu"
                  onClick={() => setMenu(false)}
                />
                <div className="absolute right-0 z-50 mt-2 w-[230px] popover anim-fade-up" role="menu">
                  <CustomLink variant="unstyled" to="/profile" className="menu-item" role="menuitem" onClick={() => setMenu(false)}>
                    <Icon name="user" size={15} className="text-muted-foreground" />
                    User portal
                  </CustomLink>
                  <CustomLink variant="unstyled" to="/problems" className="menu-item" role="menuitem" onClick={() => setMenu(false)}>
                    <Icon name="file" size={15} className="text-muted-foreground" />
                    Problem bank
                  </CustomLink>
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
