import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

export type ToastTone = 'neutral' | 'success' | 'error'

export type ToastAction = {
  label: string
  onClick: () => void
}

export type ToastItem = {
  id: number
  title: string
  description?: string
  tone: ToastTone
  action?: ToastAction
}

type ToastContextValue = {
  toasts: ToastItem[]
  push: (toast: Omit<ToastItem, 'id'>) => void
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)
const AUTO_DISMISS_MS = 4000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = nextId.current++
      setToasts((list) => [...list.slice(-2), { ...toast, id }])
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toasts, push, dismiss }), [toasts, push, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-6 left-1/2 z-[80] flex -translate-x-1/2 flex-col items-center gap-2"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex min-w-[280px] max-w-[440px] items-start gap-3 rounded-md border border-hair bg-raised px-4 py-3 shadow-e2 anim-toast"
            style={{ animation: 'cf-toast-in 140ms cubic-bezier(0,0,0.2,1) both' }}
          >
            <span
              className={`mt-[5px] h-2 w-2 flex-none rounded-full ${
                t.tone === 'success'
                  ? 'bg-success'
                  : t.tone === 'error'
                    ? 'bg-error'
                    : 'bg-accent'
              }`}
              aria-hidden
            />
            <div className="grow">
              <p className="t-ui-med text-ink">{t.title}</p>
              {t.description && <p className="t-caption mt-0.5 text-ink-2">{t.description}</p>}
            </div>
            {t.action && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  t.action?.onClick()
                  dismiss(t.id)
                }}
              >
                {t.action.label}
              </button>
            )}
            <button
              type="button"
              className="icon-btn h-5 w-5 flex-none"
              aria-label="Dismiss notification"
              onClick={() => dismiss(t.id)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
