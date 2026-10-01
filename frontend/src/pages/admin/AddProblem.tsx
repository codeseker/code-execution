import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import { Icon } from '../../components/icons'
import { Tag, cx } from '../../components/ui'
import CustomButton from '../../components/ui/CustomButton'

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
      <div className="mx-auto w-full max-w-[1180px] stack gap-5 px-4 py-6 lg:px-8">
        {/* Breadcrumb + title */}
        <div className="stack gap-1">
          <p className="t-code-tag text-ink-3">ADMIN / PROBLEMS / NEW PROBLEM</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="t-page-title text-ink">Create New Problem</h1>
              <span className="pill pill-neutral t-code-tag">
                <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
                Draft auto-saved {savedAgo}
              </span>
            </div>
            <CustomButton variant="unstyled"
              type="button"
              className="btn btn-secondary"
              // onClick={() => push({ title: 'Opening playground preview', description: 'Renders the candidate-facing view.', tone: 'neutral' })}
            >
              <Icon name="eye" size={14} />
              Preview in Playground
              <Icon name="arrowUpRight" size={13} />
            </CustomButton>
          </div>
        </div>

        {/* ---- 01 Basic information ---- */}
        <section className="card">
          <div className="flex items-center justify-between gap-4 border-b border-hair px-5 py-4">
            <div className="flex items-center gap-3.5">
              <span className="center t-code-tag h-7 w-7 rounded-md bg-accent-soft text-accent">01</span>
              <div>
                <h2 className="t-h3 text-ink">Basic Information</h2>
                <p className="t-caption text-ink-2">Core metadata, slug identifier, and algorithmic taxonomy</p>
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

          <div className="stack gap-5 p-5">
            {/* Title + slug */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <div className="flex items-baseline justify-between">
                  <label className="field-label" htmlFor="p-title">
                    Problem Title <span className="text-error">*</span>
                  </label>
                  <span className="t-code-tag -mt-4 mb-1.5 text-ink-3">{title.length} / 64 chars max</span>
                </div>
                <input
                  id="p-title"
                  className="input h-9"
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
                  <Icon name="info" size={13} className="text-ink-3" />
                </label>
                <div className="input flex h-9 items-center gap-0 overflow-hidden">
                  <span className="t-code text-ink-3">codeforge.io/p/</span>
                  <span id="p-slug" className="t-code min-w-0 grow truncate text-ink">
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
                <div className="grid grid-cols-3 overflow-hidden rounded-md border border-hair" role="radiogroup" aria-label="Difficulty tier">
                  {TIER_WEIGHTS.map((t) => (
                    <CustomButton variant="unstyled"
                      key={t.tier}
                      type="button"
                      role="radio"
                      aria-checked={tier === t.tier}
                      className={cx(
                        'stack items-center gap-0.5 px-3 py-2.5 transition-colors',
                        tier === t.tier ? 'bg-accent text-on-accent' : 'text-ink-2 hover:bg-wash',
                      )}
                      onClick={() => {
                        setTier(t.tier)
                        touch()
                      }}
                    >
                      <span className="t-code-tag font-semibold">{t.tier.toUpperCase()}</span>
                      <span className={cx('t-caption', tier === t.tier ? 'opacity-80' : 'text-ink-3')}>
                        Weight: {t.weight}
                      </span>
                    </CustomButton>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <p className="field-label">Algorithmic Topics</p>
                  <span className="t-caption -mt-4 mb-1.5 text-ink-3">Tags assist taxonomy routing</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 rounded-md border border-hair px-2.5 py-2">
                  {topics.map((t) => (
                    <Tag key={t} tone="blue" onRemove={() => { setTopics((list) => list.filter((x) => x !== t)); touch() }}>
                      {t}
                    </Tag>
                  ))}
                  {topicDraft !== null ? (
                    <input
                      autoFocus
                      className="input h-6 w-[130px] border-none px-1 text-[12px]"
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
                  <span key={c.name} className="tag tag-purple h-7 gap-2 px-2.5 text-[13px]">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'currentColor' }} aria-hidden />
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
                            <Icon name="building" size={14} className="text-ink-3" />
                            <span className="grow">{c.name}</span>
                            <span className="t-code-tag text-ink-3">{c.count}</span>
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
        <section className="card">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hair px-5 py-4">
            <div className="flex items-center gap-3.5">
              <span className="center t-code-tag h-7 w-7 rounded-md bg-accent-soft text-accent">02</span>
              <div>
                <h2 className="t-h3 text-ink">Problem Specification</h2>
                <p className="t-caption text-ink-2">Markdown prompt, constraints, and test scenarios</p>
              </div>
            </div>
            <div className="flex items-center gap-0.5 rounded-md border border-hair p-1">
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

          <div className="flex items-center justify-between gap-3 border-b border-hair bg-wash px-5 py-2">
            <span className="t-code-tag flex items-center gap-2 text-ink-2">
              <Icon name="list" size={13} />
              MARKDOWN INPUT
            </span>
            <span className="t-code-tag tnum text-ink-3">
              UTF-8 · Line {caret.line}, Col {caret.col}
            </span>
          </div>

          <textarea
            ref={mdRef}
            className="t-code block w-full resize-y bg-canvas px-5 py-4 outline-none"
            style={{ minHeight: 320, lineHeight: '22px' }}
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
        <section className="card">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hair px-5 py-4">
            <div className="flex items-center gap-3.5">
              <span className="center t-code-tag h-7 w-7 rounded-md bg-accent-soft text-accent">03</span>
              <div>
                <h2 className="t-h3 text-ink">Reference Solution</h2>
                <p className="t-caption text-ink-2">Validated against the hidden test suite before publishing</p>
              </div>
            </div>
            <span className="pill pill-success">
              <Icon name="checkCircle" size={13} />
              Auto-verified · 214 / 214 cases
            </span>
          </div>
          <div className="stack gap-3 p-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <select className="input select h-8 w-[144px] text-[13px]" aria-label="Solution language" defaultValue="Python3">
                {['Python3', 'TypeScript', 'Java', 'C++', 'Rust'].map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
              <span className="tag tag-gray t-code-tag">lca_solution.py</span>
              <span className="grow" />
              <span className="t-code-tag flex gap-3 text-ink-3">
                <span>Time O(h)</span>
                <span>Space O(n)</span>
              </span>
            </div>
            <textarea
              className="input t-code min-h-[170px] resize-y py-3"
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
              <p className="pill pill-error h-auto w-auto items-start gap-2 py-1.5 text-left" role="alert">
                <Icon name="alert" size={13} className="mt-0.5 flex-none" />
                {error}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2.5">
            <CustomButton variant="unstyled"
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                touch()
                // push({ title: 'Draft saved', description: 'Everything is stored in this session.', tone: 'neutral' })
              }}
            >
              Save Draft
            </CustomButton>
            <CustomButton variant="unstyled" type="button" className="btn btn-primary" onClick={publish}>
              Preview &amp; Publish
              <Icon name="arrowRight" size={14} />
            </CustomButton>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
