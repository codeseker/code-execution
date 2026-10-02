import type { ButtonHTMLAttributes } from 'react'
import { LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'unstyled'

interface CustomButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  fullWidth?: boolean
  loading?: boolean
}

export default function CustomButton({
  type,
  variant = 'primary',
  fullWidth = false,
  loading = false,
  className,
  disabled,
  children,
  ...props
}: CustomButtonProps) {
  const classes = className?.split(/\s+/).filter(Boolean) ?? []
  const legacyVariant = classes.includes('btn-primary')
    ? 'default'
    : classes.includes('btn-secondary')
      ? 'outline'
      : classes.includes('btn-destructive') || classes.includes('btn-destructive-solid')
        ? 'destructive'
        : classes.includes('btn-ghost')
          ? 'ghost'
          : undefined
  const shadcnVariant = {
    primary: 'default',
    secondary: 'outline',
    ghost: 'ghost',
    destructive: 'destructive',
    unstyled: legacyVariant ?? 'ghost',
  } as const
  const size = classes.includes('icon-btn') ? 'icon' : classes.includes('btn-sm') ? 'sm' : 'default'
  const cleanedClasses = classes.filter((name) => name !== 'icon-btn' && name !== 'btn' && !name.startsWith('btn-'))

  return (
    <Button
      type={type}
      variant={shadcnVariant[variant]}
      size={size}
      className={cn((fullWidth || classes.includes('btn-block')) && 'w-full', cleanedClasses)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </Button>
  )
}