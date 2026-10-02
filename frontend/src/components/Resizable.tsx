import { useCallback, useState } from 'react'
import type { ComponentProps } from 'react'
import { GripHorizontal, GripVertical } from 'lucide-react'
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
        'group relative z-10 flex shrink-0 items-center justify-center bg-border outline-none transition-colors hover:bg-ring focus-visible:bg-ring data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
        className,
      )}
      {...props}
    >
      {withHandle && (
        <span className="flex size-5 items-center justify-center rounded border border-border bg-background text-muted-foreground group-hover:text-foreground group-focus-visible:text-foreground">
          <GripHorizontal className="hidden size-3 group-data-[orientation=horizontal]:block" aria-hidden="true" />
          <GripVertical className="hidden size-3 group-data-[orientation=vertical]:block" aria-hidden="true" />
        </span>
      )}
    </Separator>
  )
}