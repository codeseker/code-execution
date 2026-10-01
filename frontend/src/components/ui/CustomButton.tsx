import type { ButtonHTMLAttributes } from 'react'
import { LoaderCircle } from 'lucide-react'

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
  const classes = [
    variant === 'unstyled' ? '' : 'btn',
    variant === 'unstyled' ? '' : `btn-${variant}`,
    fullWidth ? 'btn-block' : '',
    className ?? '',
  ].filter(Boolean).join(' ')

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}