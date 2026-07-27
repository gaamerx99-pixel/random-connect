import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '../../utils/cn'

type GlassPanelProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
}

export function GlassPanel({ children, className, ...props }: GlassPanelProps) {
  return (
    <div
      className={cn(
        'border border-white/10 bg-white/[0.06] shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
