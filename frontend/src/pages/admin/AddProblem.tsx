import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import { Icon } from '../../components/icons'
import { Tag, cx } from '../../components/ui'
import CustomButton from '../../components/CustomButton'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Textarea } from '../../components/ui/textarea'

const DEFAULT_TITLE = 'Lowest Common Ancestor of a Binary Search Tree'

const DEFAULT_MARKDOWN = `Given a binary search tree (BST), find the lowest common ancestor (LCA) node of two given nodes in the BST.

According to the definition of LCA on Wikipedia: "The lowest common ancestor is defined between two nodes 'p' and 'q' as the lowest node in 'T' that has both 'p' and 'q' as descendants (where we allow a node to be a descendant of itself)."

### Example 1
Input: root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 8
Output: 6

### Constraints
- The number of nodes in the tree is in the range [2, 10^4].
- -10^9 <= Node.val <= 10^9
- All Node.val are unique.
- p != q
- p and q will exist in the BST.`

const TIER_WEIGHTS = [
  { tier: 'Easy', weight: '1.0' },
  { tier: 'Medium', weight: '2.2' },
  { tier: 'Hard', weight: '4.5' },
] as const

const COMPANY_POOL = [
  { name: 'Meta', count: 78 },
  { name: 'Amazon', count: 62 },
  { name: 'Microsoft', count: 45 },
  { name: 'Google', count: 91 },
  { name: 'Apple', count: 58 },
  { name: 'Adobe', count: 26 },
]

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

export default function AddProblem() {
  const navigate = useNavigate()
  

  const [title, setTitle] = useState(DEFAULT_TITLE)
  const [tier, setTier] = useState<'Easy' | 'Medium' | 'Hard'>('Medium')
  const [topics, setTopics] = useState(['Trees', 'Binary Search Tree', 'Depth-First Search'])
  const [companies, setCompanies] = useState([
    { name: 'Meta', count: 78 },
    { name: 'Amazon', count: 62 },
    { name: 'Microsoft', count: 45 },
  ])
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN)
  const [caret, setCaret] = useState({ line: 1, col: 1 })
  const [savedAgo, setSavedAgo] = useState('2m ago')
  const [error, setError] = useState('')

  const [topicDraft, setTopicDraft] = useState<string | null>(null)
  const [companyOpen, setCompanyOpen] = useState(false)
  const mdRef = useRef<HTMLTextAreaElement>(null)

  // Fake draft autosave heartbeat.
  useEffect(() => {
    const t = window.setInterval(() => setSavedAgo((v) => (v === 'just now' ? '1m ago' : 'just now')), 45_000)
    return () => window.clearInterval(t)
  }, [])

  const touch = () => setSavedAgo('just now')
  const slug = slugify(title)
  const availableCompanies = COMPANY_POOL.filter((c) => !companies.some((x) => x.name === c.name))

  const trackCaret = () => {
    const el = mdRef.current
    if (!el) return
    const upto = el.value.slice(0, el.selectionStart)
    const lines = upto.split('\n')
    setCaret({ line: lines.length, col: lines[lines.length - 1].length + 1 })
  }

  const insertAtCaret = (snippet: string) => {
    const el = mdRef.current
    if (!el) return
    const start = el.selectionStart
    const next = markdown.slice(0, start) + snippet + markdown.slice(el.selectionEnd)
    setMarkdown(next)
    touch()
    window.requestAnimationFrame(() => {
      el.focus()
      el.selectionStart = el.selectionEnd = start + snippet.length
      trackCaret()
    })
  }

  const publish = () => {
    if (!title.trim()) return setError('A problem title is required.')
    if (markdown.trim().length < 40) return setError('The prompt needs at least a few sentences before publishing.')
    setError('')
    // push({ title: 'Problem published', description: `“${title}” is live in the catalog.`, tone: 'success' })
    navigate('/admin/problems')
  }

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-[1180px] flex flex-col gap-5 px-4 py-6 lg:px-8">
        {/* Breadcrumb + title */}
        <div className="flex flex-col gap-1">
          <p className="font-mono text-xs text-muted-foreground">ADMIN / PROBLEMS / NEW PROBLEM</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Create New Problem</h1>
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium bg-muted text-muted-foreground font-mono text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                Draft auto-saved {savedAgo}
              </span>
            </div>
            <Button variant="outline"
              type="button"
              // onClick={() => push({ title: 'Opening playground preview', description: 'Renders the candidate-facing view.', tone: 'neutral' })}
            >
              <Icon name="eye" size={14} />
              Preview in Playground
              <Icon name="arrowUpRight" size={13} />
            </Button>
          </div>
        </div>

        {/* ---- 01 Basic information ---- */}
        <section className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
            <div className="flex items-center gap-3.5">
              <span className="center font-mono text-xs h-7 w-7 rounded-md bg-primary/10 text-primary">01</span>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>
                <p className="text-xs text-muted-foreground">Core metadata, slug identifier, and algorithmic taxonomy</p>
              </div>
            </div>
            <CustomButton variant="unstyled"
              type="button"
              className="icon-btn"
              aria-label="Field settings"
              // onClick={() => push({ title: 'Schema settings', description: 'Field visibility rules are demo-only.', tone: 'neutral' })}
            >
              <Icon name="sliders" size={16} />
            </CustomButton>
          </div>

          <div className="flex flex-col gap-5 p-5">
            {/* Title + slug */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <div className="flex items-baseline justify-between">
                  <label className="field-label" htmlFor="p-title">
                    Problem Title <span className="text-destructive">*</span>
                  </label>
                  <span className="font-mono text-xs -mt-4 mb-1.5 text-muted-foreground">{title.length} / 64 chars max</span>
                </div>
                <Input
                  id="p-title"
                  className="h-9"
                  maxLength={64}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    touch()
                    setError('')
                  }}
                />
              </div>
              <div>
                <label className="field-label flex items-center gap-1.5" htmlFor="p-slug">
                  Canonical Slug
                  <Icon name="info" size={13} className="text-muted-foreground" />
                </label>
                <div className="input flex h-9 items-center gap-0 overflow-hidden">
                  <span className="font-mono text-sm text-muted-foreground">codeforge.io/p/</span>
                  <span id="p-slug" className="font-mono text-sm min-w-0 grow truncate text-foreground">
                    {slug || '…'}
                  </span>
                  <CustomButton variant="unstyled"
                    type="button"
                    className="icon-btn h-6 w-6 flex-none"
                    aria-label="Copy slug"
                    onClick={() => {
                      navigator.clipboard?.writeText(`codeforge.io/p/${slug}`).catch(() => undefined)
                      // push({ title: 'Slug copied', tone: 'success' })
                    }}
                  >
                    <Icon name="copy" size={13} />
                  </CustomButton>
                </div>
              </div>
            </div>

            {/* Tier + topics */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <p className="field-label">Difficulty Tier</p>
                <div className="grid grid-cols-3 overflow-hidden rounded-md border border-border" role="radiogroup" aria-label="Difficulty tier">
                  {TIER_WEIGHTS.map((t) => (
                    <CustomButton variant="unstyled"
                      key={t.tier}
                      type="button"
                      role="radio"
                      aria-checked={tier === t.tier}
                      className={cx(
                        'flex flex-col items-center gap-0.5 px-3 py-2.5 transition-colors',
                        tier === t.tier ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/40',
                      )}
                      onClick={() => {
                        setTier(t.tier)
                        touch()
                      }}
                    >
                      <span className="font-mono text-xs font-semibold">{t.tier.toUpperCase()}</span>
                      <span className={cx('text-xs', tier === t.tier ? 'opacity-80' : 'text-muted-foreground')}>
                        Weight: {t.weight}
                      </span>
                    </CustomButton>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <p className="field-label">Algorithmic Topics</p>
                  <span className="text-xs -mt-4 mb-1.5 text-muted-foreground">Tags assist taxonomy routing</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 rounded-md border border-border px-2.5 py-2">
                  {topics.map((t) => (
                    <Tag key={t} tone="blue" onRemove={() => { setTopics((list) => list.filter((x) => x !== t)); touch() }}>
                      {t}
                    </Tag>
                  ))}
                  {topicDraft !== null ? (
                    <Input
                      autoFocus
                      className="h-6 w-[130px] border-none px-1 text-xs shadow-none focus-visible:ring-0"
                      placeholder="Tag name…"
                      value={topicDraft}
                      onChange={(e) => setTopicDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && topicDraft.trim()) {
                          setTopics((list) => [...list, topicDraft.trim()])
                          setTopicDraft(null)
                          touch()
                        }
                        if (e.key === 'Escape') setTopicDraft(null)
                      }}
                      onBlur={() => setTopicDraft(null)}
                      aria-label="New topic tag"
                    />
                  ) : (
                    <CustomButton variant="unstyled"
                      type="button"
                      className="btn btn-ghost btn-sm h-6 px-1.5 text-[12px]"
                      onClick={() => setTopicDraft('')}
                    >
                      <Icon name="plus" size={12} />
                      Add Tag
                    </CustomButton>
                  )}
                </div>
              </div>
            </div>

            {/* Companies */}
            <div>
              <p className="field-label">Target Industry Companies</p>
              <div className="flex flex-wrap items-center gap-2.5">
                {companies.map((c) => (
                  <span key={c.name} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-0.5 text-xs text-secondary-foreground h-7 gap-2 px-2.5 text-[13px]">
                    <span className="size-1.5 rounded-full bg-current" aria-hidden />
                    {c.name} ({c.count} appearances)
                    <CustomButton variant="unstyled"
                      type="button"
                      className="rounded-sm opacity-60 hover:opacity-100"
                      aria-label={`Remove ${c.name}`}
                      onClick={() => { setCompanies((list) => list.filter((x) => x.name !== c.name)); touch() }}
                    >
                      <Icon name="x" size={11} strokeWidth={2.4} />
                    </CustomButton>
                  </span>
                ))}
                <div className="relative">
                  <CustomButton variant="unstyled"
                    type="button"
                    className="btn btn-secondary btn-sm h-7"
                    aria-expanded={companyOpen}
                    onClick={() => setCompanyOpen((v) => !v)}
                    disabled={!availableCompanies.length}
                  >
                    <Icon name="plus" size={13} />
                    Select Company
                  </CustomButton>
                  {companyOpen && (
                    <>
                      <CustomButton variant="unstyled"
                        type="button"
                        className="fixed inset-0 z-40 cursor-default"
                        aria-label="Close company picker"
                        onClick={() => setCompanyOpen(false)}
                      />
                      <div className="popover absolute top-full left-0 z-50 mt-1.5 w-[230px] anim-fade-up">
                        {availableCompanies.map((c) => (
                          <CustomButton variant="unstyled"
                            key={c.name}
                            type="button"
                            className="menu-item"
                            onClick={() => {
                              setCompanies((list) => [...list, c])
                              setCompanyOpen(false)
                              touch()
                            }}
                          >
                            <Icon name="building" size={14} className="text-muted-foreground" />
                            <span className="grow">{c.name}</span>
                            <span className="font-mono text-xs text-muted-foreground">{c.count}</span>
                          </CustomButton>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ---- 02 Problem specification ---- */}
        <section className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4">
            <div className="flex items-center gap-3.5">
              <span className="center font-mono text-xs h-7 w-7 rounded-md bg-primary/10 text-primary">02</span>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Problem Specification</h2>
                <p className="text-xs text-muted-foreground">Markdown prompt, constraints, and test scenarios</p>
              </div>
            </div>
            <div className="flex items-center gap-0.5 rounded-md border border-border p-1">
              {(
                [
                  { icon: 'bold', label: 'Bold', snippet: '**bold**' },
                  { icon: 'italic', label: 'Italic', snippet: '_italic_' },
                  { icon: 'codeXml', label: 'Inline code', snippet: '`code`' },
                  { icon: 'sigma', label: 'Complexity', snippet: '`O(n)`' },
                ] as const
              ).map((b) => (
                <CustomButton variant="unstyled"
                  key={b.icon}
                  type="button"
                  className="icon-btn h-7 w-7"
                  aria-label={b.label}
                  title={b.label}
                  onClick={() => insertAtCaret(b.snippet)}
                >
                  <Icon name={b.icon} size={14} />
                </CustomButton>
              ))}
              <span className="mx-1 h-4 w-px bg-hair" aria-hidden />
              {(
                [
                  { icon: 'list', label: 'Bullet list', snippet: '\n- ' },
                  { icon: 'listOrdered', label: 'Numbered list', snippet: '\n1. ' },
                  { icon: 'table', label: 'Table', snippet: '\n| Case | Input |\n| --- | --- |\n| 1 |  |' },
                  { icon: 'image', label: 'Image', snippet: '\n![diagram](https://…/lca.png)\n' },
                ] as const
              ).map((b) => (
                <CustomButton variant="unstyled"
                  key={b.icon}
                  type="button"
                  className="icon-btn h-7 w-7"
                  aria-label={b.label}
                  title={b.label}
                  onClick={() => insertAtCaret(b.snippet)}
                >
                  <Icon name={b.icon} size={14} />
                </CustomButton>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-5 py-2">
            <span className="font-mono text-xs flex items-center gap-2 text-muted-foreground">
              <Icon name="list" size={13} />
              MARKDOWN INPUT
            </span>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              UTF-8 · Line {caret.line}, Col {caret.col}
            </span>
          </div>

          <Textarea
            ref={mdRef}
            className="block min-h-[320px] w-full resize-y rounded-none border-0 bg-background px-5 py-4 font-mono text-sm leading-[22px] shadow-none focus-visible:ring-0"
            aria-label="Problem prompt in markdown"
            value={markdown}
            spellCheck={false}
            onChange={(e) => {
              setMarkdown(e.target.value)
              touch()
            }}
            onKeyUp={trackCaret}
            onClick={trackCaret}
            onSelect={trackCaret}
          />
        </section>

        {/* ---- 03 Reference solution ---- */}
        <section className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4">
            <div className="flex items-center gap-3.5">
              <span className="center font-mono text-xs h-7 w-7 rounded-md bg-primary/10 text-primary">03</span>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Reference Solution</h2>
                <p className="text-xs text-muted-foreground">Validated against the hidden test suite before publishing</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium bg-primary/10 text-primary">
              <Icon name="checkCircle" size={13} />
              Auto-verified · 214 / 214 cases
            </span>
          </div>
          <div className="flex flex-col gap-3 p-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <Select defaultValue="Python3">
                <SelectTrigger className="h-8 w-[144px] text-[13px]" aria-label="Solution language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['Python3', 'TypeScript', 'Java', 'C++', 'Rust'].map((language) => (
                    <SelectItem key={language} value={language}>{language}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-0.5 text-xs text-secondary-foreground font-mono text-xs">lca_solution.py</span>
              <span className="grow" />
              <span className="font-mono text-xs flex gap-3 text-muted-foreground">
                <span>Time O(h)</span>
                <span>Space O(n)</span>
              </span>
            </div>
            <Textarea
              className="min-h-[170px] resize-y py-3 font-mono"
              spellCheck={false}
              aria-label="Reference solution code"
              defaultValue={`class Solution:
    def lowestCommonAncestor(self, root: 'TreeNode', p: 'TreeNode', q: 'TreeNode') -> 'TreeNode':
        if root is None:
            return None
        if p.val < root.val and q.val < root.val:
            return self.lowestCommonAncestor(root.left, p, q)
        if p.val > root.val and q.val > root.val:
            return self.lowestCommonAncestor(root.right, p, q)
        return root`}
            />
          </div>
        </section>

        {/* ---- Actions ---- */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <div className="min-w-0">
            {error && (
              <p className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium bg-destructive/10 text-destructive h-auto w-auto items-start gap-2 py-1.5 text-left" role="alert">
                <Icon name="alert" size={13} className="mt-0.5 flex-none" />
                {error}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button variant="outline"
              type="button"
              onClick={() => {
                touch()
                // push({ title: 'Draft saved', description: 'Everything is stored in this session.', tone: 'neutral' })
              }}
            >
              Save Draft
            </Button>
            <Button type="button" onClick={publish}>
              Preview &amp; Publish
              <Icon name="arrowRight" size={14} />
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
