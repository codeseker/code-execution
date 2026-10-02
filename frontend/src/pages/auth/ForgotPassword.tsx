import { useState } from 'react'

import { AuthLayout, AuthShowcase } from './AuthLayout'
import { Icon } from '../../components/icons'
import CustomLink from '../../components/CustomLink'
import { Button } from '../../components/ui/button'
import { useAppForm } from '../../hooks/useAppForm'
import useForgotPassword, {
  forgotPasswordSchema,
  type ForgotPasswordFormSchema,
} from '../../hooks/auth/forgotPassword/useForgotPassword'

const SHOWCASE = (
  <AuthShowcase
    headline="Recover your account."
    sub="Request a password reset for your account."
  >
    <div className="flex flex-col rounded-md border border-border bg-background px-5">
      {[
        { icon: 'mail' as const, title: 'Enter your account email', copy: 'Use the address associated with your account.' },
        { icon: 'key' as const, title: 'Check for reset instructions', copy: 'Look in your inbox for the next step.' },
        { icon: 'lock' as const, title: 'Choose a new password', copy: 'Return to your account with updated credentials.' },
      ].map((step, index) => (
        <div key={step.title} className={`flex items-center gap-4 py-4 ${index < 2 ? 'border-b border-border' : ''}`}>
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-card text-muted-foreground">
            <Icon name={step.icon} size={17} />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">{step.title}</p>
            <p className="text-xs text-muted-foreground">{step.copy}</p>
          </div>
        </div>
      ))}
    </div>
  </AuthShowcase>
)

export default function ForgotPassword() {
  const [sent, setSent] = useState(false)
  const { forgotPassword, loading } = useForgotPassword()

  const { handleSubmit, register: bind, errors, watch } = useAppForm<ForgotPasswordFormSchema>({
    schema: forgotPasswordSchema,
    defaultValues: { email: '' },
    onSubmit: async (values) => {
      try {
        await forgotPassword(values)
        setSent(true)
      } catch {
        // Toast + resolver errors are handled by the hook / form.
      }
    },
  })

  const email = watch('email') ?? ''

  return (
    <AuthLayout showcase={SHOWCASE}>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Forgot password?</h1>
          <p className="text-sm leading-7 text-muted-foreground">Enter your email to request a password reset.</p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <Icon name="checkCircle" size={32} className="text-primary" />
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold text-foreground">Check your email</h2>
              <p className="text-sm leading-7 text-muted-foreground">
                If an account uses {email}, reset instructions will be sent there.
              </p>
            </div>
            <CustomLink to={`/reset-password${email ? `?email=${encodeURIComponent(email)}` : ''}`} className="link text-sm font-medium">
              I have my reset code
            </CustomLink>
            <CustomLink to="/login" className="link text-sm font-medium">Back to log in</CustomLink>
          </div>
        ) : (
          <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground" htmlFor="forgot-email">
                Email
              </label>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                aria-invalid={Boolean(errors.email)}
                className="input h-10 w-full"
                {...bind('email')}
              />
              {errors.email && <span className="text-xs text-destructive">{errors.email.message}</span>}
            </div>

            <Button type="submit" className="h-10 w-full" disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
        )}

        {!sent && <p className="text-sm text-center text-muted-foreground">
          Remembered it?{' '}
          <CustomLink to="/login" className="link text-sm font-medium">
            Back to log in
          </CustomLink>
        </p>}
      </div>
    </AuthLayout>
  )
}