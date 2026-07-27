import type { ReactNode } from 'react'

type AppLayoutProps = {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return <div className="min-h-screen bg-[#07080d] text-white">{children}</div>
}
