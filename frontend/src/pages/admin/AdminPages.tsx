import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import AdminLayout from './AdminLayout'
import { Icon } from '../../components/icons'
import { DifficultyBadge, EmptyState, Tag, cx } from '../../components/ui'
import { ADMIN_SUBMISSIONS, ADMIN_USERS, PROBLEMS } from '../../data'
import type { AdminUser, SubmissionStatus } from '../../data'
import CustomButton from '../../components/ui/CustomButton'
import CustomLink from '../../components/ui/CustomLink'

function PageHead({
  crumbs,
  title,
  meta,
  actions,
}: {
  crumbs: string
  title: string
  meta?: string
  actions?: ReactNode
}) {
  return (
    <div className="stack gap-1">
      <p className="t-code-tag text-ink-3">{crumbs}</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="t-page-title text-ink">{title}</h1>
          {meta && <span className="tag tag-gray t-code-tag">{meta}</span>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
      </div>
    </div>
  )
}

function statusTone(status: SubmissionStatus) {
  if (status === 'Accepted') return 'pill-success'
  if (status === 'Time Limit Exceeded') return 'pill-warning'
  return 'pill-error'
}

/* ================================================================== */
/* Admin · Problems                                                    */
/* ================================================================== */

type CatalogStatus = 'Live' | 'Draft' | 'Archived'

export function AdminProblems() {
  
  const [query, setQuery] = useState('')
  const [difficulty, setDifficulty] = useState('All')
  const [overrides, setOverrides] = useState<Record<string, CatalogStatus>>({})

  const statusOf = (id: string, index: number): CatalogStatus =>
    overrides[id] ?? (index < 9 ? 'Live' : 'Draft')

  const rows = useMemo(
    () =>
      PROBLEMS.filter(
        (p) =>
          (difficulty === 'All' || p.difficulty === difficulty) &&
          (!query.trim() ||
            p.title.toLowerCase().includes(query.toLowerCase()) ||
            String(p.num).includes(query)),
      ),
    [query, difficulty],
  )

  const cycle = (id: string, current: CatalogStatus) => {
    const order: CatalogStatus[] = ['Live', 'Draft', 'Archived']
    const next = order[(order.indexOf(current) + 1) % order.length]
    setOverrides((o) => ({ ...o, [id]: next }))
    // push({ title: `Problem set to ${next}`, tone: next === 'Archived' ? 'neutral' : 'success' })
  }

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-[1440px] stack gap-5 px-4 py-6 lg:px-8">
        <PageHead
          crumbs="ADMIN / PROBLEMS"
          title="Problem Catalog"
          meta={`${PROBLEMS.length} problems`}
          actions={
            <>
              <CustomButton variant="unstyled"
                type="button"
                className="btn btn-secondary"
                // onClick={() => push({ title: 'Import queued', description: 'CSV importer is demo-only in this build.', tone: 'neutral' })}
              >
                <Icon name="upload" size={14} />
                Import CSV
              </CustomButton>
              <CustomLink variant="unstyled" to="/admin/problems/new" className="btn btn-primary">
                <Icon name="plus" size={14} />
                New Problem
              </CustomLink>
            </>
          }
        />

        <div className="flex flex-wrap items-center gap-2.5 rounded-lg border border-hair bg-panel px-3 py-2.5">
          <div className="relative min-w-[220px] grow">
            <Icon name="search" size={14} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-3" />
            <input
              className="input h-8 pl-8"
              placeholder="Search title or number…"
              aria-label="Search catalog"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            className="input select h-8 w-[136px] text-[13px]"
            aria-label="Difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            {['All', 'Easy', 'Medium', 'Hard'].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>

        <section className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="ntable">
              <thead>
                <tr>
                  <th className="pl-5">#</th>
                  <th>Title</th>
                  <th>Difficulty</th>
                  <th className="hidden lg:table-cell">Topics</th>
                  <th className="hidden md:table-cell">Acceptance</th>
                  <th>Status</th>
                  <th className="pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const idx = PROBLEMS.findIndex((x) => x.id === p.id)
                  const status = statusOf(p.id, idx)
                  return (
                    <tr key={p.id}>
                      <td className="t-code-tag pl-5 text-ink-3">{p.num}</td>
                      <td>
                        <CustomLink to={`/problems/${p.id}`} className="t-ui-med text-ink hover:text-accent">
                          {p.title}
                        </CustomLink>
                      </td>
                      <td>
                        <DifficultyBadge difficulty={p.difficulty} />
                      </td>
                      <td className="hidden lg:table-cell">
                        <span className="flex flex-wrap gap-1.5">
                          {p.tags.slice(0, 2).map((t) => (
                            <Tag key={t} tone={p.topicTone[t] ?? 'gray'}>
                              {t}
                            </Tag>
                          ))}
                        </span>
                      </td>
                      <td className="t-ui tnum hidden text-ink-2 md:table-cell">{p.acceptance.toFixed(1)}%</td>
                      <td>
                        <CustomButton variant="unstyled"
                          type="button"
                          className={cx(
                            'pill',
                            status === 'Live' ? 'pill-success' : status === 'Draft' ? 'pill-warning' : 'pill-error',
                          )}
                          title="Click to cycle status"
                          onClick={() => cycle(p.id, status)}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                          {status}
                        </CustomButton>
                      </td>
                      <td className="pr-5 text-right">
                        <span className="flex justify-end gap-1">
                          <CustomLink variant="unstyled"
                            to="/admin/problems/new"
                            className="icon-btn tip"
                            data-tip="Edit"
                            aria-label={`Edit ${p.title}`}
                          >
                            <Icon name="pencil" size={15} />
                          </CustomLink>
                          <CustomButton variant="unstyled"
                            type="button"
                            className="icon-btn tip"
                            data-tip="Archive"
                            aria-label={`Archive ${p.title}`}
                            onClick={() => {
                              setOverrides((o) => ({ ...o, [p.id]: 'Archived' }))
                              // push({ title: 'Problem archived', description: p.title, tone: 'neutral' })
                            }}
                          >
                            <Icon name="folder" size={15} />
                          </CustomButton>
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState icon="search" title="No problems found" hint="Try a different keyword or difficulty." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminLayout>
  )
}

/* ================================================================== */
/* Admin · Users                                                       */
/* ================================================================== */

export function AdminUsers() {
  
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('All roles')
  const [state, setState] = useState<Record<string, AdminUser['status']>>({})

  const rows = ADMIN_USERS.filter(
    (u) =>
      (role === 'All roles' || u.role === role) &&
      (!query.trim() ||
        u.handle.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase())),
  )

  const statusOf = (u: AdminUser) => state[u.handle] ?? u.status

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-[1440px] stack gap-5 px-4 py-6 lg:px-8">
        <PageHead
          crumbs="ADMIN / USERS"
          title="User Management"
          meta={`${ADMIN_USERS.length} accounts`}
          actions={
            <CustomButton variant="unstyled"
              type="button"
              className="btn btn-primary"
              // onClick={() => push({ title: 'Invite sent', description: 'A magic link was emailed to the invitee.', tone: 'success' })}
            >
              <Icon name="plus" size={14} />
              Invite user
            </CustomButton>
          }
        />

        <div className="flex flex-wrap items-center gap-2.5 rounded-lg border border-hair bg-panel px-3 py-2.5">
          <div className="relative min-w-[220px] grow">
            <Icon name="search" size={14} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-3" />
            <input
              className="input h-8 pl-8"
              placeholder="Search handle or email…"
              aria-label="Search users"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            className="input select h-8 w-[140px] text-[13px]"
            aria-label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {['All roles', 'Member', 'Moderator', 'Admin'].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>

        <section className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="ntable">
              <thead>
                <tr>
                  <th className="pl-5">User</th>
                  <th>Role</th>
                  <th className="hidden md:table-cell">Solved</th>
                  <th className="hidden md:table-cell">Submissions</th>
                  <th className="hidden lg:table-cell">Joined</th>
                  <th>Status</th>
                  <th className="pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => {
                  const status = statusOf(u)
                  return (
                    <tr key={u.handle}>
                      <td className="pl-5">
                        <span className="flex items-center gap-3">
                          <span className="center h-7 w-7 flex-none rounded-full bg-accent-soft text-[11px] font-semibold text-accent">
                            {u.initials}
                          </span>
                          <span className="stack">
                            <span className="t-ui-med text-ink">{u.handle}</span>
                            <span className="t-caption text-ink-3">{u.email}</span>
                          </span>
                        </span>
                      </td>
                      <td>
                        <Tag tone={u.role === 'Admin' ? 'purple' : u.role === 'Moderator' ? 'blue' : 'gray'}>
                          {u.role}
                        </Tag>
                      </td>
                      <td className="t-ui tnum hidden text-ink-2 md:table-cell">{u.problemsSolved}</td>
                      <td className="t-ui tnum hidden text-ink-2 md:table-cell">{u.submissions.toLocaleString()}</td>
                      <td className="t-caption hidden text-ink-3 lg:table-cell">{u.joined}</td>
                      <td>
                        <span
                          className={cx(
                            'pill',
                            status === 'Active' ? 'pill-success' : status === 'Idle' ? 'pill-neutral' : 'pill-error',
                          )}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="pr-5 text-right">
                        <CustomButton variant="unstyled"
                          type="button"
                          className={cx('btn btn-sm h-7', status === 'Suspended' ? 'btn-secondary' : 'btn-destructive')}
                          onClick={() => {
                            const next: AdminUser['status'] = status === 'Suspended' ? 'Active' : 'Suspended'
                            setState((s) => ({ ...s, [u.handle]: next }))
                            // push({
                            //   title: next === 'Suspended' ? `${u.handle} suspended` : `${u.handle} restored`,
                            //   tone: next === 'Suspended' ? 'error' : 'success',
                            // })
                          }}
                        >
                          {status === 'Suspended' ? 'Restore' : 'Suspend'}
                        </CustomButton>
                      </td>
                    </tr>
                  )
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState icon="users" title="No users found" hint="Adjust the search or role filter." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminLayout>
  )
}

/* ================================================================== */
/* Admin · Submissions                                                 */
/* ================================================================== */

export function AdminSubmissions() {
  
  const [status, setStatus] = useState('All statuses')
  const [language, setLanguage] = useState('All languages')

  const languages = ['All languages', ...Array.from(new Set(ADMIN_SUBMISSIONS.map((s) => s.language)))]
  const rows = ADMIN_SUBMISSIONS.filter(
    (s) =>
      (status === 'All statuses' || s.status === status) &&
      (language === 'All languages' || s.language === language),
  )

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-[1440px] stack gap-5 px-4 py-6 lg:px-8">
        <PageHead
          crumbs="ADMIN / SUBMISSIONS"
          title="Submission Stream"
          meta="1,842,910 total"
          actions={
            <CustomButton variant="unstyled"
              type="button"
              className="btn btn-secondary"
              // onClick={() => push({ title: 'Stream paused', description: 'Live updates are frozen for this view.', tone: 'neutral' })}
            >
              <Icon name="history" size={14} />
              Pause stream
            </CustomButton>
          }
        />

        <div className="flex flex-wrap items-center gap-2.5 rounded-lg border border-hair bg-panel px-3 py-2.5">
          <span className="t-code-tag flex items-center gap-2 text-ink-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" aria-hidden />
            LIVE · 420 req/m
          </span>
          <span className="grow" />
          <select
            className="input select h-8 w-[190px] text-[13px]"
            aria-label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {['All statuses', 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Memory Limit Exceeded'].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <select
            className="input select h-8 w-[160px] text-[13px]"
            aria-label="Language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {languages.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </div>

        <section className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="ntable">
              <thead>
                <tr>
                  <th className="pl-5">ID</th>
                  <th>Developer</th>
                  <th>Problem</th>
                  <th className="hidden lg:table-cell">Language</th>
                  <th>Status</th>
                  <th className="hidden md:table-cell">Runtime</th>
                  <th className="hidden md:table-cell">Memory</th>
                  <th className="pr-5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr
                    key={s.id}
                    className="cursor-pointer"
                    // onClick={() => push({ title: `Inspecting ${s.id}`, description: `${s.developer} · ${s.problemTitle}`, tone: 'neutral' })}
                  >
                    <td className="t-code-tag pl-5 text-ink-3">{s.id}</td>
                    <td>
                      <span className="flex items-center gap-2.5">
                        <span className="center h-6 w-6 flex-none rounded-full bg-accent-soft text-[10px] font-semibold text-accent">
                          {s.initials}
                        </span>
                        <span className="t-ui-med text-ink">{s.developer}</span>
                      </span>
                    </td>
                    <td>
                      <span className="flex items-center gap-2">
                        <span className="t-code-tag tnum text-ink-3">{s.problemNum}.</span>
                        <span className="t-ui-med text-ink">{s.problemTitle}</span>
                      </span>
                    </td>
                    <td className="hidden lg:table-cell">
                      <span className="tag tag-gray t-code-tag">{s.language}</span>
                    </td>
                    <td>
                      <span className={cx('pill', statusTone(s.status))}>{s.status}</span>
                    </td>
                    <td className="t-ui tnum hidden text-ink-2 md:table-cell">{s.runtime}</td>
                    <td className="t-ui tnum hidden text-ink-2 md:table-cell">{s.memory}</td>
                    <td className="t-caption pr-5 text-right whitespace-nowrap text-ink-3">{s.timestamp}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState icon="terminal" title="No submissions" hint="No runs match the current filters." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-hair px-5 py-3">
            <span className="t-caption text-ink-3">
              Showing <span className="tnum text-ink-2">{rows.length}</span> of{' '}
              <span className="tnum text-ink-2">{ADMIN_SUBMISSIONS.length}</span> recent runs
            </span>
            <span className="t-caption flex items-center gap-1.5 text-ink-3">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
              gVisor sandbox fleet healthy
            </span>
          </div>
        </section>
      </div>
    </AdminLayout>
  )
}
