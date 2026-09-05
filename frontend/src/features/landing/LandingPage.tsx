import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react'
import {
  VideoCameraIcon,
  UserIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  PlayIcon,
  LockClosedIcon,
  HeartIcon,
  ShieldExclamationIcon,
  ArrowRightOnRectangleIcon,
  MapPinIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline'

import { useSafeAuth } from '../../contexts/AuthContext'
import { BannerAd } from '../../components/ads/BannerAd'
import { AgeWarningModal } from '../../components/common/AgeWarningModal'

const AGE_STORAGE_KEY = 'randomconnect_age_confirmed'

export function LandingPage() {
  const navigate = useNavigate()
  const { isSignedIn, isClerkConfigured } = useSafeAuth()
  const [showAgeWarning, setShowAgeWarning] = useState(false)

  // 18+ Age Warning Gate: check on mount if confirmed in localStorage
  useEffect(() => {
    try {
      const isConfirmed = localStorage.getItem(AGE_STORAGE_KEY)
      if (isConfirmed !== 'true') {
        setShowAgeWarning(true)
      }
    } catch {
      setShowAgeWarning(true)
    }
  }, [])

  const handleConfirmAge = () => {
    try {
      localStorage.setItem(AGE_STORAGE_KEY, 'true')
    } catch {
      // Ignore storage errors safely
    }
    setShowAgeWarning(false)
  }

  const handleStartConnecting = () => {
    navigate('/dashboard')
  }

  const safetyGuidelines = [
    {
      title: '1. Protect Your Privacy',
      description:
        'Never share your password, home address, phone number, financial information or other sensitive personal details with strangers.',
      icon: LockClosedIcon,
    },
    {
      title: '2. Respect Other People',
      description:
        'Treat everyone respectfully. Harassment, bullying, threats and abusive behavior are not allowed.',
      icon: HeartIcon,
    },
    {
      title: '3. Report or Block',
      description:
        'If someone makes you uncomfortable or violates the rules, use the Report or Block controls immediately.',
      icon: ShieldExclamationIcon,
    },
    {
      title: '4. End the Conversation',
      description:
        'You can leave a conversation at any time. You never have to continue talking to someone.',
      icon: ArrowRightOnRectangleIcon,
    },
    {
      title: '5. Meet Responsibly',
      description:
        'RandomConnect connects you with strangers. Do not arrange unsafe in-person meetings or share your exact location with people you do not know.',
      icon: MapPinIcon,
    },
    {
      title: '6. Never Send Money',
      description:
        'Never send money, payment information, gift cards or financial details to someone you meet through the platform.',
      icon: BanknotesIcon,
    },
  ]

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      {/* 1. Header (Navbar) */}
      <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white shadow-xs">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group cursor-pointer"
            aria-label="RandomConnect Home"
            title="RandomConnect Home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition group-hover:bg-indigo-700">
              <VideoCameraIcon className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900 group-hover:text-gray-950 transition">
              Random<span className="text-indigo-600">Connect</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden sm:flex items-center space-x-6 text-sm font-medium text-gray-600">
            <Link to="/" className="text-indigo-600 font-semibold">
              Home
            </Link>
            <a href="#features" className="hover:text-gray-900 transition">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-gray-900 transition">
              How It Works
            </a>
            <a href="#safety" className="hover:text-gray-900 transition">
              Safety
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm transition inline-flex items-center gap-1.5"
                >
                  <span>Dashboard</span>
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </Link>
                <UserButton afterSignOutUrl="/" />
              </div>
            ) : isClerkConfigured ? (
              <div className="flex items-center gap-2">
                <SignInButton mode="modal">
                  <button className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition cursor-pointer">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm transition cursor-pointer">
                    Get Started
                  </button>
                </SignUpButton>
              </div>
            ) : (
              <Link
                to="/dashboard"
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm transition"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {/* 2. Hero Section */}
        <section className="mx-auto max-w-4xl px-4 pt-11 pb-8 text-center">
          <div className="mx-auto mb-3.5 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            <span>🔞</span>
            <span>18+ Adults Only Platform</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            Meet someone <span className="text-indigo-600">new.</span>
          </h1>

          <p className="mx-auto mt-3.5 max-w-2xl text-base sm:text-lg text-gray-500 leading-relaxed">
            Start a random video conversation with someone new.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3.5">
            <button
              onClick={handleStartConnecting}
              className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition active:scale-[0.99] inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Start Connecting</span>
              <ArrowRightIcon className="h-4 w-4" />
            </button>

            <a
              href="#how-it-works"
              className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition active:scale-[0.99] inline-flex items-center gap-2 cursor-pointer"
            >
              <PlayIcon className="h-4 w-4 text-indigo-600" />
              <span>How it works</span>
            </a>
          </div>
        </section>

        {/* 3. Banner Advertisement (Hero Bottom) */}
        <div className="px-4 py-3">
          <BannerAd slotId="landing-hero-bottom" />
        </div>

        {/* 4. Three Simple Features */}
        <section id="features" className="mx-auto max-w-5xl px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Feature 1 */}
            <div className="rounded-xl border border-gray-200 bg-[#f9fafb] p-6 text-center shadow-xs transition hover:border-gray-300">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <VideoCameraIcon className="h-6 w-6" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Video Chat</h2>
              <p className="mt-1.5 text-xs sm:text-sm text-gray-500">
                Real-time conversations
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-xl border border-gray-200 bg-[#f9fafb] p-6 text-center shadow-xs transition hover:border-gray-300">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <UserIcon className="h-6 w-6" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Easy Matching</h2>
              <p className="mt-1.5 text-xs sm:text-sm text-gray-500">
                Choose who you want to meet
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-xl border border-gray-200 bg-[#f9fafb] p-6 text-center shadow-xs transition hover:border-gray-300">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <ShieldCheckIcon className="h-6 w-6" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Safety First</h2>
              <p className="mt-1.5 text-xs sm:text-sm text-gray-500">
                Block and report unwanted users
              </p>
            </div>
          </div>
        </section>

        {/* 5. How It Works (Inline Desktop Section) */}
        <section id="how-it-works" className="mx-auto max-w-5xl px-4 py-10 border-t border-gray-100">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              How It Works
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-500">
              Meeting new people is simple and easy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-xs">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-sm font-bold text-indigo-600">
                1
              </span>
              <h3 className="mt-4 text-sm font-bold text-gray-900">Set Preference</h3>
              <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">
                Choose who you want to meet: Anyone, Female Only, or Male Only.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-xs">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-sm font-bold text-indigo-600">
                2
              </span>
              <h3 className="mt-4 text-sm font-bold text-gray-900">Start Match</h3>
              <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">
                Click Start Video Match to enter the private WebRTC matching queue.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-xs">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-sm font-bold text-indigo-600">
                3
              </span>
              <h3 className="mt-4 text-sm font-bold text-gray-900">Connect & Chat</h3>
              <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">
                Talk via live video and audio, text in private chat, or skip to the next person.
              </p>
            </div>
          </div>
        </section>

        {/* 6. Banner Advertisement (Mid Section) */}
        <div className="px-4 py-3">
          <BannerAd slotId="landing-mid-bottom" />
        </div>

        {/* 7. Comprehensive Safety First Section */}
        <section id="safety" className="mx-auto max-w-5xl px-4 py-10 border-t border-gray-100">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Safety First
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-500">
              Your safety matters when meeting people online.
            </p>
          </div>

          {/* 6 Safety Points: Clean 2-column desktop layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {safetyGuidelines.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="flex items-start gap-4 rounded-xl border border-gray-200 bg-[#f9fafb] p-5 shadow-xs transition hover:border-gray-300"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
                    <p className="mt-1 text-xs sm:text-sm text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Safety Notice */}
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 sm:p-5 text-center shadow-xs">
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-2xl mx-auto">
              RandomConnect connects you with people you may not know. Stay cautious, protect your
              personal information, and report anything that makes you uncomfortable.
            </p>
          </div>
        </section>

        {/* 8. Final CTA Section */}
        <section className="mx-auto max-w-5xl px-4 py-10">
          <div className="rounded-2xl border border-gray-200 bg-[#f9fafb] p-8 sm:p-10 text-center shadow-xs">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Ready to meet someone new?
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-500 max-w-xl mx-auto">
              Start a friendly, spontaneous video conversation right now.
            </p>
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleStartConnecting}
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition active:scale-[0.99] inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Start Connecting</span>
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* 9. Compact Legal Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 text-xs text-gray-500">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Brand & 18+ Notice */}
            <div className="flex items-center gap-3">
              <span className="font-bold text-gray-900">Random<span className="text-indigo-600">Connect</span></span>
              <span className="text-gray-300">|</span>
              <span className="inline-flex items-center gap-1 font-medium text-gray-600 text-[11px]">
                <span>🔞</span>
                <span>18+ Adults Only</span>
              </span>
            </div>

            {/* Compact Legal Links */}
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-gray-600" aria-label="Legal and safety links">
              <Link to="/terms" className="hover:text-indigo-600 transition">
                Terms of Service
              </Link>
              <Link to="/privacy" className="hover:text-indigo-600 transition">
                Privacy Policy
              </Link>
              <Link to="/community-guidelines" className="hover:text-indigo-600 transition">
                Community Guidelines
              </Link>
              <Link to="/safety" className="hover:text-indigo-600 transition">
                Safety
              </Link>
              <Link to="/cookies" className="hover:text-indigo-600 transition">
                Cookie Policy
              </Link>
              <Link to="/contact" className="hover:text-indigo-600 transition">
                Contact / Grievance
              </Link>
            </nav>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center text-[11px] text-gray-400">
            <p>© {new Date().getFullYear()} RandomConnect. All rights reserved. Intended strictly for adults 18 years and older.</p>
          </div>
        </div>
      </footer>

      {/* 18+ Age Warning Modal (non-bypassable confirmation gate) */}
      <AgeWarningModal isOpen={showAgeWarning} onConfirm={handleConfirmAge} />
    </div>
  )
}
