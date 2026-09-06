import { ReactNode, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { VideoCameraIcon, ArrowLeftIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

interface LegalLayoutProps {
  title: string
  subtitle?: string
  lastUpdated?: string
  children: ReactNode
  metaDescription?: string
}

const LEGAL_NAV_ITEMS = [
  { path: '/terms', label: 'Terms of Service' },
  { path: '/privacy', label: 'Privacy Policy' },
  { path: '/community-guidelines', label: 'Community Guidelines' },
  { path: '/safety', label: 'Safety' },
  { path: '/cookies', label: 'Cookie Policy' },
  { path: '/contact', label: 'Contact / Grievance' },
]

export function LegalLayout({
  title,
  subtitle,
  lastUpdated = 'September 2026',
  children,
  metaDescription,
}: LegalLayoutProps) {
  const location = useLocation()

  // SEO: Update page title and meta description
  useEffect(() => {
    document.title = `${title} | RandomConnect`
    if (metaDescription) {
      let meta = document.querySelector('meta[name="description"]')
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('name', 'description')
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', metaDescription)
    }
  }, [title, metaDescription])

  return (
    <div className="min-h-screen bg-[#fafbfc] text-gray-900 flex flex-col">
      {/* 1. Top Clean Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          {/* Brand Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group cursor-pointer"
            aria-label="RandomConnect Home"
            title="RandomConnect Home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs transition group-hover:bg-indigo-700">
              <VideoCameraIcon className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900 group-hover:text-gray-950 transition">
              Random<span className="text-indigo-600">Connect</span>
            </span>
          </Link>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition px-2.5 py-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              <span>Back to Home</span>
            </Link>
            <Link
              to="/dashboard"
              className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs transition cursor-pointer"
            >
              Launch App
            </Link>
          </div>
        </div>

        {/* 2. Compact Sub-Navigation for Legal Documents */}
        <div className="border-t border-gray-100 bg-gray-50/70">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 overflow-x-auto scrollbar-none">
            <nav className="flex space-x-1 sm:space-x-2 py-2" aria-label="Legal Documents">
              {LEGAL_NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-white text-indigo-600 font-semibold shadow-xs border border-gray-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* 3. Main Document Container */}
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8 sm:py-12">
        <article className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-10 shadow-xs">
          {/* Header Area */}
          <header className="border-b border-gray-100 pb-6 mb-8">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-100/80">
                <ShieldCheckIcon className="h-3.5 w-3.5" />
                Legal & Safety Compliance
              </span>
              <span className="text-xs text-gray-400">
                Effective Date: {lastUpdated}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                {subtitle}
              </p>
            )}
          </header>

          {/* Document Body */}
          <div className="prose prose-slate max-w-none text-sm leading-relaxed text-gray-700 space-y-6">
            {children}
          </div>
        </article>
      </main>

      {/* 4. Compact Standard Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 text-center text-xs text-gray-500">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-4 font-medium">
            {LEGAL_NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="hover:text-indigo-600 transition"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-gray-400">
            <span>🔞 18+ Adults Only Platform</span>
            <span>•</span>
            <span>© {new Date().getFullYear()} RandomConnect. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
