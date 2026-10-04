import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { AuthLayout, AuthShowcase } from './AuthLayout'
import { Icon } from '../../components/icons'
import CustomLink from '../../components/CustomLink'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { useAppForm } from '../../hooks/useAppForm'
import useVerifyOtp, { verifyOtpSchema, type VerifyOtpFormSchema } from '../../hooks/auth/verifyOtp/useVerifyOtp'
import useResendOtp from '../../hooks/auth/resendOtp/useResendOtp'

const SHOWCASE = (
  <AuthShowcase
    headline="Confirm your inbox."
    sub="Enter the 6-digit code we emailed you to activate your account."
  >
    <div className="flex flex-col rounded-md border border-border bg-background px-5">
      {[
        { icon: 'mail' as const, title: 'Check your inbox', copy: 'The code arrives within a few seconds.' },
        { icon: 'key' as const, title: 'Enter the 6-digit code', copy: 'It stays valid for 10 minutes.' },
        { icon: 'lock' as const, title: 'Account activated', copy: 'Then log in with your credentials.' },
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

export default function VerifyOtp() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') ?? '')

  const { verifyOtp, loading } = useVerifyOtp()
  const { resendOtp, loading: resending } = useResendOtp()

  const { handleSubmit, register: bind, errors, watch, setValue } = useAppForm<VerifyOtpFormSchema>({
    schema: verifyOtpSchema,
    defaultValues: { email, otp: '' },
    onSubmit: async (values) => {
      try {
        await verifyOtp(values)
        navigate('/login', { replace: true })
      } catch {
        // Handled by the hook's toast + resolver errors.
      }
    },
  })

  const currentEmail = watch('email') ?? email

  return (
    <AuthLayout showcase={SHOWCASE}>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Verify your email</h1>
          <p className="text-sm leading-7 text-muted-foreground">
            We sent a 6-digit code to {currentEmail || 'your inbox'}. Enter it below to activate your account.
          </p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground" htmlFor="otp-email">
              Email
            </label>
            <Input
              id="otp-email"
              className="h-10"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              aria-invalid={Boolean(errors.email)}
              {...bind('email')}
              onChange={(event) => {
                setEmail(event.target.value)
                bind('email').onChange(event)
              }}
            />
            {errors.email && <span className="text-xs text-destructive">{errors.email.message}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground" htmlFor="otp-code">
              Verification code
            </label>
            <Input
              id="otp-code"
              className="h-10 font-mono tracking-widest"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              autoComplete="one-time-code"
              aria-invalid={Boolean(errors.otp)}
              {...bind('otp')}
            />
            {errors.otp && <span className="text-xs text-destructive">{errors.otp.message}</span>}
          </div>

          <Button type="submit" className="h-10 w-full" disabled={loading}>
            {loading ? 'Verifying…' : 'Verify email'}
          </Button>
        </form>

        <div className="flex flex-col items-center gap-3">
          <Button
            variant="ghost"
            type="button"
            disabled={resending}
            onClick={() => {
              if (!currentEmail) {
                setValue('email', '', { shouldValidate: true })
                return
              }
              void resendOtp({ email: currentEmail })
            }}
          >
            {resending ? 'Sending…' : 'Resend code'}
          </Button>
          <p className="text-sm text-muted-foreground">
            Already verified?{' '}
            <CustomLink to="/login" className="link text-sm font-medium">
              Back to log in
            </CustomLink>
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}