import type { HTMLAttributes } from 'react'
import { cn } from '../lib/utils'

export function PanelSurface({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn('min-h-0 min-w-0 overflow-hidden rounded-lg border border-border bg-card text-card-foreground', className)}
      {...props}
    />
  )
}