import { useState } from 'react'
import type { FormEvent } from 'react'

import { AuthLayout, AuthShowcase } from './AuthLayout'
import { Icon } from '../../components/icons'
import CustomButton from '../../components/ui/CustomButton'
import CustomLink from '../../components/ui/CustomLink'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address.')
      return
    }
    setError('')
    setSent(true)
  }

  const showcase = (
    <AuthShowcase
      headline="Recover your account."
      sub="Request a password reset for your account."
    >
      <div className="flex flex-col rounded-md border border-hair bg-canvas px-5">
        <div className="flex items-center gap-4 border-b border-hair py-4">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-panel text-ink-2">
            <Icon name="mail" size={17} />
          </span>
          <div className="flex flex-col gap-1">
            <p className="t-ui-med text-ink">Enter your account email</p>
            <p className="t-caption text-ink-2">Use the address associated with your account.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 border-b border-hair py-4">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-panel text-ink-2">
            <Icon name="key" size={17} />
          </span>
          <div className="flex flex-col gap-1">
            <p className="t-ui-med text-ink">Check for reset instructions</p>
            <p className="t-caption text-ink-2">Look in your inbox for the next step.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 py-4">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-panel text-ink-2">
            <Icon name="lock" size={17} />
          </span>
          <div className="flex flex-col gap-1">
            <p className="t-ui-med text-ink">Choose a new password</p>
            <p className="t-caption text-ink-2">Return to your account with updated credentials.</p>
          </div>
        </div>
      </div>
    </AuthShowcase>
  )

  return (
    <AuthLayout showcase={showcase}>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="t-page-title text-ink">Forgot password?</h1>
          <p className="t-reading text-ink-2">Enter your email to request a password reset.</p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <Icon name="checkCircle" size={32} className="text-success" />
            <div className="flex flex-col gap-2">
              <h2 className="t-h2 text-ink">Check your email</h2>
              <p className="t-reading text-ink-2">If an account uses {email}, reset instructions will be sent there.</p>
            </div>
            <CustomLink to="/login" className="link t-ui-med">Back to log in</CustomLink>
          </div>
        ) : (
          <form className="flex flex-col gap-5" onSubmit={submit} noValidate>
            <div className="flex flex-col gap-2">
              <label className="t-ui-med text-ink" htmlFor="forgot-email">
                Email
              </label>
              <input
                id="forgot-email"
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

            {error && (
              <p className="pill pill-error h-auto w-full items-start gap-2 py-2 text-left" role="alert">
                <Icon name="alert" size={14} className="mt-0.5 flex-none" />
                {error}
              </p>
            )}

            <CustomButton variant="unstyled" type="submit" className="btn btn-primary btn-block h-10">
              Send reset link
            </CustomButton>
          </form>
        )}

        {!sent && <p className="t-ui text-center text-ink-2">
          Remembered it?{' '}
          <CustomLink to="/login" className="link t-ui-med">
            Back to log in
          </CustomLink>
        </p>}
      </div>
    </AuthLayout>
  )
}
