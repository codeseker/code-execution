import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type Role = 'user' | 'admin'

export type SessionUser = {
  email: string
  role: Role
  name: string
  handle: string
  title: string
  initials: string
}

type StoredSession = SessionUser & { password: string }

/** Pre-configured demo credentials (surfaced on the login screen). */
export const DEMO_USERS: StoredSession[] = [
    {
      email: 'user@demo.com',
      password: 'Password123!',
      role: 'user',
      name: 'Alex Rivera',
      handle: '@alex_dev',
      title: 'Senior Systems Engineer',
      initials: 'AR',
    },
    {
      email: 'admin@demo.com',
      password: 'Password123!',
      role: 'admin',
      name: 'Alex Vance',
      handle: '@avance',
    title: 'Super Admin',
    initials: 'AV',
  },
]

/** Home route per role — drives the post-login redirect and RBAC guards. */
export const ROLE_HOME: Record<Role, string> = {
  user: '/problems',
  admin: '/admin',
}

type LoginResult = { ok: true; user: SessionUser } | { ok: false; error: string }

type AuthContextValue = {
  user: SessionUser | null
  login: (email: string, password: string) => LoginResult
  register: (name: string, email: string) => SessionUser
  logout: () => void
}

const STORAGE_KEY = 'cf.session'
const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SessionUser
    if (parsed && (parsed.role === 'user' || parsed.role === 'admin')) return parsed
  } catch {
    /* corrupted storage — treat as logged out */
  }
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(readStoredSession)

  const login = useCallback((email: string, password: string): LoginResult => {
    const match = DEMO_USERS.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
    )
    if (!match || match.password !== password) {
      return { ok: false, error: 'Invalid email or password. Try the demo credentials below.' }
    }
    const session: SessionUser = {
      email: match.email,
      role: match.role,
      name: match.name,
      handle: match.handle,
      title: match.title,
      initials: match.initials,
    }
    setUser(session)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } catch {
      /* ignore */
    }
    return { ok: true, user: session }
  }, [])

  const register = useCallback((name: string, email: string): SessionUser => {
    const handleName = email.split('@')[0] || 'engineer'
    const initials = name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'ND'
    const session: SessionUser = {
      email,
      role: 'user',
      name: name.trim() || 'New Engineer',
      handle: `@${handleName}`,
      title: 'Member',
      initials,
    }
    setUser(session)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } catch {
      /* ignore */
    }
    return session
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo(
    () => ({ user, login, register, logout }),
    [user, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
