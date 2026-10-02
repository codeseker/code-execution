import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout, AuthShowcase } from './AuthLayout'
import { Icon } from '../../components/icons'
import { StrengthMeter, passwordScore } from './Register'
import { cx } from '../../components/ui'
import CustomLink from '../../components/CustomLink'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'

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
      <div className="rounded-md border border-border bg-background p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">Password check</p>
            <p className="text-xs text-muted-foreground">Updates as you type</p>
          </div>
          <span className={cx('text-xs', score >= 3 ? 'text-primary' : 'text-muted-foreground')}>
            {STRENGTH_LABEL[score]}
          </span>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <StrengthMeter value={score} />
          <ul className="flex flex-col gap-2 border-t border-border pt-3">
            {CRITERIA.map((criterion) => {
              const isMet = criterion.test(password)
              return (
                <li key={criterion.label} className="flex items-center gap-2.5 text-sm">
                  <Icon
                    name={isMet ? 'check' : 'chevronRight'}
                    size={14}
                    className={cx('flex-none', isMet ? 'text-primary' : 'text-muted-foreground')}
                  />
                  <span className={isMet ? 'text-foreground' : 'text-muted-foreground'}>{criterion.label}</span>
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
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reset password</h1>
          <p className="text-sm leading-7 text-muted-foreground">Enter your reset code and choose a new password.</p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={submit} noValidate>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground" htmlFor="reset-token">
              Reset code
            </label>
            <div className="relative">
              <Icon
                name="key"
                size={15}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="reset-token"
                className="h-10 pl-9 font-mono"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter your reset code"
                aria-invalid={!!error && !token.trim()}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground" htmlFor="reset-password">
              New password
            </label>
            <div className="relative">
              <Input
                id="reset-password"
                className="h-10 pr-11"
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
              <Button
                variant="ghost"
                size="icon"
                type="button"
                className="absolute top-1/2 right-1.5 h-7 w-7 -translate-y-1/2"
                aria-label={reveal ? 'Hide password' : 'Show password'}
                onClick={() => setReveal((v) => !v)}
              >
                <Icon name={reveal ? 'eyeOff' : 'eye'} size={15} />
              </Button>
            </div>
            <div className="mt-2 flex flex-col gap-2">
              <StrengthMeter value={score} />
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Complexity score</span>
                <span className={cx('tabular-nums', percent >= 70 ? 'text-primary' : 'text-muted-foreground')}>
                  {STRENGTH_LABEL[score]} ({percent}%)
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground" htmlFor="reset-confirm">
              Confirm new password
            </label>
            <div className="relative">
              <Input
                id="reset-confirm"
                className="h-10 pr-11"
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
              <Button
                variant="ghost"
                size="icon"
                type="button"
                className="absolute top-1/2 right-1.5 h-7 w-7 -translate-y-1/2"
                aria-label={reveal ? 'Hide password' : 'Show password'}
                onClick={() => setReveal((v) => !v)}
              >
                <Icon name={reveal ? 'eyeOff' : 'eye'} size={15} />
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">Password requirements</p>
            <ul className="flex flex-col gap-2">
              {CRITERIA.map((c, i) => (
                <li key={c.label} className="flex items-center gap-2.5 text-sm">
                  <Icon
                    name={passed[i] ? 'check' : 'chevronRight'}
                    size={14}
                    className={cx('flex-none', passed[i] ? 'text-primary' : 'text-muted-foreground')}
                  />
                  <span className={passed[i] ? 'text-foreground' : 'text-muted-foreground'}>{c.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {error && (
            <p className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium bg-destructive/10 text-destructive h-auto w-full items-start gap-2 py-2 text-left" role="alert">
              <Icon name="alert" size={14} className="mt-0.5 flex-none" />
              {error}
            </p>
          )}

          <Button type="submit" className="h-10 w-full">
            Update password
          </Button>
        </form>

        <p className="text-sm text-center text-muted-foreground">
          Remembered your password?{' '}
          <CustomLink to="/login" className="link text-sm font-medium">Back to log in</CustomLink>
        </p>
      </div>
    </AuthLayout>
  )
}
