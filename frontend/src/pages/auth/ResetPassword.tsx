import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../../toast'
import { AuthLayout, AuthProof, AuthShowcase } from './AuthLayout'
import { Icon } from '../../components/icons'
import { RESET_SHOWCASE } from '../../data'
import { CodeWindow } from '../../components/Code'
import { StrengthMeter, passwordScore } from './Register'
import { cx } from '../../components/ui'

const CRITERIA = [
  { test: (pw: string) => pw.length >= 8, label: 'Minimum 8 characters' },
  { test: (pw: string) => /[A-Z]/.test(pw) && /\d/.test(pw), label: 'At least one uppercase letter & number' },
  { test: (pw: string) => /[^A-Za-z0-9]/.test(pw), label: 'At least one special character (!@#$%^&*)' },
]

const STRENGTH_LABEL = ['Weak', 'Weak', 'Fair', 'Good', 'Strong']

export default function ResetPassword() {
  const navigate = useNavigate()
  const { push } = useToast()
  const [token, setToken] = useState('CF-9824-TX')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [reveal, setReveal] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(45)

  // Live "Resend code (Ns)" countdown.
  useEffect(() => {
    if (cooldown <= 0) return
    const id = window.setInterval(() => setCooldown((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => window.clearInterval(id)
  }, [cooldown])

  const score = useMemo(() => passwordScore(password), [password])
  const passed = CRITERIA.map((c) => c.test(password))
  const percent = Math.round(
    (passed.filter(Boolean).length / CRITERIA.length) * 60 + (score / 4) * 40,
  )

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!token.trim()) return setError('Enter the verification code we sent to your inbox.')
    if (passed.some((ok) => !ok)) return setError('Your password does not meet the security criteria yet.')
    if (password !== confirm) return setError('Passwords do not match.')
    push({ title: 'Password updated', description: 'All sessions were rotated — sign in to continue.', tone: 'success' })
    navigate('/login', { replace: true })
  }

  const showcase = (
    <AuthShowcase
      chip="Zero-Trust Architecture"
      status="Key Derivation Active  ·  SHA-256 / ARGON2ID"
      overline="Session Integrity"
      headline="Continuous validation. Zero downtime."
      sub="Updating your password terminates all active terminal sessions and rotates sandbox authorization keys across all running execution clusters."
      proof={<AuthProof note="Trusted by 85,000+ engineers worldwide." />}
    >
      <div className="stack gap-4">
        <CodeWindow
          title="token_rotation.rs"
          lang="rust"
          code={RESET_SHOWCASE.code.join('\n')}
          activeLine={3}
          headerRight={
            <span className="flex items-center gap-2">
              <span className="tag tag-gray">Rust 1.76</span>
              <span className="pill pill-success">
                <Icon name="check" size={12} />
                Enforced
              </span>
            </span>
          }
          footer={
            <>
              <span className="t-code-tag flex items-center gap-2 text-ink-2">
                <Icon name="zap" size={12} />
                {RESET_SHOWCASE.memory}
              </span>
              <span className="t-code-tag flex items-center gap-2 text-ink-2">
                <Icon name="checkCircle" size={12} />
                {RESET_SHOWCASE.runtime}
              </span>
            </>
          }
        />
        <div className="grid grid-cols-2 gap-4">
          <div className="card px-4 py-3">
            <p className="t-overline text-ink-3">Parallel invalidation</p>
            <p className="t-h3 tnum mt-1 text-ink">4,096 nodes</p>
            <p className="t-caption text-ink-2">Synchronized across edge instances</p>
          </div>
          <div className="card px-4 py-3">
            <p className="t-overline text-ink-3">Cryptographic salt</p>
            <p className="t-h3 tnum mt-1 font-mono text-[18px] text-ink">Argon2id / 64MB</p>
            <p className="t-caption text-ink-2">OWASP memory-hard recommended</p>
          </div>
        </div>
      </div>
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
        <span className="pill pill-accent w-fit uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
          Security Gate
        </span>

        <div className="stack gap-2">
          <h1 className="t-page-title text-ink">Set new password</h1>
          <p className="t-reading text-ink-2">
            Enter your verification token and create a strong, secure password for your account.
          </p>
        </div>

        <form className="stack gap-4" onSubmit={submit} noValidate>
          <div>
            <div className="flex items-baseline justify-between">
              <label className="field-label" htmlFor="reset-token">
                Reset Token / Verification Code
              </label>
              <button
                type="button"
                className={cx('t-code-tag -mt-4 mb-1.5', cooldown > 0 ? 'text-ink-3' : 'link')}
                disabled={cooldown > 0}
                onClick={() => {
                  setCooldown(45)
                  push({ title: 'New code sent', description: 'Check your inbox for a fresh token.', tone: 'neutral' })
                }}
              >
                {cooldown > 0 ? `Resend code (${cooldown}s)` : 'Resend code'}
              </button>
            </div>
            <div className="relative">
              <Icon
                name="key"
                size={15}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-3"
              />
              <input
                id="reset-token"
                className="input h-9 font-mono pl-9 tracking-[0.06em]"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="CF-0000-TX"
              />
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="reset-password">
              New Password
            </label>
            <div className="relative">
              <input
                id="reset-password"
                className="input h-9 pr-10"
                type={reveal ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Enter new password"
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
                <span className="text-ink-3">Complexity score</span>
                <span className={cx('tnum', percent >= 70 ? 'text-success' : 'text-warning')}>
                  {STRENGTH_LABEL[score]} ({percent}%)
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="reset-confirm">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="reset-confirm"
                className="input h-9 pr-10"
                type={reveal ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Re-enter new password"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value)
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
            {confirm.length > 0 && password !== confirm && (
              <p className="t-caption mt-1.5 text-error">Passwords do not match yet.</p>
            )}
          </div>

          <div className="card bg-wash px-4 py-3.5">
            <p className="t-overline mb-2.5 text-ink-3">Security Criteria</p>
            <ul className="stack gap-2">
              {CRITERIA.map((c, i) => (
                <li key={c.label} className="flex items-center gap-2.5 t-ui">
                  <Icon
                    name={passed[i] ? 'check' : 'chevronRight'}
                    size={14}
                    className={cx('flex-none', passed[i] ? 'text-success' : 'text-ink-4')}
                  />
                  <span className={passed[i] ? 'text-ink' : 'text-ink-2'}>{c.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {error && (
            <p className="pill pill-error h-auto w-full items-start gap-2 py-1.5 text-left" role="alert">
              <Icon name="alert" size={13} className="mt-0.5 flex-none" />
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary h-9 btn-block gap-2">
            Update Password &amp; Sign In
            <span className="kbd">⌘↵</span>
          </button>
        </form>

        <Link to="/login" className="t-ui-med mx-auto inline-flex items-center gap-2 text-ink-2 hover:text-ink">
          <Icon name="arrowLeft" size={15} />
          Return to login
        </Link>
      </div>
    </AuthLayout>
  )
}
