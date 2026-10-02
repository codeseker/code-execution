import { useState } from "react"
import { useNavigate } from 'react-router-dom'

import { AuthLayout, AuthShowcase } from './AuthLayout'
import { Icon } from '../../components/icons'
import { cx } from '../../components/ui'
import { CodeWindow } from '../../components/Code'
import { REGISTER_SHOWCASE } from '../../data'
import CustomLink from '../../components/CustomLink'
import { Button } from '../../components/ui/button'
import { Checkbox } from '../../components/ui/checkbox'
import { Input } from '../../components/ui/input'
import { useAppForm } from '../../hooks/useAppForm'
import useRegister, { registerSchema, type RegisterFormSchema } from '../../hooks/auth/register/useRegister'

export function passwordScore(pw: string): number {
  let s = 0
  if (pw.length >= 8) s++
  if (pw.length >= 12) s++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw) && /\d/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return pw ? s : 0
}

const STRENGTH_LABEL = ['Weak', 'Weak', 'Fair', 'Good', 'Strong']

/** Password strength bars - shared with the ResetPassword screen. */
export function StrengthMeter({ value }: { value: number }) {
  const tone = value >= 4 ? 'bg-primary' : value >= 3 ? 'bg-primary' : value >= 2 ? 'bg-muted' : 'bg-destructive'
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

const SHOWCASE = (
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
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
            Python <span className="font-mono text-xs opacity-70">3.11</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium bg-primary/10 text-primary">
            <Icon name="check" size={12} />
            All Tests Passed · 14ms
          </span>
        </span>
      }
    />
  </AuthShowcase>
)

export default function Register() {
  const navigate = useNavigate()
  const [reveal, setReveal] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [formError, setFormError] = useState('')

  const { register, loading } = useRegister()

  const { handleSubmit, register: bind, errors, watch, reset } = useAppForm<RegisterFormSchema>({
    schema: registerSchema,
    defaultValues: { username: '', email: '', password: '' },
    onSubmit: async (values) => {
      if (!agreed) {
        setFormError('Confirm that you want to create an account.')
        return
      }
      setFormError('')
      try {
        await register(values)
        reset()
        // Accounts start as PENDING, so the OTP screen is the only next step.
        navigate(`/verify-otp?email=${encodeURIComponent(values.email)}`, { replace: true })
      } catch {
        // Toast + field errors are surfaced by the hook and the resolver.
      }
    },
  })

  const score = passwordScore(watch('password') ?? '')

  return (
    <AuthLayout showcase={SHOWCASE}>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Create account</h1>
          <p className="text-sm leading-7 text-muted-foreground">Create an account to save your progress.</p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground" htmlFor="reg-name">
              Username
            </label>
            <Input
              id="reg-name"
              className="h-10"
              placeholder="Your username"
              autoComplete="username"
              aria-invalid={Boolean(errors.username)}
              {...bind('username')}
            />
            {errors.username && <span className="text-xs text-destructive">{errors.username.message}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground" htmlFor="reg-email">
              Email
            </label>
            <Input
              id="reg-email"
              className="h-10"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              aria-invalid={Boolean(errors.email)}
              {...bind('email')}
            />
            {errors.email && <span className="text-xs text-destructive">{errors.email.message}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground" htmlFor="reg-password">
                Password
              </label>
              <span className="text-xs text-muted-foreground">At least 8 characters</span>
            </div>
            <div className="relative">
              <Input
                id="reg-password"
                className="h-10 pr-11"
                type={reveal ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Create a password"
                aria-invalid={Boolean(errors.password)}
                {...bind('password')}
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
            {errors.password && <span className="text-xs text-destructive">{errors.password.message}</span>}
            <div className="mt-2 flex flex-col gap-2">
              <StrengthMeter value={score} />
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Entropy: {score >= 4 ? 'High' : score >= 3 ? 'Medium' : 'Low'}</span>
                <span className={cx('flex items-center gap-1.5', score >= 3 ? 'text-primary' : 'text-muted-foreground')}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                  {STRENGTH_LABEL[score]}
                </span>
              </div>
            </div>
          </div>

          {formError && (
            <p className="inline-flex items-start gap-2 rounded-md bg-destructive/10 px-2 py-2 text-left text-xs font-medium text-destructive" role="alert">
              <Icon name="alert" size={14} className="mt-0.5 flex-none" />
              {formError}
            </p>
          )}

          <label className="flex cursor-pointer items-start gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={agreed}
              onCheckedChange={(checked) => {
                setAgreed(checked === true)
                setFormError('')
              }}
            />
            <span>I confirm that I want to create an account.</span>
          </label>

          <Button type="submit" className="h-10 w-full" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className="text-sm text-center text-muted-foreground">
          Already have an account?{' '}
          <CustomLink to="/login" className="link text-sm font-medium">
            Log in
          </CustomLink>
        </p>
      </div>
    </AuthLayout>
  )
}