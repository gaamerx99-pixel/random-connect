import type { ReactNode } from 'react'

type AppLayoutProps = {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return <div className="min-h-screen bg-[#fafbfc] text-gray-900 selection:bg-indigo-100 selection:text-indigo-900">{children}</div>
}
