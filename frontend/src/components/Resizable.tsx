import { useCallback, useState } from 'react'
import type { ComponentProps } from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { cn } from '../lib/utils'

type Layout = Record<string, number>
type ResizablePanelGroupProps = ComponentProps<typeof Group> & { autoSaveId?: string }

function readSavedLayout(id: string | undefined, fallback: Layout | undefined): Layout | undefined {
  if (!id || typeof window === 'undefined') return fallback
  try {
    const saved = window.localStorage.getItem(id)
    if (!saved) return fallback
    const parsed: unknown = JSON.parse(saved)
    if (!parsed || typeof parsed !== 'object') return fallback
    const entries = Object.entries(parsed)
    if (entries.length === 0 || entries.some(([, value]) => typeof value !== 'number' || !Number.isFinite(value))) {
      return fallback
    }
    return Object.fromEntries(entries) as Layout
  } catch {
    return fallback
  }
}

export function ResizablePanelGroup({ autoSaveId, defaultLayout, onLayoutChanged, ...props }: ResizablePanelGroupProps) {
  const [initialLayout] = useState(() => readSavedLayout(autoSaveId, defaultLayout))
  const saveLayout = useCallback((
    layout: Layout,
    meta: Parameters<NonNullable<ResizablePanelGroupProps['onLayoutChanged']>>[1],
  ) => {
    if (autoSaveId) {
      try {
        window.localStorage.setItem(autoSaveId, JSON.stringify(layout))
      } catch {
        // Storage may be unavailable in private browsing contexts.
      }
    }
    onLayoutChanged?.(layout, meta)
  }, [autoSaveId, onLayoutChanged])

  return <Group defaultLayout={initialLayout} onLayoutChanged={saveLayout} {...props} />
}

export const ResizablePanel = Panel

export function ResizableHandle({
  withHandle = false,
  className,
  ...props
}: ComponentProps<typeof Separator> & { withHandle?: boolean }) {
  return (
    <Separator
      className={cn(
        'group relative z-10 flex shrink-0 items-center justify-center bg-transparent outline-none after:pointer-events-none after:absolute after:rounded-full after:bg-border after:transition-colors hover:after:bg-primary/40 focus-visible:after:bg-ring data-[separator=active]:after:bg-ring aria-[orientation=vertical]:w-2 aria-[orientation=vertical]:cursor-col-resize aria-[orientation=vertical]:after:inset-y-0 aria-[orientation=vertical]:after:left-1/2 aria-[orientation=vertical]:after:w-px aria-[orientation=vertical]:after:-translate-x-1/2 aria-[orientation=horizontal]:h-2 aria-[orientation=horizontal]:cursor-row-resize aria-[orientation=horizontal]:after:top-1/2 aria-[orientation=horizontal]:after:right-0 aria-[orientation=horizontal]:after:left-0 aria-[orientation=horizontal]:after:h-px aria-[orientation=horizontal]:after:-translate-y-1/2',
        className,
      )}
      {...props}
    >
      {withHandle && (
        <span
          className={cn(
            'pointer-events-none absolute z-10 rounded-full bg-primary/40 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100',
            'h-1 w-4 group-aria-[orientation=vertical]:h-4 group-aria-[orientation=vertical]:w-1',
          )}
          aria-hidden="true"
        />
      )}
    </Separator>
  )
}