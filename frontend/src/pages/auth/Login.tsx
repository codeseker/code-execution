import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DEMO_USERS, ROLE_HOME, useAuth } from '../../auth'
import { useToast } from '../../toast'
import { AuthLayout, AuthProof, AuthShowcase, Divider } from './AuthLayout'
import { Icon } from '../../components/icons'
import { LOGIN_SHOWCASE } from '../../data'
import { CodeWindow } from '../../components/Code'
import { cx } from '../../components/ui'

function GoogleG() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.2 3.7-8.6z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-6-2.1-6.9-5.1L1.2 17C3.2 21.3 7.3 24 12 24z" />
      <path fill="#FBBC05" d="M5.1 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3L1.2 6.7C.4 8.3 0 10.1 0 12s.4 3.7 1.2 5.3l3.9-3z" />
      <path fill="#EA4335" d="M12 4.6c1.8 0 3 .8 3.7 1.4l3.3-3.2C17 1.2 14.8 0 12 0 7.3 0 2.7 3.2 1.2 7.7l3.9 3c.9-3 3.7-5.1 6.9-5.1z" />
    </svg>
  )
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { push } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [reveal, setReveal] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Enter your email and password to continue.')
      return
    }
    const result = login(email, password)
    if (!result.ok) {
      setError(result.error)
      return
    }
    push({ title: `Welcome back, ${result.user.name.split(' ')[0]}`, tone: 'success' })
    navigate(ROLE_HOME[result.user.role], { replace: true })
  }

  const fill = (which: 'user' | 'admin') => {
    const cred = DEMO_USERS.find((u) => u.role === which)!
    setEmail(cred.email)
    setPassword(cred.password)
    setError('')
  }

  const showcase = (
    <AuthShowcase
      chip="V2.4 Execution Engine"
      status="Cluster 04: Active  ·  Latency: 14ms"
      overline="Algorithmic Precision"
      headline="Practice. Submit. Get better."
      sub="Benchmark your solutions against real FAANG test suites with sub-second container sandboxes and interactive pointer visualizers."
      proof={<AuthProof />}
    >
      <CodeWindow
        title="{} Solution.ts"
        code={LOGIN_SHOWCASE.code.join('\n')}
        lang="js"
        activeLine={5}
        headerRight={
          <span className="flex items-center gap-2">
            <span className="tag tag-gray">TypeScript</span>
            <span className="pill pill-success">
              <Icon name="checkCircle" size={12} />
              Passed · 18ms
            </span>
          </span>
        }
        footer={
          <>
            <span className="t-code-tag flex items-center gap-2 text-ink-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
              {LOGIN_SHOWCASE.memory}
            </span>
            <span className="t-code-tag text-ink-2">{LOGIN_SHOWCASE.runtime}</span>
          </>
        }
      />
    </AuthShowcase>
  )

  return (
    <AuthLayout showcase={showcase}>
      <div
        className="stack gap-5"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.currentTarget.querySelector('form')?.requestSubmit()
          }
        }}
      >
        <div className="stack gap-2">
          <h1 className="t-page-title text-ink">Welcome back</h1>
          <p className="t-reading text-ink-2">
            Log in to your CodeForge account to continue your interview prep.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button type="button" className="btn btn-secondary h-9 gap-2" onClick={() => fill('user')}>
            <Icon name="github" size={16} />
            GitHub
          </button>
          <button type="button" className="btn btn-secondary h-9 gap-2" onClick={() => fill('admin')}>
            <GoogleG />
            Google
          </button>
        </div>

        <Divider label="Or continue with email" />

        <form className="stack gap-4" onSubmit={submit} noValidate>
          <div>
            <label className="field-label" htmlFor="login-email">
              Email address
            </label>
            <input
              id="login-email"
              className="input h-9"
              type="email"
              autoComplete="email"
              placeholder="name@work-email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
            />
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label className="field-label" htmlFor="login-password">
                Password
              </label>
              <Link to="/forgot-password" className="link t-caption -mt-4 mb-1.5">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="login-password"
                className="input h-9 pr-10"
                type={reveal ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
              />
              <button
                type="button"
                className="icon-btn absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2"
                aria-label={reveal ? 'Hide password' : 'Show password'}
                onClick={() => setReveal((v) => !v)}
              >
                <Icon name={reveal ? 'eyeOff' : 'eye'} size={15} />
              </button>
            </div>
          </div>

          {error && (
            <p className="pill pill-error h-auto w-full items-start gap-2 py-1.5 text-left" role="alert">
              <Icon name="alert" size={13} className="mt-0.5 flex-none" />
              {error}
            </p>
          )}

          <label className="flex cursor-pointer items-center gap-2.5 t-ui text-ink-2">
            <input
              type="checkbox"
              className="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Remember me for 30 days
          </label>

          <button type="submit" className="btn btn-primary h-9 btn-block gap-2">
            Log in to CodeForge
            <span className="kbd">⌘↵</span>
          </button>
        </form>

        {/* Demo credentials for quick role testing */}
        <div className="card bg-wash p-3.5">
          <p className="t-overline mb-2.5 flex items-center gap-1.5 text-ink-3">
            <Icon name="key" size={12} />
            Demo access — click to fill
          </p>
          <ul className="stack gap-2">
            {DEMO_USERS.map((u) => (
              <li key={u.email} className="flex items-center gap-3">
                <span className={cx('tag w-[52px] justify-center', u.role === 'admin' ? 'tag-purple' : 'tag-blue')}>
                  {u.role}
                </span>
                <span className="t-code-tag grow truncate text-ink-2">
                  {u.email} · {u.password}
                </span>
                <button type="button" className="btn btn-ghost btn-sm h-6 px-2 text-[12px]" onClick={() => fill(u.role)}>
                  Use
                </button>
              </li>
            ))}
          </ul>
        </div>

        <p className="t-ui text-center text-ink-2">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="link t-ui-med">
            Register now
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
