import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout, AuthProof, AuthShowcase } from './AuthLayout'
import { Icon } from '../../components/icons'
import { RECOVERY_SHOWCASE } from '../../data'
import { CodeWindow } from '../../components/Code'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter the email associated with your account.')
      return
    }
    setError('')
    setSent(true)
  }

  const showcase = (
    <AuthShowcase
      chip="Secure Authentication"
      status="Argon2id KDF  /  256-bit AES"
      overline="Account Recovery"
      headline="Back in the editor in minutes."
      sub="Reset tokens are single-use, expire after 15 minutes, and revoke every active sandbox session the moment they are consumed."
      proof={<AuthProof note="Trusted by 85,000+ engineers worldwide." />}
    >
      <CodeWindow
        title="recovery_request.json"
        lang="generic"
        code={RECOVERY_SHOWCASE.code.join('\n')}
        activeLine={3}
        headerRight={
          <span className="pill pill-accent">
            <Icon name="shield" size={12} />
            Verified Safe
          </span>
        }
        footer={
          <>
            <span className="t-code-tag flex items-center gap-2 text-ink-2">
              <Icon name="lock" size={12} />
              Encryption: TLS 1.3 / mTLS Inter-node
            </span>
            <span className="t-code-tag text-ink-2">Zero-Knowledge Storage</span>
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
        <Link to="/login" className="t-ui-med inline-flex w-fit items-center gap-2 text-ink-2 hover:text-ink">
          <Icon name="arrowLeft" size={15} />
          Back to login
        </Link>

        <div className="stack gap-2">
          <h1 className="t-page-title text-ink">Forgot your password?</h1>
          <p className="t-reading text-ink-2">
            Enter the email associated with your account and we&apos;ll send a 6-digit verification
            token with reset instructions.
          </p>
        </div>

        {sent ? (
          <div className="stack gap-4">
            <div className="callout" style={{ background: 'var(--success-soft)' }}>
              <Icon name="checkCircle" size={20} className="mt-0.5 flex-none text-success" />
              <div className="stack gap-1">
                <p className="t-ui-med text-ink">Reset code sent to {email}</p>
                <p className="t-caption text-ink-2">
                  The code expires in 15 minutes. Check your spam folder if it does not appear.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" className="btn btn-primary h-9" onClick={() => navigate('/reset-password')}>
                Enter reset code
              </button>
              <button type="button" className="btn btn-secondary h-9" onClick={() => setSent(false)}>
                Use a different email
              </button>
            </div>
          </div>
        ) : (
          <form className="stack gap-4" onSubmit={submit} noValidate>
            <div>
              <label className="field-label" htmlFor="forgot-email">
                Work Email Address
              </label>
              <div className="relative">
                <Icon
                  name="mail"
                  size={15}
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-3"
                />
                <input
                  id="forgot-email"
                  className="input h-9 pl-9"
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
            </div>

            {error && (
              <p className="pill pill-error h-auto w-full items-start gap-2 py-1.5 text-left" role="alert">
                <Icon name="alert" size={13} className="mt-0.5 flex-none" />
                {error}
              </p>
            )}

            <button type="submit" className="btn btn-primary h-9 btn-block gap-2">
              Send Reset Instructions
              <span className="kbd">⌘↵</span>
            </button>
          </form>
        )}

        <div className="card stack divide-y divide-hair bg-wash p-0">
          <div className="flex items-center gap-3 px-4 py-3">
            <Icon name="bulb" size={15} className="text-ink-3" />
            <p className="t-ui text-ink-2">
              Remember your password?{' '}
              <Link to="/login" className="link t-ui-med">
                Log in
              </Link>
            </p>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <Icon name="message" size={15} className="text-ink-3" />
            <p className="t-ui text-ink-2">
              Can&apos;t access your email?{' '}
              <a href="#support" className="link t-ui-med">
                Contact Security Support
              </a>
            </p>
          </div>
        </div>

        <p className="t-ui text-center text-ink-2">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="link t-ui-med">
            Register now
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
