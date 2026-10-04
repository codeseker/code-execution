import type { ReactNode } from 'react'

import { AvatarStack } from '../../components/ui'
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
    <div className="flex min-h-app bg-background">
      <div className="flex w-full flex-col px-6 py-6 sm:px-10 lg:w-1/2 lg:min-w-130 lg:px-16">
        <main className="mx-auto flex w-full max-w-100 grow flex-col justify-center py-12">
          {children}
        </main>
      </div>

      {/* Stays pinned to the viewport while the form column scrolls on short screens. */}
      <aside className="hidden flex-1 border-l border-border bg-card px-14 py-9 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto">
        {showcase}
      </aside>
    </div>
  )
}

type ShowcaseProps = {
  headline: string
  sub?: string
  children?: ReactNode
  /** Optional extras — other auth screens may still pass these. */
  chip?: string
  status?: string
  overline?: string
  proof?: ReactNode
}

/** Right-hand panel: headline, short sub-copy and a product visual. Everything else is optional. */
export function AuthShowcase({ headline, sub, children, chip, status, overline, proof }: ShowcaseProps) {
  return (
    <div className="flex h-full flex-col">
      {(chip || status) && (
        <div className="flex items-center justify-between gap-4">
          {chip ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
              <span className="font-mono text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {chip}
              </span>
            </span>
          ) : (
            <span />
          )}
          {status && <span className="font-mono text-xs text-muted-foreground">{status}</span>}
        </div>
      )}

      <div className="mx-auto flex w-full max-w-150 grow flex-col justify-center gap-3 py-10">
        {overline && (
          <p className="font-mono text-xs tracking-wider text-muted-foreground uppercase">{overline}</p>
        )}
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">{headline}</h2>
        {sub && <p className="text-sm leading-7 max-w-130 text-muted-foreground">{sub}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>

      {proof && (
        <div className="flex items-center justify-between gap-6 border-t border-border pt-6">
          {proof}
        </div>
      )}
    </div>
  )
}

export function AuthProof({ note }: { note?: string }) {
  return (
    <>
      <div className="flex items-center gap-3">
        <AvatarStack initials={['G', 'M', 'S', 'N']} size={28} />
        <div className="flex flex-col gap-1">
          <span className="flex gap-0.5 text-muted-foreground" aria-label="5 out of 5 stars">
            {[0, 1, 2, 3, 4].map((i) => (
              <Icon key={i} name="star" size={12} />
            ))}
          </span>
          {note && <p className="text-xs text-muted-foreground">{note}</p>}
        </div>
      </div>
    </>
  )
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1" role="separator">
      <span className="h-px grow bg-hair" />
      <span className="font-mono text-xs tracking-wide text-muted-foreground uppercase">{label}</span>
      <span className="h-px grow bg-hair" />
    </div>
  )
}