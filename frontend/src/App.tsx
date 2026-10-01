import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Icon } from './components/icons'


import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import Problems from './pages/Problems'
import Workspace from './pages/Workspace'
import Submissions from './pages/Submissions'
import Profile from './pages/Profile'
import AdminDashboard from './pages/admin/Dashboard'
import { AdminProblems, AdminSubmissions, AdminUsers } from './pages/admin/AdminPages'
import { AdminHealth, AdminSettings } from './pages/admin/AdminOps'
import AddProblem from './pages/admin/AddProblem'
import CustomLink from './components/ui/CustomLink'
import AuthGuard, { GuestGuard } from './components/AuthGuard'
import AppNavbar from './components/AppNavbar'

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
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-canvas">
      <div className="empty-state grow">
        <span className="empty-icon">
          <Icon name="search" size={48} strokeWidth={1.2} />
        </span>
        <p className="t-h2 text-ink">Page not found</p>
        <p className="t-ui max-w-[420px] text-ink-2">
          The route you followed does not exist — it may have been renamed or archived.
        </p>
        <div className="mt-3 flex gap-2.5">
          <CustomLink variant="unstyled" to="/" className="btn btn-primary">
            Back home
          </CustomLink>
          <CustomLink variant="unstyled" to="/problems" className="btn btn-secondary">
            Problem bank
          </CustomLink>
        </div>
      </div>
    </div>
  )
}

/* ---------------- route table ---------------- */

function AppRoutes() {
  return (
    <>
      <AppNavbar />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<GuestGuard><Login /></GuestGuard>} />
        <Route path="/register" element={<GuestGuard><Register /></GuestGuard>} />
        <Route path="/forgot-password" element={<GuestGuard><ForgotPassword /></GuestGuard>} />
        <Route path="/reset-password" element={<GuestGuard><ResetPassword /></GuestGuard>} />

        <Route path="/problems" element={<Problems />} />
        <Route path="/problems/:id" element={<Workspace />} />
        <Route path="/problems/:id/submissions" element={<Submissions />} />
        <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />

        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/problems" element={<AdminProblems />} />
        <Route path="/admin/problems/new" element={<AddProblem />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/submissions" element={<AdminSubmissions />} />
        <Route path="/admin/health" element={<AdminHealth />} />
        <Route path="/admin/settings" element={<AdminSettings />} />

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}



export default function App() {
  return (
    <AppRoutes />
  )
}
