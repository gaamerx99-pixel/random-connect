import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '../../utils/cn'

type GlassPanelProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
}

export function GlassPanel({ children, className, ...props }: GlassPanelProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white shadow-sm',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
