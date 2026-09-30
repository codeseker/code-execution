import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ROLE_HOME, useAuth } from './auth'
import { AuthProvider } from './auth'
import { ThemeProvider } from './theme'
import { ToastProvider } from './toast'
import { Icon } from './components/icons'
import { Logo } from './components/ui'
import { Link } from 'react-router-dom'

import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import Problems from './pages/Problems'
import Workspace from './pages/Workspace'
import Submissions from './pages/Submissions'
import Profile from './pages/Profile'
import { Contests, Discuss, InterviewPrep } from './pages/PortalPages'
import AdminDashboard from './pages/admin/Dashboard'
import { AdminProblems, AdminSubmissions, AdminUsers } from './pages/admin/AdminPages'
import { AdminHealth, AdminSettings } from './pages/admin/AdminOps'
import AddProblem from './pages/admin/AddProblem'

/* ---------------- guards ---------------- */

/** Requires a session; `adminOnly` further restricts to the admin role. */
function RequireAuth({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/problems" replace />
  return <>{children}</>
}

/** Keeps signed-in visitors away from the auth screens. */
function GuestOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (user) return <Navigate to={ROLE_HOME[user.role]} replace />
  return <>{children}</>
}

/* ---------------- extras ---------------- */

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="flex h-11 items-center border-b border-hair px-4">
        <Link to="/" aria-label="CodeForge home">
          <Logo size={24} />
        </Link>
      </header>
      <div className="empty-state grow">
        <span className="empty-icon">
          <Icon name="search" size={48} strokeWidth={1.2} />
        </span>
        <p className="t-h2 text-ink">Page not found</p>
        <p className="t-ui max-w-[420px] text-ink-2">
          The route you followed does not exist — it may have been renamed or archived.
        </p>
        <div className="mt-3 flex gap-2.5">
          <Link to="/" className="btn btn-primary">
            Back home
          </Link>
          <Link to="/problems" className="btn btn-secondary">
            Problem bank
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ---------------- route table ---------------- */

function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
        <Route path="/forgot-password" element={<GuestOnly><ForgotPassword /></GuestOnly>} />
        <Route path="/reset-password" element={<GuestOnly><ResetPassword /></GuestOnly>} />

        {/* User portal (both roles may browse) */}
        <Route path="/problems" element={<RequireAuth><Problems /></RequireAuth>} />
        <Route path="/problems/:id" element={<RequireAuth><Workspace /></RequireAuth>} />
        <Route path="/problems/:id/submissions" element={<RequireAuth><Submissions /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/contests" element={<RequireAuth><Contests /></RequireAuth>} />
        <Route path="/discuss" element={<RequireAuth><Discuss /></RequireAuth>} />
        <Route path="/prep" element={<RequireAuth><InterviewPrep /></RequireAuth>} />

        {/* Admin portal */}
        <Route path="/admin" element={<RequireAuth adminOnly><AdminDashboard /></RequireAuth>} />
        <Route path="/admin/problems" element={<RequireAuth adminOnly><AdminProblems /></RequireAuth>} />
        <Route path="/admin/problems/new" element={<RequireAuth adminOnly><AddProblem /></RequireAuth>} />
        <Route path="/admin/users" element={<RequireAuth adminOnly><AdminUsers /></RequireAuth>} />
        <Route path="/admin/submissions" element={<RequireAuth adminOnly><AdminSubmissions /></RequireAuth>} />
        <Route path="/admin/health" element={<RequireAuth adminOnly><AdminHealth /></RequireAuth>} />
        <Route path="/admin/settings" element={<RequireAuth adminOnly><AdminSettings /></RequireAuth>} />

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
