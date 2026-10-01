import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout, AuthShowcase } from './AuthLayout'
import { Icon } from '../../components/icons'
import { StrengthMeter, passwordScore } from './Register'
import { cx } from '../../components/ui'
import CustomButton from '../../components/ui/CustomButton'
import CustomLink from '../../components/ui/CustomLink'

const CRITERIA = [
  { test: (pw: string) => pw.length >= 8, label: 'Minimum 8 characters' },
  { test: (pw: string) => /[A-Z]/.test(pw) && /\d/.test(pw), label: 'At least one uppercase letter & number' },
  { test: (pw: string) => /[^A-Za-z0-9]/.test(pw), label: 'At least one special character (!@#$%^&*)' },
]

const STRENGTH_LABEL = ['Weak', 'Weak', 'Fair', 'Good', 'Strong']

export default function ResetPassword() {
  const navigate = useNavigate()
  
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [reveal, setReveal] = useState(false)
  const [error, setError] = useState('')

  const score = useMemo(() => passwordScore(password), [password])
  const passed = CRITERIA.map((c) => c.test(password))
  const percent = Math.round(
    (passed.filter(Boolean).length / CRITERIA.length) * 60 + (score / 4) * 40,
  )

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!token.trim()) return setError('Enter the verification code we sent to your inbox.')
    if (passed.some((ok) => !ok)) return setError('Your password does not meet the security criteria yet.')
    if (password !== confirm) return setError("Passwords don't match.")
    // push({ title: 'Password updated', description: 'Sign in with your new password.', tone: 'success' })
    navigate('/login', { replace: true })
  }

  const showcase = (
    <AuthShowcase
      headline="Choose a new password."
      sub="Set a new password to access your account."
    >
      <div className="rounded-md border border-hair bg-canvas p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="t-ui-med text-ink">Password check</p>
            <p className="t-caption text-ink-2">Updates as you type</p>
          </div>
          <span className={cx('t-caption', score >= 3 ? 'text-success' : 'text-ink-2')}>
            {STRENGTH_LABEL[score]}
          </span>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <StrengthMeter value={score} />
          <ul className="flex flex-col gap-2 border-t border-hair pt-3">
            {CRITERIA.map((criterion) => {
              const isMet = criterion.test(password)
              return (
                <li key={criterion.label} className="flex items-center gap-2.5 t-ui">
                  <Icon
                    name={isMet ? 'check' : 'chevronRight'}
                    size={14}
                    className={cx('flex-none', isMet ? 'text-success' : 'text-ink-3')}
                  />
                  <span className={isMet ? 'text-ink' : 'text-ink-2'}>{criterion.label}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </AuthShowcase>
  )

  return (
    <AuthLayout showcase={showcase}>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="t-page-title text-ink">Reset password</h1>
          <p className="t-reading text-ink-2">Enter your reset code and choose a new password.</p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={submit} noValidate>
          <div className="flex flex-col gap-2">
            <label className="t-ui-med text-ink" htmlFor="reset-token">
              Reset code
            </label>
            <div className="relative">
              <Icon
                name="key"
                size={15}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-3"
              />
              <input
                id="reset-token"
                className="input h-10 font-mono pl-9"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter your reset code"
                aria-invalid={!!error && !token.trim()}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="t-ui-med text-ink" htmlFor="reset-password">
              New password
            </label>
            <div className="relative">
              <input
                id="reset-password"
                className="input h-10 pr-11"
                type={reveal ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Enter new password"
                value={password}
                aria-invalid={!!error && passed.some((ok) => !ok)}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
              />
              <CustomButton variant="unstyled"
                type="button"
                className="icon-btn absolute top-1/2 right-1.5 h-7 w-7 -translate-y-1/2"
                aria-label={reveal ? 'Hide password' : 'Show password'}
                onClick={() => setReveal((v) => !v)}
              >
                <Icon name={reveal ? 'eyeOff' : 'eye'} size={15} />
              </CustomButton>
            </div>
            <div className="mt-2 flex flex-col gap-2">
              <StrengthMeter value={score} />
              <div className="flex justify-between t-caption">
                <span className="text-ink-3">Complexity score</span>
                <span className={cx('tnum', percent >= 70 ? 'text-success' : 'text-warning')}>
                  {STRENGTH_LABEL[score]} ({percent}%)
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="t-ui-med text-ink" htmlFor="reset-confirm">
              Confirm new password
            </label>
            <div className="relative">
              <input
                id="reset-confirm"
                className="input h-10 pr-11"
                type={reveal ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Re-enter new password"
                value={confirm}
                aria-invalid={!!error && password !== confirm}
                onChange={(e) => {
                  setConfirm(e.target.value)
                  setError('')
                }}
              />
              <CustomButton variant="unstyled"
                type="button"
                className="icon-btn absolute top-1/2 right-1.5 h-7 w-7 -translate-y-1/2"
                aria-label={reveal ? 'Hide password' : 'Show password'}
                onClick={() => setReveal((v) => !v)}
              >
                <Icon name={reveal ? 'eyeOff' : 'eye'} size={15} />
              </CustomButton>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="t-ui-med text-ink">Password requirements</p>
            <ul className="flex flex-col gap-2">
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
            <p className="pill pill-error h-auto w-full items-start gap-2 py-2 text-left" role="alert">
              <Icon name="alert" size={14} className="mt-0.5 flex-none" />
              {error}
            </p>
          )}

          <CustomButton variant="unstyled" type="submit" className="btn btn-primary btn-block h-10">
            Update password
          </CustomButton>
        </form>

        <p className="t-ui text-center text-ink-2">
          Remembered your password?{' '}
          <CustomLink to="/login" className="link t-ui-med">Back to log in</CustomLink>
        </p>
      </div>
    </AuthLayout>
  )
}
