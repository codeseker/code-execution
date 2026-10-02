import { useState } from 'react'
import type { FormEvent } from 'react'

import { AuthLayout, AuthShowcase } from './AuthLayout'
import { Icon } from '../../components/icons'
import CustomLink from '../../components/CustomLink'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'

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
      <div className="flex flex-col rounded-md border border-border bg-background px-5">
        <div className="flex items-center gap-4 border-b border-border py-4">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-card text-muted-foreground">
            <Icon name="mail" size={17} />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">Enter your account email</p>
            <p className="text-xs text-muted-foreground">Use the address associated with your account.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 border-b border-border py-4">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-card text-muted-foreground">
            <Icon name="key" size={17} />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">Check for reset instructions</p>
            <p className="text-xs text-muted-foreground">Look in your inbox for the next step.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 py-4">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-card text-muted-foreground">
            <Icon name="lock" size={17} />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">Choose a new password</p>
            <p className="text-xs text-muted-foreground">Return to your account with updated credentials.</p>
          </div>
        </div>
      </div>
    </AuthShowcase>
  )

  return (
    <AuthLayout showcase={showcase}>
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
              <p className="text-sm leading-7 text-muted-foreground">If an account uses {email}, reset instructions will be sent there.</p>
            </div>
            <CustomLink to="/login" className="link text-sm font-medium">Back to log in</CustomLink>
          </div>
        ) : (
          <form className="flex flex-col gap-5" onSubmit={submit} noValidate>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground" htmlFor="forgot-email">
                Email
              </label>
              <Input
                id="forgot-email"
                className="h-10"
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
              <p className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium bg-destructive/10 text-destructive h-auto w-full items-start gap-2 py-2 text-left" role="alert">
                <Icon name="alert" size={14} className="mt-0.5 flex-none" />
                {error}
              </p>
            )}

            <Button type="submit" className="h-10 w-full">
              Send reset link
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
