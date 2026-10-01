import { useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'
import { Logo, ThemeToggle, cx } from './ui'
import CustomLink from './ui/CustomLink'

const NAV_LINKS = [
  { label: 'Problems', to: '/problems' },
  { label: 'Profile', to: '/profile' },
  { label: 'Admin', to: '/admin' },
]

export default function AppNavbar() {
  const { pathname } = useLocation()
  const isAuthenticated = useAuthStore((state) => state.auth.isAuthenticated)

  return (
    <header className="sticky top-0 z-40 h-14 flex-none border-b border-hair bg-canvas">
      <div className="mx-auto flex h-full max-w-[1280px] items-center gap-4 px-4 lg:px-8">
        <CustomLink variant="unstyled" to="/" aria-label="CodeForge home" className="flex-none">
          <Logo size={25} />
        </CustomLink>

        <nav className="flex items-center gap-1" aria-label="Main navigation">
          {NAV_LINKS.map(({ label, to }) => (
            <CustomLink
              key={to}
              variant="unstyled"
              to={to}
              className={cx(
                'rounded px-2 py-1.5 text-[13px] text-ink-2 transition-colors hover:bg-wash hover:text-ink sm:px-2.5 sm:text-sm',
                label === 'Admin' && 'hidden sm:inline-flex',
                (pathname === to || pathname.startsWith(`${to}/`)) && 'bg-wash font-medium text-ink',
              )}
            >
              {label}
            </CustomLink>
          ))}
        </nav>

        <span className="grow" />
        <ThemeToggle />
        {isAuthenticated ? (
          <CustomLink variant="unstyled" to="/profile" className="btn btn-secondary btn-sm hidden sm:inline-flex">
            My profile
          </CustomLink>
        ) : (
          <div className="flex items-center gap-2">
            <CustomLink variant="unstyled" to="/login" className="btn btn-ghost btn-sm">
              Log in
            </CustomLink>
            <CustomLink variant="unstyled" to="/register" className="btn btn-primary btn-sm hidden sm:inline-flex">
              Create account
            </CustomLink>
          </div>
        )}
      </div>
    </header>
  )
}