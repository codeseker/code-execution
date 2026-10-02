import type { HTMLAttributes } from 'react'
import { cn } from '../lib/utils'

export function Kbd({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn('inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] leading-none text-muted-foreground', className)}
      {...props}
    />
  )
}