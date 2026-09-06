import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SignIn, SignUp } from '@clerk/clerk-react'
import { VideoCameraIcon, EnvelopeIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

import { useSafeAuth } from '../contexts/AuthContext'
import { BannerAd } from '../components/ads/BannerAd'

interface AuthPageProps {
  initialMode?: 'sign-in' | 'sign-up'
}

export function AuthPage({ initialMode = 'sign-in' }: AuthPageProps) {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>(initialMode)
  const [agreedToLegal, setAgreedToLegal] = useState(false)
  const { isClerkConfigured } = useSafeAuth()

  return (
    <div className="min-h-screen bg-[#fafbfc] text-gray-900 flex flex-col justify-between py-8 px-4">
      {/* Top Logo */}
      <div className="mx-auto text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 group cursor-pointer"
          aria-label="RandomConnect Home"
          title="RandomConnect Home"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition group-hover:bg-indigo-700">
            <VideoCameraIcon className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900 group-hover:text-gray-950 transition">
            Random<span className="text-indigo-600">Connect</span>
          </span>
        </Link>
      </div>

      {/* Main Authentication Card (Screen 9) */}
      <main className="my-auto mx-auto w-full max-w-sm">
        {isClerkConfigured ? (
          <div className="flex flex-col items-center">
            {/* Prominent Legal Notice & Consent Disclosure for Clerk Authentication */}
            <div className="mb-4 w-full rounded-xl border border-indigo-100 bg-indigo-50/70 p-3 text-center text-xs text-indigo-950 shadow-xs">
              <div className="flex items-center justify-center gap-1.5 font-semibold text-indigo-900 mb-1">
                <ShieldCheckIcon className="h-4 w-4 text-indigo-600" />
                <span>18+ Adult Platform</span>
              </div>
              <p className="text-[11px] leading-relaxed text-indigo-900/90">
                By continuing to sign in or register, you confirm that you are at least 18 years old and agree to our{' '}
                <Link to="/terms" target="_blank" className="font-semibold text-indigo-700 hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" target="_blank" className="font-semibold text-indigo-700 hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>

            {mode === 'sign-in' ? (
              <SignIn
                routing="path"
                path="/sign-in"
                signUpUrl="/sign-up"
                appearance={{
                  elements: {
                    rootBox: 'w-full',
                    card: 'rounded-2xl border border-gray-200 bg-white shadow-sm p-6',
                    headerTitle: 'text-xl font-bold text-gray-900',
                    headerSubtitle: 'text-xs text-gray-500',
                    formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs py-2.5',
                  },
                }}
              />
            ) : (
              <SignUp
                routing="path"
                path="/sign-up"
                signInUrl="/sign-in"
                appearance={{
                  elements: {
                    rootBox: 'w-full',
                    card: 'rounded-2xl border border-gray-200 bg-white shadow-sm p-6',
                    headerTitle: 'text-xl font-bold text-gray-900',
                    headerSubtitle: 'text-xs text-gray-500',
                    formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs py-2.5',
                  },
                }}
              />
            )}
          </div>
        ) : (
          /* Clean Demo/Fallback View matching Screen 9 directly */
          <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm text-center">
            <h1 className="text-xl font-bold text-gray-900">
              {mode === 'sign-in' ? 'Sign In' : 'Create Account'}
            </h1>
            <p className="mt-1 text-xs text-gray-500">
              {mode === 'sign-in'
                ? 'Welcome back to RandomConnect.'
                : 'Join RandomConnect and meet new people.'}
            </p>

            {/* Explicit 18+ and Legal Agreement Checkbox for Demo/Fallback Auth */}
            <label
              htmlFor="auth-legal-checkbox"
              className="mt-5 flex items-start gap-2.5 rounded-xl border border-gray-200 bg-gray-50/80 p-3 text-left cursor-pointer hover:bg-gray-50 transition select-none"
            >
              <input
                id="auth-legal-checkbox"
                type="checkbox"
                checked={agreedToLegal}
                onChange={(e) => setAgreedToLegal(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs text-gray-700 leading-tight">
                I confirm that I am 18 years old or older and I agree to the{' '}
                <Link to="/terms" target="_blank" className="font-semibold text-indigo-600 hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" target="_blank" className="font-semibold text-indigo-600 hover:underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            {/* Social / Email Action Buttons (enabled only upon legal consent checkbox) */}
            <div className="mt-4 space-y-3">
              <button
                type="button"
                disabled={!agreedToLegal}
                onClick={() => agreedToLegal && navigate('/dashboard')}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white py-2.5 px-4 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                disabled={!agreedToLegal}
                onClick={() => agreedToLegal && navigate('/dashboard')}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white py-2.5 px-4 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                <span>Continue with Email</span>
              </button>
            </div>

            {/* Toggle Mode Link */}
            <div className="mt-5 pt-4 border-t border-gray-100 text-xs text-gray-500">
              {mode === 'sign-in' ? (
                <p>
                  Don't have an account?{' '}
                  <button
                    onClick={() => setMode('sign-up')}
                    className="font-semibold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Create Account
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    onClick={() => setMode('sign-in')}
                    className="font-semibold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Banner Advertisement below auth card (visually separated) */}
        <BannerAd slotId="auth-page-bottom" className="mt-6" />
      </main>

      {/* Subtle Footer with Legal Links */}
      <footer className="text-center text-xs text-gray-400 space-y-2">
        <div className="flex flex-wrap justify-center gap-4 text-[11px] text-gray-500">
          <Link to="/terms" className="hover:text-indigo-600 transition">
            Terms of Service
          </Link>
          <Link to="/privacy" className="hover:text-indigo-600 transition">
            Privacy Policy
          </Link>
          <Link to="/safety" className="hover:text-indigo-600 transition">
            Safety
          </Link>
          <Link to="/contact" className="hover:text-indigo-600 transition">
            Contact
          </Link>
        </div>
        <p>© {new Date().getFullYear()} RandomConnect. 18+ Adults Only.</p>
      </footer>
    </div>
  )
}
