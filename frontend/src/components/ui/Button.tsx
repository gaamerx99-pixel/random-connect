import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '../../utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: ButtonVariant
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-white text-[#08090f] shadow-[0_18px_60px_rgba(255,255,255,0.16)] hover:bg-zinc-100',
  secondary:
    'border border-white/15 bg-white/[0.08] text-white shadow-[0_18px_60px_rgba(0,0,0,0.24)] hover:bg-white/[0.12]',
  ghost: 'text-zinc-300 hover:bg-white/[0.08] hover:text-white',
}

export function Button({ children, className, variant = 'primary', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-[#07080d] disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        className,
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}
