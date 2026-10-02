import { Link } from 'react-router-dom'
import type { LinkProps } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type CustomLinkProps = LinkProps & {
  variant?: 'default' | 'unstyled'
}

export default function CustomLink({
  variant = 'default',
  className,
  ...props
}: CustomLinkProps) {
  const classes = className?.split(/\s+/).filter(Boolean) ?? []
  const isButtonStyle = classes.includes('btn') || classes.includes('icon-btn') || classes.some((name) => name.startsWith('btn-'))

  if (isButtonStyle) {
    const buttonVariant = classes.includes('btn-primary')
      ? 'default'
      : classes.includes('btn-secondary')
        ? 'outline'
        : classes.includes('btn-destructive') || classes.includes('btn-destructive-solid')
          ? 'destructive'
          : classes.includes('btn-ghost')
            ? 'ghost'
            : 'default'
    const size = classes.includes('icon-btn') ? 'icon' : classes.includes('btn-sm') ? 'sm' : 'default'
    const cleanedClasses = classes.filter((name) => name !== 'icon-btn' && name !== 'btn' && !name.startsWith('btn-'))

    return (
      <Button  variant={buttonVariant} size={size} className={cn(cleanedClasses)}>
        <Link {...props} />
      </Button>
    )
  }

  return (
    <Link
      {...props}
      className={cn(
        variant === 'default' &&
          'text-primary underline decoration-primary underline-offset-4 transition-colors hover:text-primary/80 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
    />
  )
}