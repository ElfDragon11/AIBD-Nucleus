import { Link } from 'react-router-dom'

import nucleusWordmark from '@/assets/brand/nucleus-wordmark-blue.png'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
  imageClassName?: string
  to?: string
}

export function BrandMark({ className, imageClassName, to = '/' }: Props) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex items-center underline-offset-4 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/20',
        className,
      )}
      aria-label="Nucleus home"
    >
      <img
        src={nucleusWordmark}
        alt="The Nucleus Institute"
        className={cn('h-auto w-36 sm:w-44 lg:w-52', imageClassName)}
      />
    </Link>
  )
}
