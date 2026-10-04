import { Link } from 'react-router-dom'
import { Icon } from '../components/icons'
import { Logo } from '../components/ui'
import { Button } from '../components/ui/button'

const FEATURES = [
  { icon: 'file' as const, title: 'Choose a problem', detail: 'Browse a focused set of coding challenges.' },
  { icon: 'terminal' as const, title: 'Run your code', detail: 'Try custom input and review the judge result.' },
  { icon: 'history' as const, title: 'Review submissions', detail: 'Return to your runs and verdicts when signed in.' },
]

export default function Landing() {
  return (
    <div className="flex min-h-app flex-col bg-background text-foreground">
      <main className="mx-auto flex w-full max-w-5xl grow flex-col justify-center gap-16 px-4 py-16 sm:px-6 md:gap-20 md:py-24">
        <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground">
            <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
            CodeForge coding practice
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Practice problems. Build confidence.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Work through coding problems in a focused workspace, run your solution, and review the result.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button size="lg" render={<Link to="/problems" />}>
              Start solving
              <Icon name="arrowRight" size={16} />
            </Button>
            <Button size="lg" variant="outline" render={<Link to="/login" />}>
              Sign in
            </Button>
          </div>
        </section>

        <section aria-label="Ways to practice" className="grid gap-3 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="flex min-w-0 items-start gap-4 rounded-xl border border-border bg-card p-5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground" aria-hidden="true">
                <Icon name={feature.icon} size={17} />
              </span>
              <div className="min-w-0 space-y-1">
                <h2 className="text-sm font-semibold text-foreground">{feature.title}</h2>
                <p className="text-sm leading-6 text-muted-foreground">{feature.detail}</p>
              </div>
            </article>
          ))}
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6">
          <Link to="/" aria-label="CodeForge home" className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Logo size={24} />
          </Link>
          <p className="text-sm text-muted-foreground">A focused space for coding practice.</p>
          <Link to="/problems" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Browse problems
          </Link>
        </div>
      </footer>
    </div>
  )
}
