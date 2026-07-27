import type { ComponentType, SVGProps } from 'react'

import { cn } from '../../../utils/cn'

type StatusTone = 'good' | 'warning' | 'muted'

type StatusCardProps = {
  description: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
  tone?: StatusTone
  value: string
}

const toneStyles: Record<StatusTone, string> = {
  good: 'border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-200',
  warning: 'border-amber-300/20 bg-amber-300/[0.08] text-amber-200',
  muted: 'border-white/10 bg-white/[0.06] text-zinc-200',
}

export function StatusCard({ description, icon: Icon, label, tone = 'muted', value }: StatusCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-400">{label}</p>
          <p className="mt-1 text-lg font-semibold text-white">{value}</p>
        </div>
        <span className={cn('flex h-11 w-11 items-center justify-center rounded-2xl border', toneStyles[tone])}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-zinc-400">{description}</p>
    </div>
  )
}
