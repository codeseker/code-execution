import { Link } from 'react-router-dom'
import { Icon } from '../components/icons'
import { Logo, ThemeToggle, cx } from '../components/ui'
import { CodeWindow } from '../components/Code'
import { useToast } from '../toast'
import { ENGINE_BULLETS, FAQ, LANDING_FEATURES, LANDING_ROADMAP, LANDING_STATS, PRICING, REGISTER_SHOWCASE, SYSTEM_DESIGN_POINTS } from '../data'
import { useState } from 'react'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

const FEATURE_ICONS: Record<string, Parameters<typeof Icon>[0]['name']> = {
  visualizer: 'monitor',
  tracks: 'target',
  sandbox: 'cpu',
  recall: 'history',
  profiler: 'gauge',
  mock: 'users',
}

function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-hair bg-canvas">
      <div className="mx-auto flex h-14 max-w-[1160px] items-center gap-8 px-6">
        <Link to="/" aria-label="CodeForge home">
          <Logo size={26} />
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="t-ui-med rounded px-2.5 py-1.5 text-ink-2 transition-colors hover:bg-wash hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <span className="grow" />
        <ThemeToggle />
        <Link to="/login" className="btn btn-ghost hidden sm:inline-flex">
          Log in
        </Link>
        <Link to="/register" className="btn btn-primary">
          Start free
        </Link>
      </div>
    </header>
  )
}

function Hero() {
  const { push } = useToast()
  return (
    <section className="mx-auto grid max-w-[1160px] items-center gap-12 px-6 py-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:py-24">
      <div className="stack gap-6">
        <span className="pill pill-accent w-fit">
          <Icon name="zap" size={12} />
          v2.4 — Adaptive mock interviews are live
        </span>
        <h1 className="t-page-title text-ink">
          Master DSA.
          <br />
          Crack interviews.
        </h1>
        <p className="t-reading max-w-[520px] text-ink-2">
          Curated problems, visual company trackers, and 15-year essential drills. Real interview
          signal, distilled for your dream role.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/register" className="btn btn-primary h-10 px-5 text-[15px]">
            Start learning free
            <Icon name="arrowRight" size={15} />
          </Link>
          <button
            type="button"
            className="btn btn-secondary h-10 gap-2 px-5 text-[15px]"
            onClick={() =>
              push({ title: 'Demo reel queued', description: 'Video playback is disabled in this preview.', tone: 'neutral' })
            }
          >
            <Icon name="play" size={13} />
            Watch demo <span className="t-code-tag text-ink-3">(2:14)</span>
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-x-7 gap-y-2 pt-2 text-ink-3">
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
            <span className="tag tag-gray">
              Python <span className="t-code-tag opacity-70">3.11</span>
            </span>
            <span className="pill pill-success">
              <Icon name="checkCircle" size={12} />
              12 / 12 passed · 14ms
            </span>
          </span>
        }
        footer={
          <>
            <span className="t-code-tag flex items-center gap-2 text-ink-2">
              <Icon name="cpu" size={13} />
              {REGISTER_SHOWCASE.memory}
            </span>
            <span className="t-code-tag flex items-center gap-2 text-ink-2">
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
    <section className="border-y border-hair bg-sidebar">
      <div className="mx-auto grid max-w-[1160px] grid-cols-2 gap-y-8 px-6 py-10 md:grid-cols-4">
        {LANDING_STATS.map((s, i) => (
          <div
            key={s.label}
            className={cx('px-2 md:px-6', i > 0 && 'md:border-l md:border-hair')}
          >
            <p className="t-page-title-m tnum text-ink">{s.value}</p>
            <p className="t-ui-med mt-1 text-ink">{s.label}</p>
            <p className="t-caption text-ink-3">{s.meta}</p>
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
        <p className="t-overline text-accent">Designed for mastery</p>
        <h2 className="t-h1 mt-3 text-ink">
          Engineered for deep comprehension, not rote memorization.
        </h2>
        <p className="t-reading mt-3 text-ink-2">
          Say goodbye to pattern memorization. Build intuition with visual execution, structured
          repetition, and instant feedback on every run.
        </p>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {LANDING_FEATURES.map((f) => (
          <article key={f.title} className="card stack gap-3 p-5 transition-shadow hover:shadow-e1">
            <span className="center h-9 w-9 rounded-md bg-accent-soft text-accent">
              <Icon name={FEATURE_ICONS[f.icon] ?? 'star'} size={18} />
            </span>
            <h3 className="text-[15px] leading-5 font-semibold text-ink">{f.title}</h3>
            <p className="t-ui text-ink-2">{f.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function Roadmap() {
  return (
    <section id="how-it-works" className="border-y border-hair bg-sidebar scroll-mt-20">
      <div className="mx-auto max-w-[1160px] px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-[640px]">
            <p className="t-overline text-accent">The roadmap</p>
            <h2 className="t-h1 mt-3 text-ink">
              An expert roadmap from array two-pointers to dynamic programming.
            </h2>
          </div>
          <Link to="/register" className="link t-ui-med inline-flex items-center gap-1.5">
            View full curriculum
            <Icon name="arrowRight" size={14} />
          </Link>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {LANDING_ROADMAP.map((r) => (
            <article key={r.step} className="card stack gap-3 p-5">
              <div className="flex items-center justify-between">
                <span className="t-code-tag text-ink-3">{r.step}</span>
                <span className="tag tag-blue">{r.phase}</span>
              </div>
              <h3 className="text-[17px] leading-6 font-semibold text-ink">{r.title}</h3>
              <p className="t-ui text-ink-2">{r.text}</p>
              <Link
                to="/register"
                className="t-ui-med mt-1 inline-flex items-center gap-1.5 text-accent hover:underline"
              >
                Start chapter
                <Icon name="arrowRight" size={13} />
              </Link>
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
        headerRight={<span className="tag tag-gray">Profiler</span>}
        footer={
          <>
            <span className="t-code-tag flex items-center gap-2 text-ink-2">
              <Icon name="activity" size={13} />
              Per-line cost: O(n) · 4.1M ops/s
            </span>
            <span className="t-code-tag text-success">Beats 97.3% of submissions</span>
          </>
        }
      />
      <div className="stack gap-5">
        <div className="stack gap-3">
          <p className="t-overline text-accent">Core engine</p>
          <h2 className="t-h1 text-ink">Dynamic Big-O Execution Engine</h2>
          <p className="t-reading text-ink-2">
            Type-safety is not enough — know exactly why your code is slow. Per-line complexity,
            memory heatmaps, and worst-case synthesis run on every submission.
          </p>
        </div>
        <ul className="stack gap-3">
          {ENGINE_BULLETS.map((b) => (
            <li key={b} className="flex items-start gap-3 t-ui text-ink-2">
              <span className="center mt-0.5 h-5 w-5 flex-none rounded-full bg-accent-soft text-accent">
                <Icon name="check" size={12} strokeWidth={2.4} />
              </span>
              {b}
            </li>
          ))}
        </ul>
        <Link to="/register" className="btn btn-secondary w-fit gap-2">
          See the profiler
          <Icon name="arrowRight" size={14} />
        </Link>
      </div>
    </section>
  )
}

const RELIABILITY_LOG = [
  { t: '10:22:41', src: 'cluster.raft', msg: 'leader elected: node-04 (eu-central)', tone: 'text-success' },
  { t: '10:22:41', src: 'shard.router', msg: 'rebalanced 128 ranges · 0 downtime', tone: 'text-ink-2' },
  { t: '10:22:42', src: 'cache.redis', msg: 'hit ratio 98.4% (window 5m)', tone: 'text-ink-2' },
  { t: '10:22:44', src: 'queue.kafka', msg: 'lag 0 msgs · consumer group healthy', tone: 'text-success' },
  { t: '10:22:45', src: 'audit.writer', msg: 'checkpoint committed @ LSN 9f21', tone: 'text-ink-2' },
  { t: '10:22:47', src: 'health.probe', msg: 'all 48 replicas OK', tone: 'text-success' },
]

function SystemDesignSection() {
  return (
    <section className="border-y border-hair bg-sidebar">
      <div className="mx-auto grid max-w-[1160px] items-center gap-12 px-6 py-20 lg:grid-cols-2">
        <div className="stack gap-5">
          <div className="stack gap-3">
            <p className="t-overline text-accent">System design</p>
            <h2 className="t-h1 text-ink">Curated System Design &amp; Concurrency Challenges</h2>
            <p className="t-reading text-ink-2">
              Whiteboard-less design practice: reason about trade-offs, then prove them by writing
              the concurrency primitives that keep them honest.
            </p>
          </div>
          <ul className="stack gap-3">
            {SYSTEM_DESIGN_POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3 t-ui text-ink-2">
                <Icon name="gitBranch" size={15} className="mt-0.5 flex-none text-accent" />
                {p}
              </li>
            ))}
          </ul>
          <Link to="/register" className="btn btn-secondary w-fit gap-2">
            Explore design tracks
            <Icon name="arrowRight" size={14} />
          </Link>
        </div>

        <div className="code-window">
          <div className="flex h-9 items-center gap-3 border-b border-hair px-3">
            <span className="flex gap-1.5" aria-hidden>
              <span className="traffic bg-[#FF5F57]" />
              <span className="traffic bg-[#FEBC2E]" />
              <span className="traffic bg-[#28C840]" />
            </span>
            <span className="tag tag-gray font-mono text-[11px]">system_reliability.log</span>
            <span className="grow" />
            <span className="t-code-tag hidden text-ink-3 sm:inline">Live tail · 10Hz</span>
          </div>
          <div className="stack gap-1.5 p-4 font-mono text-[12.5px] leading-5">
            {RELIABILITY_LOG.map((l) => (
              <div key={l.t + l.src} className="flex gap-3 whitespace-nowrap">
                <span className="text-ink-4">[{l.t}]</span>
                <span className="text-accent">{l.src}</span>
                <span className={cx('truncate', l.tone)}>→ {l.msg}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-hair px-4 py-2.5">
            <span className="t-code-tag mr-1 text-ink-3">NODE DISTRIBUTION (RAFT)</span>
            {['Frankfurt', 'Oregon', 'Singapore'].map((n) => (
              <span key={n} className="tag tag-gray">
                <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
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
  const { push } = useToast()
  return (
    <section id="pricing" className="mx-auto max-w-[1160px] scroll-mt-20 px-6 py-20">
      <div className="mx-auto max-w-[680px] text-center">
        <p className="t-overline text-accent">Pricing</p>
        <h2 className="t-h1 mt-3 text-ink">Transparent pricing for ambitious developers.</h2>
        <p className="t-reading mt-3 text-ink-2">
          Start for free, level up when you are ready. Cancel anytime — your progress stays yours.
        </p>
      </div>
      <div className="mt-12 grid items-start gap-4 md:grid-cols-3">
        {PRICING.map((plan) => (
          <article
            key={plan.name}
            className={cx(
              'card relative stack gap-5 p-6',
              plan.featured && 'border-accent shadow-e1',
            )}
          >
            {plan.featured && (
              <span className="pill pill-accent absolute -top-3 left-6">
                <Icon name="star" size={11} />
                Most popular
              </span>
            )}
            <div className="stack gap-1.5">
              <h3 className="text-[16px] font-semibold text-ink">{plan.name}</h3>
              <p className="t-caption text-ink-2">{plan.tagline}</p>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="t-page-title tnum text-ink">{plan.price}</span>
              <span className="t-ui text-ink-3">{plan.period}</span>
            </div>
            <button
              type="button"
              className={cx('btn btn-block', plan.featured ? 'btn-primary' : 'btn-secondary')}
              onClick={() =>
                plan.name === 'Teams & Bootcamps'
                  ? push({ title: 'Sales will reach out shortly', description: 'Enterprise plans are demo-only in this build.', tone: 'neutral' })
                  : undefined
              }
            >
              {plan.cta}
            </button>
            <ul className="stack gap-2.5 border-t border-hair pt-5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 t-ui text-ink-2">
                  <Icon
                    name="check"
                    size={14}
                    className={cx('mt-0.5 flex-none', plan.featured ? 'text-accent' : 'text-success')}
                    strokeWidth={2.2}
                  />
                  {f}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <p className="t-caption mt-6 text-center text-ink-3">
        All plans include the free tier forever. Prices in USD, billed monthly.
      </p>
    </section>
  )
}

function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="faq" className="border-t border-hair bg-sidebar scroll-mt-20">
      <div className="mx-auto max-w-[720px] px-6 py-20">
        <div className="text-center">
          <p className="t-overline text-accent">FAQ</p>
          <h2 className="t-h1 mt-3 text-ink">Frequently Asked Questions</h2>
          <p className="t-reading mt-3 text-ink-2">
            Everything you need to know about the CodeForge practice platform.
          </p>
        </div>
        <div className="mt-10">
          {FAQ.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={item.q} className="border-b border-hair">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 py-4 text-left"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span className="t-ui-med text-ink">{item.q}</span>
                  <Icon
                    name="chevronDown"
                    size={16}
                    className={cx(
                      'flex-none text-ink-3 transition-transform duration-150',
                      isOpen && 'rotate-180',
                    )}
                  />
                </button>
                {isOpen && (
                  <p className="t-ui anim-fade -mt-1 max-w-[660px] pb-4 text-ink-2">{item.a}</p>
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
    <section className="bg-accent px-6 py-16 text-center">
      <h2 className="t-h1 mx-auto max-w-[640px] text-on-accent">
        Ready to land your dream engineering role?
      </h2>
      <p className="t-reading mx-auto mt-3 max-w-[560px] opacity-90" style={{ color: 'var(--on-accent)' }}>
        Join 10,000+ candidates practicing smarter with adaptive feedback — every problem, every day.
      </p>
      <Link
        to="/register"
        className="btn mx-auto mt-7 inline-flex h-10 px-6 text-[15px]"
        style={{ background: 'var(--on-accent)', color: 'var(--accent)' }}
      >
        Start Practicing Free
        <Icon name="arrowRight" size={15} />
      </Link>
      <p className="t-caption mt-5 opacity-80" style={{ color: 'var(--on-accent)' }}>
        No credit card required · Free forever tier · Cancel anytime
      </p>
    </section>
  )
}

const FOOTER_COLUMNS = [
  { title: 'Product', links: ['Problems', 'Tracks', 'Contests', 'Editorials'] },
  { title: 'Resources', links: ['Docs', 'API', 'Status', 'Changelog'] },
  { title: 'Company', links: ['About', 'Careers', 'Privacy', 'Terms'] },
]

function SiteFooter() {
  return (
    <footer className="border-t border-hair bg-canvas">
      <div className="mx-auto grid max-w-[1160px] gap-10 px-6 py-14 md:grid-cols-[1.6fr_repeat(3,1fr)]">
        <div className="stack max-w-[300px] gap-4">
          <Link to="/" aria-label="CodeForge home">
            <Logo size={26} />
          </Link>
          <p className="t-ui text-ink-2">
            The quiet, content-first practice notebook for engineers. Built for deep comprehension,
            not streak anxiety.
          </p>
          <p className="t-code-tag flex items-center gap-2 text-ink-3">
            <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
            All systems operational
          </p>
        </div>
        {FOOTER_COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title} className="stack gap-2.5">
            <p className="t-overline text-ink-3">{col.title}</p>
            {col.links.map((l) => (
              <a key={l} href={`#${l.toLowerCase()}`} className="t-ui w-fit text-ink-2 hover:text-ink">
                {l}
              </a>
            ))}
          </nav>
        ))}
      </div>
      <div className="border-t border-hair">
        <div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-3 px-6 py-5">
          <p className="t-caption text-ink-3">© 2026 CodeForge Labs, Inc. · Built with care for engineers.</p>
          <div className="flex gap-5 text-ink-3">
            {['Terms', 'Privacy', 'Status'].map((l) => (
              <a key={l} href={`#${l.toLowerCase()}`} className="t-caption hover:text-ink-2">
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
    <div className="min-h-screen bg-canvas text-ink">
      <SiteNav />
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
