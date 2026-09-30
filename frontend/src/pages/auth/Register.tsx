import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth'
import { useToast } from '../../toast'
import { AuthLayout, AuthProof, AuthShowcase, Divider } from './AuthLayout'
import { Icon } from '../../components/icons'
import { REGISTER_SHOWCASE } from '../../data'
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

/** 0–4 strength score from length + character classes. */
export function passwordScore(pw: string): number {
  let s = 0
  if (pw.length >= 8) s++
  if (pw.length >= 12) s++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw) && /\d/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return pw ? s : 0
}

const STRENGTH_LABEL = ['Weak', 'Weak', 'Fair', 'Good', 'Strong']

/** Segmented complexity meter (design.md uses segments, not a solid bar). */
export function StrengthMeter({ value }: { value: number }) {
  const tone = value >= 4 ? 'bg-success' : value >= 3 ? 'bg-accent' : value >= 2 ? 'bg-warning' : 'bg-error'
  return (
    <div className="flex gap-1.5" aria-hidden>
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={cx('h-1 grow rounded-full transition-colors', i <= value ? tone : 'bg-active')}
        />
      ))}
    </div>
  )
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const { push } = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [reveal, setReveal] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')

  const score = useMemo(() => passwordScore(password), [password])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError('Tell us your name so we can personalize the workspace.')
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid work or student email address.')
    if (password.length < 8) return setError('Password must be at least 8 characters long.')
    if (!agreed) return setError('Please agree to the Terms of Service and Privacy Policy.')
    register(name, email)
    push({ title: 'Account created', description: 'Welcome to CodeForge — your workspace is ready.', tone: 'success' })
    navigate('/problems', { replace: true })
  }

  const showcase = (
    <AuthShowcase
      chip="V2.4 Execution Engine"
      status="Cluster 04: Active  |  Latency: 12ms"
      overline="Accelerated Preparation"
      headline="Built for engineers who take practice seriously."
      sub="Real-time execution in isolated Linux microVMs. Zero mocking, zero fluff, instant feedback."
      proof={<AuthProof note="10,000+ engineers at Google, Meta, Stripe & Netflix." />}
    >
      <CodeWindow
        title="{} LRUCache.py"
        code={REGISTER_SHOWCASE.code.join('\n')}
        lang="python"
        activeLine={8}
        headerRight={
          <span className="flex items-center gap-2">
            <span className="tag tag-gray">
              Python <span className="t-code-tag opacity-70">3.11</span>
            </span>
            <span className="pill pill-success">
              <Icon name="check" size={12} />
              All Tests Passed · 14ms
            </span>
          </span>
        }
        footer={
          <>
            <span className="t-code-tag flex items-center gap-2 text-ink-2">
              <Icon name="cpu" size={13} />
              {REGISTER_SHOWCASE.memory}
            </span>
            <span className="t-code-tag flex items-center gap-2 text-ink-2">
              <Icon name="gauge" size={13} />
              {REGISTER_SHOWCASE.runtime}
            </span>
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
          <h1 className="t-page-title text-ink">Create your account</h1>
          <p className="t-reading text-ink-2">Join 10,000+ engineers mastering algorithmic interviews.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="btn btn-secondary h-9 gap-2"
            onClick={() => push({ title: 'Social sign-up is disabled in this demo', tone: 'neutral' })}
          >
            <Icon name="github" size={16} />
            GitHub
          </button>
          <button
            type="button"
            className="btn btn-secondary h-9 gap-2"
            onClick={() => push({ title: 'Social sign-up is disabled in this demo', tone: 'neutral' })}
          >
            <GoogleG />
            Google
          </button>
        </div>

        <Divider label="Or continue with email" />

        <form className="stack gap-4" onSubmit={submit} noValidate>
          <div>
            <label className="field-label" htmlFor="reg-name">
              Full Name
            </label>
            <input
              id="reg-name"
              className="input h-9"
              placeholder="e.g. Alex Rivera"
              autoComplete="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError('')
              }}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="reg-email">
              Work or Student Email
            </label>
            <input
              id="reg-email"
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
              <label className="field-label" htmlFor="reg-password">
                Password
              </label>
              <span className="t-code-tag -mt-4 mb-1.5 text-ink-3">Min. 8 characters</span>
            </div>
            <div className="relative">
              <input
                id="reg-password"
                className="input h-9 pr-10"
                type={reveal ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Create a strong password"
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
            <div className="mt-2.5 stack gap-1.5">
              <StrengthMeter value={score} />
              <div className="flex justify-between t-caption">
                <span className="text-ink-3">Entropy: {score >= 4 ? 'High' : score >= 3 ? 'Medium' : 'Low'}</span>
                <span className={cx('flex items-center gap-1.5', score >= 3 ? 'text-success' : 'text-warning')}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                  {STRENGTH_LABEL[score]}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <p className="pill pill-error h-auto w-full items-start gap-2 py-1.5 text-left" role="alert">
              <Icon name="alert" size={13} className="mt-0.5 flex-none" />
              {error}
            </p>
          )}

          <label className="flex cursor-pointer items-start gap-2.5 t-ui text-ink-2">
            <input
              type="checkbox"
              className="checkbox mt-0.5"
              checked={agreed}
              onChange={(e) => {
                setAgreed(e.target.checked)
                setError('')
              }}
            />
            <span>
              I agree to the{' '}
              <a href="#terms" className="link underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#privacy" className="link underline">
                Privacy Policy
              </a>
              .
            </span>
          </label>

          <button type="submit" className="btn btn-primary h-9 btn-block gap-2">
            Create CodeForge Account
            <span className="kbd">⌘↵</span>
          </button>
        </form>

        <p className="t-ui text-center text-ink-2">
          Already have an account?{' '}
          <Link to="/login" className="link t-ui-med">
            Log in
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
