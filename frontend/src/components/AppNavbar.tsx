import { ChevronDown, Code2, LogOut, Menu, ShieldCheck, User } from 'lucide-react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useAuthStore } from '@/stores/auth'
import useLogout from '@/hooks/auth/logout/useLogout'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [{ label: 'Problems', to: '/problems' }]

function initialsFromName(name: string | null) {
  const parts = (name ?? '').split(/[\s._-]+/).filter(Boolean)
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'U'
}

export default function AppNavbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.auth.isAuthenticated)
  const username = useAuthStore((state) => state.auth.username)
  const role = useAuthStore((state) => state.auth.role)
  // Revokes the access token server-side before the local session is dropped.
  const { logout, loading: loggingOut } = useLogout()

  const isAdmin = role === 'ADMIN'

  const handleLogout = () => {
    void logout().finally(() => navigate('/'))
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-navbar w-full max-w-6xl items-center justify-center px-4 sm:px-6">
          <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-full border border-border bg-background/80 px-2 py-2 shadow-sm">
          <div className="flex items-center justify-self-start pl-2">
            <Link to="/" className="inline-flex items-center gap-2 rounded-full px-2 py-1.5 transition-colors hover:bg-primary/10" aria-label="CodeForge home">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Code2 className="h-4 w-4" />
              </span>
              <span className="text-base font-semibold tracking-tight text-foreground">CodeForge</span>
            </Link>
          </div>

          <nav className="hidden items-center justify-center gap-1 md:flex" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => {
              const active = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  aria-current={active ? 'page' : undefined}
                  className={({ isActive }) =>
                    cn(
                      'rounded-full px-3 py-2 text-sm font-medium transition-colors',
                      isActive || active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              )
            })}
          </nav>

          <div className="flex items-center justify-self-end gap-2 pr-2">
            <ThemeToggle />

            {isAuthenticated ? (
              <>
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" className="rounded-full px-2 py-1.5 hover:bg-primary/10">
                        <Avatar className="mr-2 h-7 w-7">
                          <AvatarFallback>{initialsFromName(username)}</AvatarFallback>
                        </Avatar>
                        <span className="max-w-28 truncate text-sm font-medium">{username ?? 'Account'}</span>
                        <ChevronDown className="ml-1 h-4 w-4 text-muted-foreground" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>
                          <div className="flex flex-col">
                            <span className="truncate">{username ?? 'Account'}</span>
                            <span className="text-xs text-muted-foreground">{isAdmin ? 'Administrator' : 'Member'}</span>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuItem render={<Link to="/profile" />}>
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </DropdownMenuItem>
                        {isAdmin && (
                        <DropdownMenuItem render={<Link to="/admin" />}>
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Admin dashboard
                        </DropdownMenuItem>
                        )}
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem disabled={loggingOut} onClick={handleLogout} className="text-destructive focus:text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="md:hidden">
                  <Sheet>
                    <SheetTrigger >
                      <Button variant="outline" size="icon" aria-label="Open menu" className="rounded-full">
                        <Menu className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-11/12 sm:max-w-sm">
                      <div className="mt-4 space-y-4">
                        {NAV_ITEMS.map((item) => (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            className={cn('block rounded-md px-3 py-2 text-sm font-medium', location.pathname.startsWith(item.to) ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-primary/10')}
                          >
                            {item.label}
                          </NavLink>
                        ))}
                        <div className="border-t pt-4">
                          <Link to="/profile" className="block rounded-md px-3 py-2 text-sm text-foreground hover:bg-primary/10">Profile</Link>
                          {isAdmin && <Link to="/admin" className="block rounded-md px-3 py-2 text-sm text-foreground hover:bg-primary/10">Admin dashboard</Link>}
                          <button type="button" disabled={loggingOut} onClick={handleLogout} className="mt-2 block w-full rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10 disabled:opacity-60">Log out</button>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" render={<Link to="/login" />}>Log in</Button>
                <Button className="hidden sm:inline-flex" render={<Link to="/register" />}>Create account</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
