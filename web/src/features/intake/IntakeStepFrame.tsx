import * as React from 'react'

import { cn } from '@/lib/utils'

type Props = {
  className?: string
  children: React.ReactNode
}

/**
 * Wraps a single intake step. Parent should set `key={...}` so each step
 * remounts and runs enter animation (fade + slight rise).
 */
export function IntakeStepFrame({ className, children }: Props) {
  return (
    <div
      className={cn(
        'animate-in fade-in slide-in-from-bottom-3 duration-500 ease-out fill-mode-both',
        className,
      )}
    >
      {children}
    </div>
  )
}
