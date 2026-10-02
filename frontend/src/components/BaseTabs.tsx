import * as Tabs from '@radix-ui/react-tabs'
import type { ComponentProps } from 'react'
import { cn } from '../lib/utils'

export const BaseTabs = Tabs.Root

export function BaseTabsList({ className, ...props }: ComponentProps<typeof Tabs.List>) {
  return <Tabs.List className={cn('inline-flex items-center', className)} {...props} />
}

export function BaseTabsTrigger({ className, ...props }: ComponentProps<typeof Tabs.Trigger>) {
  return (
    <Tabs.Trigger
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:font-medium data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        className,
      )}
      {...props}
    />
  )
}

export function BaseTabsPanel({ className, ...props }: ComponentProps<typeof Tabs.Content>) {
  return <Tabs.Content className={cn('min-w-0 outline-none', className)} {...props} />
}