import type { ReactNode } from 'react'
import { AvatarStack, Logo } from '../../components/ui'
import { Icon } from '../../components/icons'

/** Left form column + right showcase column shared by all auth screens. */
export function AuthLayout({
  children,
  showcase,
}: {
  children: ReactNode
  showcase: ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <div className="flex w-full flex-col px-6 py-7 sm:px-10 lg:w-[47%] lg:min-w-[520px] lg:px-16">
        <header className="flex items-center justify-between">
          <a href="/" className="rounded focus-visible:ring-0" aria-label="CodeForge home">
            <Logo size={30} />
          </a>
          <a
            href="#docs"
            className="t-ui-med inline-flex items-center gap-1 text-ink-2 transition-colors hover:text-ink"
          >
            Docs
            <Icon name="arrowUpRight" size={14} />
          </a>
        </header>

        <main className="mx-auto flex w-full max-w-[440px] grow flex-col justify-center py-12">
          {children}
        </main>

        <p className="t-caption max-w-[440px] text-ink-4 lg:mx-auto">
          Protected by reCAPTCHA and subject to CodeForge{' '}
          <a href="#privacy" className="underline decoration-ink-4 underline-offset-2 hover:text-ink-2">
            Privacy Policy
          </a>{' '}
          and{' '}
          <a href="#terms" className="underline decoration-ink-4 underline-offset-2 hover:text-ink-2">
            Terms of Service
          </a>
          .
        </p>
      </div>

      <aside className="relative hidden flex-1 flex-col border-l border-hair bg-canvas px-14 py-9 lg:flex">
        {showcase}
      </aside>
    </div>
  )
}

type ShowcaseProps = {
  chip: string
  status: string
  overline: string
  headline: string
  sub: string
  children: ReactNode
  proof?: ReactNode
}

/** Right-hand marketing panel: status row, editorial headline, code window, proof. */
export function AuthShowcase({ chip, status, overline, headline, sub, children, proof }: ShowcaseProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-hair bg-panel px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
          <span className="font-mono text-[11px] font-medium tracking-[0.08em] text-ink-2 uppercase">
            {chip}
          </span>
        </span>
        <span className="t-code-tag text-ink-3">{status}</span>
      </div>

      <div className="mx-auto flex w-full max-w-[680px] grow flex-col justify-center gap-5 py-10">
        <p className="font-mono text-[12px] tracking-[0.14em] text-ink-3 uppercase">{overline}</p>
        <h2 className="t-page-title max-w-[600px] text-ink">{headline}</h2>
        <p className="t-reading max-w-[600px] text-ink-2">{sub}</p>
        <div className="mt-2">{children}</div>
      </div>

      {proof && (
        <div className="flex items-center justify-between gap-6 border-t border-hair pt-6">
          {proof}
        </div>
      )}
    </div>
  )
}

/** Default social-proof footer for auth showcases. */
export function AuthProof({ note }: { note?: string }) {
  return (
    <>
      <div className="flex items-center gap-3">
        <AvatarStack initials={['G', 'M', 'S', 'N']} size={28} />
        <div>
          <span className="flex gap-0.5 text-warning" aria-label="5 out of 5 stars">
            {[0, 1, 2, 3, 4].map((i) => (
              <Icon key={i} name="star" size={12} />
            ))}
          </span>
          <p className="t-caption text-ink-2">{note ?? '10,000+ engineers at Google, Meta, Stripe & Netflix.'}</p>
        </div>
      </div>
      <p className="t-code-tag flex items-center gap-2 text-ink-2">
        <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
        99.98% Sandbox Uptime
      </p>
    </>
  )
}

/** Mono divider label used by the auth forms ("OR CONTINUE WITH EMAIL"). */
export function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1" role="separator">
      <span className="h-px grow bg-hair" />
      <span className="font-mono text-[11px] tracking-[0.12em] text-ink-3 uppercase">{label}</span>
      <span className="h-px grow bg-hair" />
    </div>
  )
}
