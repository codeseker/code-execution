import { Link } from 'react-router-dom'
import type { LinkProps } from 'react-router-dom'
import { cx } from '../ui'

type CustomLinkProps = LinkProps & {
  variant?: 'default' | 'unstyled'
}

export default function CustomLink({
  variant = 'default',
  className,
  ...props
}: CustomLinkProps) {
  return (
    <Link
      {...props}
      className={cx(
        variant === 'default' &&
          'text-accent underline decoration-accent underline-offset-4 transition-colors hover:text-accent-hover focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        className,
      )}
    />
  )
}