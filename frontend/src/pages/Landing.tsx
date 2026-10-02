
import { Icon } from '../components/icons'
import { Logo, cx } from '../components/ui'
import { CodeWindow } from '../components/Code'
import { ENGINE_BULLETS, FAQ, LANDING_FEATURES, LANDING_ROADMAP, LANDING_STATS, PRICING, REGISTER_SHOWCASE, SYSTEM_DESIGN_POINTS } from '../data'
import { useState } from 'react'
import CustomLink from '../components/CustomLink'
import { Button } from '../components/ui/button'

const FEATURE_ICONS: Record<string, Parameters<typeof Icon>[0]['name']> = {
  visualizer: 'monitor',
  tracks: 'target',
  sandbox: 'cpu',
  recall: 'history',
  profiler: 'gauge',
  mock: 'users',
}

function Hero() {
  return (
    <section className="mx-auto grid max-w-[1160px] items-center gap-12 px-6 py-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:py-24">
      <div className="flex flex-col gap-6">
        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium bg-primary/10 text-primary w-fit">
          <Icon name="zap" size={12} />
          v2.4 — Adaptive mock interviews are live
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Master DSA.
          <br />
          Crack interviews.
        </h1>
        <p className="text-sm leading-7 max-w-[520px] text-muted-foreground">
          Curated problems, visual company trackers, and 15-year essential drills. Real interview
          signal, distilled for your dream role.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button  size="lg">
            <CustomLink variant="unstyled" to="/register">
              Start learning free
              <Icon name="arrowRight" size={15} />
            </CustomLink>
          </Button>
          <Button variant="outline" size="lg"
            type="button"
            onClick={() => null
              // push({ title: 'Demo reel queued', description: 'Video playback is disabled in this preview.', tone: 'neutral' })
            }
          >
            <Icon name="play" size={13} />
            Watch demo <span className="font-mono text-xs text-muted-foreground">(2:14)</span>
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-x-7 gap-y-2 pt-2 text-muted-foreground">
          {['Google', 'Meta', 'Stripe', 'Amazon', 'Netflix'].map((c) => (
            <span key={c} className="text-[15px] font-semibold tracking-[-0.01em] grayscale-0">
              {c}
            </span>
          ))}
        </div>
      </div>

      <CodeWindow
        title="{} LRUCache.py"
        lang="python"
        code={REGISTER_SHOWCASE.code.join('\n')}
        activeLine={8}
        headerRight={
          <span className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
              Python <span className="font-mono text-xs opacity-70">3.11</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium bg-primary/10 text-primary">
              <Icon name="checkCircle" size={12} />
              12 / 12 passed · 14ms
            </span>
          </span>
        }
        footer={
          <>
            <span className="font-mono text-xs flex items-center gap-2 text-muted-foreground">
              <Icon name="cpu" size={13} />
              {REGISTER_SHOWCASE.memory}
            </span>
            <span className="font-mono text-xs flex items-center gap-2 text-muted-foreground">
              <Icon name="gauge" size={13} />
              {REGISTER_SHOWCASE.runtime}
            </span>
          </>
        }
      />
    </section>
  )
}

function StatsBand() {
  return (
    <section className="border-y border-border bg-sidebar">
      <div className="mx-auto grid max-w-[1160px] grid-cols-2 gap-y-8 px-6 py-10 md:grid-cols-4">
        {LANDING_STATS.map((s, i) => (
          <div
            key={s.label}
            className={cx('px-2 md:px-6', i > 0 && 'md:border-l md:border-border')}
          >
            <p className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">{s.value}</p>
            <p className="text-sm font-medium mt-1 text-foreground">{s.label}</p>
            <p className="text-xs text-muted-foreground">{s.meta}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Features() {
  return (
    <section id="features" className="mx-auto max-w-[1160px] scroll-mt-20 px-6 py-20 lg:py-24">
      <div className="mx-auto max-w-[720px] text-center">
        <p className="text-sm font-semibold text-primary">Designed for mastery</p>
        <h2 className="text-2xl font-semibold tracking-tight mt-3 text-foreground">
          Engineered for deep comprehension, not rote memorization.
        </h2>
        <p className="text-sm leading-7 mt-3 text-muted-foreground">
          Say goodbye to pattern memorization. Build intuition with visual execution, structured
          repetition, and instant feedback on every run.
        </p>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {LANDING_FEATURES.map((f) => (
          <article key={f.title} className="rounded-xl border border-border bg-card text-card-foreground shadow-sm flex flex-col gap-3 p-5 transition-shadow hover:shadow-e1">
            <span className="center h-9 w-9 rounded-md bg-primary/10 text-primary">
              <Icon name={FEATURE_ICONS[f.icon] ?? 'star'} size={18} />
            </span>
            <h3 className="text-[15px] leading-5 font-semibold text-foreground">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function Roadmap() {
  return (
    <section id="how-it-works" className="border-y border-border bg-sidebar scroll-mt-20">
      <div className="mx-auto max-w-[1160px] px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-[640px]">
            <p className="text-sm font-semibold text-primary">The roadmap</p>
            <h2 className="text-2xl font-semibold tracking-tight mt-3 text-foreground">
              An expert roadmap from array two-pointers to dynamic programming.
            </h2>
          </div>
          <CustomLink to="/register" className="link text-sm font-medium inline-flex items-center gap-1.5">
            View full curriculum
            <Icon name="arrowRight" size={14} />
          </CustomLink>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {LANDING_ROADMAP.map((r) => (
            <article key={r.step} className="rounded-xl border border-border bg-card text-card-foreground shadow-sm flex flex-col gap-3 p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">{r.step}</span>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">{r.phase}</span>
              </div>
              <h3 className="text-[17px] leading-6 font-semibold text-foreground">{r.title}</h3>
              <p className="text-sm text-muted-foreground">{r.text}</p>
              <CustomLink
                to="/register"
                className="text-sm font-medium mt-1 inline-flex items-center gap-1.5 text-primary hover:underline"
              >
                Start chapter
                <Icon name="arrowRight" size={13} />
              </CustomLink>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

const ENGINE_CODE = `def two_sum(nums, target):
    seen = {}                    # O(n) memory
    for i, num in enumerate(nums):
        comp = target - num      # O(1) per probe
        if comp in seen:
            return [seen[comp], i]
        seen[num] = i
    return []`

function EngineSection() {
  return (
    <section className="mx-auto grid max-w-[1160px] items-center gap-12 px-6 py-20 lg:grid-cols-2">
      <CodeWindow
        title="big-o.trace"
        lang="python"
        code={ENGINE_CODE}
        activeLine={4}
        headerRight={<span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">Profiler</span>}
        footer={
          <>
            <span className="font-mono text-xs flex items-center gap-2 text-muted-foreground">
              <Icon name="activity" size={13} />
              Per-line cost: O(n) · 4.1M ops/s
            </span>
            <span className="font-mono text-xs text-primary">Beats 97.3% of submissions</span>
          </>
        }
      />
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-primary">Core engine</p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Dynamic Big-O Execution Engine</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Type-safety is not enough — know exactly why your code is slow. Per-line complexity,
            memory heatmaps, and worst-case synthesis run on every submission.
          </p>
        </div>
        <ul className="flex flex-col gap-3">
          {ENGINE_BULLETS.map((b) => (
            <li key={b} className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="center mt-0.5 h-5 w-5 flex-none rounded-full bg-primary/10 text-primary">
                <Icon name="check" size={12} strokeWidth={2.4} />
              </span>
              {b}
            </li>
          ))}
        </ul>
        <Button  variant="outline" className="w-fit">
          <CustomLink variant="unstyled" to="/register">
            See the profiler
            <Icon name="arrowRight" size={14} />
          </CustomLink>
        </Button>
      </div>
    </section>
  )
}

const RELIABILITY_LOG = [
  { t: '10:22:41', src: 'cluster.raft', msg: 'leader elected: node-04 (eu-central)', tone: 'text-primary' },
  { t: '10:22:41', src: 'shard.router', msg: 'rebalanced 128 ranges · 0 downtime', tone: 'text-muted-foreground' },
  { t: '10:22:42', src: 'cache.redis', msg: 'hit ratio 98.4% (window 5m)', tone: 'text-muted-foreground' },
  { t: '10:22:44', src: 'queue.kafka', msg: 'lag 0 msgs · consumer group healthy', tone: 'text-primary' },
  { t: '10:22:45', src: 'audit.writer', msg: 'checkpoint committed @ LSN 9f21', tone: 'text-muted-foreground' },
  { t: '10:22:47', src: 'health.probe', msg: 'all 48 replicas OK', tone: 'text-primary' },
]

function SystemDesignSection() {
  return (
    <section className="border-y border-border bg-sidebar">
      <div className="mx-auto grid max-w-[1160px] items-center gap-12 px-6 py-20 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-primary">System design</p>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Curated System Design &amp; Concurrency Challenges</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              Whiteboard-less design practice: reason about trade-offs, then prove them by writing
              the concurrency primitives that keep them honest.
            </p>
          </div>
          <ul className="flex flex-col gap-3">
            {SYSTEM_DESIGN_POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-muted-foreground">
                <Icon name="gitBranch" size={15} className="mt-0.5 flex-none text-primary" />
                {p}
              </li>
            ))}
          </ul>
          <Button  variant="outline" className="w-fit">
            <CustomLink variant="unstyled" to="/register">
              Explore design tracks
              <Icon name="arrowRight" size={14} />
            </CustomLink>
          </Button>
        </div>

        <div className="code-window">
          <div className="flex h-9 items-center gap-3 border-b border-border px-3">
            <span className="flex gap-1.5" aria-hidden>
              <span className="size-2.5 rounded-full bg-primary" />
              <span className="size-2.5 rounded-full bg-secondary" />
              <span className="size-2.5 rounded-full bg-destructive" />
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-0.5 text-xs text-secondary-foreground font-mono text-[11px]">system_reliability.log</span>
            <span className="grow" />
            <span className="font-mono text-xs hidden text-muted-foreground sm:inline">Live tail · 10Hz</span>
          </div>
          <div className="flex flex-col gap-1.5 p-4 font-mono text-[12.5px] leading-5">
            {RELIABILITY_LOG.map((l) => (
              <div key={l.t + l.src} className="flex gap-3 whitespace-nowrap">
                <span className="text-muted-foreground">[{l.t}]</span>
                <span className="text-primary">{l.src}</span>
                <span className={cx('truncate', l.tone)}>→ {l.msg}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-2.5">
            <span className="font-mono text-xs mr-1 text-muted-foreground">NODE DISTRIBUTION (RAFT)</span>
            {['Frankfurt', 'Oregon', 'Singapore'].map((n) => (
              <span key={n} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                {n}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-[1160px] scroll-mt-20 px-6 py-20">
      <div className="mx-auto max-w-[680px] text-center">
        <p className="text-sm font-semibold text-primary">Pricing</p>
        <h2 className="text-2xl font-semibold tracking-tight mt-3 text-foreground">Transparent pricing for ambitious developers.</h2>
        <p className="text-sm leading-7 mt-3 text-muted-foreground">
          Start for free, level up when you are ready. Cancel anytime — your progress stays yours.
        </p>
      </div>
      <div className="mt-12 grid items-start gap-4 md:grid-cols-3">
        {PRICING.map((plan) => (
          <article
            key={plan.name}
            className={cx(
              'rounded-xl border border-border bg-card text-card-foreground shadow-sm relative flex flex-col gap-5 p-6',
              plan.featured && 'border-accent shadow-e1',
            )}
          >
            {plan.featured && (
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium bg-primary/10 text-primary absolute -top-3 left-6">
                <Icon name="star" size={11} />
                Most popular
              </span>
            )}
            <div className="flex flex-col gap-1.5">
              <h3 className="text-[16px] font-semibold text-foreground">{plan.name}</h3>
              <p className="text-xs text-muted-foreground">{plan.tagline}</p>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">{plan.price}</span>
              <span className="text-sm text-muted-foreground">{plan.period}</span>
            </div>
            <Button variant={plan.featured ? 'default' : 'outline'}
              type="button"
              className="w-full"
              onClick={() => null
                // plan.name === 'Teams & Bootcamps'
                //   ? push({ title: 'Sales will reach out shortly', description: 'Enterprise plans are demo-only in this build.', tone: 'neutral' })
                //   : undefined
              }
            >
              {plan.cta}
            </Button>
            <ul className="flex flex-col gap-2.5 border-t border-border pt-5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <Icon
                    name="check"
                    size={14}
                    className={cx('mt-0.5 flex-none', plan.featured ? 'text-primary' : 'text-primary')}
                    strokeWidth={2.2}
                  />
                  {f}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <p className="text-xs mt-6 text-center text-muted-foreground">
        All plans include the free tier forever. Prices in USD, billed monthly.
      </p>
    </section>
  )
}

function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="faq" className="border-t border-border bg-sidebar scroll-mt-20">
      <div className="mx-auto max-w-[720px] px-6 py-20">
        <div className="text-center">
          <p className="text-sm font-semibold text-primary">FAQ</p>
          <h2 className="text-2xl font-semibold tracking-tight mt-3 text-foreground">Frequently Asked Questions</h2>
          <p className="text-sm leading-7 mt-3 text-muted-foreground">
            Everything you need to know about the CodeForge practice platform.
          </p>
        </div>
        <div className="mt-10">
          {FAQ.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={item.q} className="border-b border-border">
                <Button variant="ghost"
                  type="button"
                  className="h-auto w-full justify-between py-4 text-left"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span className="text-sm font-medium text-foreground">{item.q}</span>
                  <Icon
                    name="chevronDown"
                    size={16}
                    className={cx(
                      'flex-none text-muted-foreground transition-transform duration-150',
                      isOpen && 'rotate-180',
                    )}
                  />
                </Button>
                {isOpen && (
                  <p className="text-sm anim-fade -mt-1 max-w-[660px] pb-4 text-muted-foreground">{item.a}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function Cta() {
  return (
    <section className="bg-primary px-6 py-16 text-center">
      <h2 className="text-2xl font-semibold tracking-tight mx-auto max-w-[640px] text-primary-foreground">
        Ready to land your dream engineering role?
      </h2>
      <p className="mx-auto mt-3 max-w-[560px] text-sm leading-7 text-primary-foreground/90">
        Join 10,000+ candidates practicing smarter with adaptive feedback — every problem, every day.
      </p>
      <Button  variant="secondary" size="lg" className="mx-auto mt-7 bg-primary-foreground text-primary hover:bg-primary-foreground/90">
        <CustomLink variant="unstyled" to="/register">
          Start Practicing Free
          <Icon name="arrowRight" size={15} />
        </CustomLink>
      </Button>
      <p className="mt-5 text-xs text-primary-foreground/80">
        No credit card required · Free forever tier · Cancel anytime
      </p>
    </section>
  )
}

const FOOTER_COLUMNS = [
  { title: 'Product', links: ['Problems', 'Features', 'Pricing'] },
  { title: 'Resources', links: ['Docs', 'API', 'Status', 'Changelog'] },
  { title: 'Company', links: ['About', 'Careers', 'Privacy', 'Terms'] },
]

function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-[1160px] gap-10 px-6 py-14 md:grid-cols-[1.6fr_repeat(3,1fr)]">
        <div className="flex flex-col max-w-[300px] gap-4">
          <CustomLink variant="unstyled" to="/" aria-label="CodeForge home">
            <Logo size={26} />
          </CustomLink>
          <p className="text-sm text-muted-foreground">
            The quiet, content-first practice notebook for engineers. Built for deep comprehension,
            not streak anxiety.
          </p>
          <p className="font-mono text-xs flex items-center gap-2 text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            All systems operational
          </p>
        </div>
        {FOOTER_COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title} className="flex flex-col gap-2.5">
            <p className="text-sm font-semibold text-muted-foreground">{col.title}</p>
            {col.links.map((l) => (
              <a key={l} href={`#${l.toLowerCase()}`} className="text-sm w-fit text-muted-foreground hover:text-foreground">
                {l}
              </a>
            ))}
          </nav>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-3 px-6 py-5">
          <p className="text-xs text-muted-foreground">© 2026 CodeForge Labs, Inc. · Built with care for engineers.</p>
          <div className="flex gap-5 text-muted-foreground">
            {['Terms', 'Privacy', 'Status'].map((l) => (
              <a key={l} href={`#${l.toLowerCase()}`} className="text-xs hover:text-muted-foreground">
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function Landing() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background text-foreground">
      <main>
        <Hero />
        <StatsBand />
        <Features />
        <Roadmap />
        <EngineSection />
        <SystemDesignSection />
        <Pricing />
        <Faq />
      </main>
      <Cta />
      <SiteFooter />
    </div>
  )
}
