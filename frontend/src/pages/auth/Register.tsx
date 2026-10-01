import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout, AuthShowcase } from './AuthLayout'
import { Icon } from '../../components/icons'
import { cx } from '../../components/ui'
import { CodeWindow } from '../../components/Code'
import { REGISTER_SHOWCASE } from '../../data'
import CustomButton from '../../components/ui/CustomButton'
import CustomLink from '../../components/ui/CustomLink'


export function passwordScore(pw: string): number {
  let s = 0
  if (pw.length >= 8) s++
  if (pw.length >= 12) s++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw) && /\d/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return pw ? s : 0
}

const STRENGTH_LABEL = ['Weak', 'Weak', 'Fair', 'Good', 'Strong']


export function StrengthMeter({ value }: { value: number }) {
  const tone = value >= 4 ? 'bg-success' : value >= 3 ? 'bg-accent' : value >= 2 ? 'bg-warning' : 'bg-error'
  return (
    <div className="flex gap-2" aria-hidden>
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
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [reveal, setReveal] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')

  const score = useMemo(() => passwordScore(password), [password])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError('Enter your name.')
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.')
    if (password.length < 8) return setError('Password must be at least 8 characters long.')
    if (!agreed) return setError('Confirm that you want to create an account.')
    // push({ title: 'Account created', description: 'Your account is ready.', tone: 'success' })
    navigate('/problems', { replace: true })
  }

  const showcase = (
    <AuthShowcase
      overline="Accelerated Preparation"
      headline="Built for engineers who take practice seriously."
      sub="Real-time execution in isolated Linux microVMs. Zero mocking, zero fluff, instant feedback."
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
      />
    </AuthShowcase>
  )

  return (
    <AuthLayout showcase={showcase}>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="t-page-title text-ink">Create account</h1>
          <p className="t-reading text-ink-2">Create an account to save your progress.</p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={submit} noValidate>
          <div className="flex flex-col gap-2">
            <label className="t-ui-med text-ink" htmlFor="reg-name">
              Name
            </label>
            <input
              id="reg-name"
              className="input h-10"
              placeholder="Your name"
              autoComplete="name"
              value={name}
              aria-invalid={!!error}
              onChange={(e) => {
                setName(e.target.value)
                setError('')
              }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="t-ui-med text-ink" htmlFor="reg-email">
              Email
            </label>
            <input
              id="reg-email"
              className="input h-10"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              aria-invalid={!!error}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="t-ui-med text-ink" htmlFor="reg-password">
                Password
              </label>
              <span className="t-caption text-ink-3">At least 8 characters</span>
            </div>
            <div className="relative">
              <input
                id="reg-password"
                className="input h-10 pr-11"
                type={reveal ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Create a password"
                value={password}
                aria-invalid={!!error}
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
                <span className="text-ink-3">Entropy: {score >= 4 ? 'High' : score >= 3 ? 'Medium' : 'Low'}</span>
                <span className={cx('flex items-center gap-1.5', score >= 3 ? 'text-success' : 'text-warning')}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                  {STRENGTH_LABEL[score]}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <p className="pill pill-error h-auto w-full items-start gap-2 py-2 text-left" role="alert">
              <Icon name="alert" size={14} className="mt-0.5 flex-none" />
              {error}
            </p>
          )}

          <label className="flex cursor-pointer items-start gap-2 t-ui text-ink-2">
            <input
              type="checkbox"
              className="checkbox mt-0.5"
              checked={agreed}
              onChange={(e) => {
                setAgreed(e.target.checked)
                setError('')
              }}
            />
            <span>I confirm that I want to create an account.</span>
          </label>

          <CustomButton variant="unstyled" type="submit" className="btn btn-primary btn-block h-10">
            Create account
          </CustomButton>
        </form>

        <p className="t-ui text-center text-ink-2">
          Already have an account?{' '}
          <CustomLink to="/login" className="link t-ui-med">
            Log in
          </CustomLink>
        </p>
      </div>
    </AuthLayout>
  )
}
