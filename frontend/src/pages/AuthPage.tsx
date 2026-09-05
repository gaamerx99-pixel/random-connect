import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SignIn, SignUp } from '@clerk/clerk-react'
import { VideoCameraIcon, EnvelopeIcon } from '@heroicons/react/24/outline'

import { useSafeAuth } from '../contexts/AuthContext'
import { BannerAd } from '../components/ads/BannerAd'

interface AuthPageProps {
  initialMode?: 'sign-in' | 'sign-up'
}

export function AuthPage({ initialMode = 'sign-in' }: AuthPageProps) {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>(initialMode)
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
          <div className="flex justify-center">
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

            {/* Social / Email Action Buttons */}
            <div className="mt-6 space-y-3">
              <Link
                to="/dashboard"
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white py-2.5 px-4 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition"
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
              </Link>

              <Link
                to="/dashboard"
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white py-2.5 px-4 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition"
              >
                <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                <span>Continue with Email</span>
              </Link>
            </div>

            {/* Terms and Privacy notice */}
            <p className="mt-6 text-[11px] text-gray-400 leading-relaxed">
              By continuing, you agree to our{' '}
              <a href="#terms" className="text-indigo-600 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#privacy" className="text-indigo-600 hover:underline">
                Privacy Policy
              </a>
              .
            </p>

            {/* Toggle Mode Link */}
            <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
              {mode === 'sign-in' ? (
                <p>
                  Don't have an account?{' '}
                  <button
                    onClick={() => setMode('sign-up')}
                    className="font-semibold text-indigo-600 hover:underline"
                  >
                    Create Account
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    onClick={() => setMode('sign-in')}
                    className="font-semibold text-indigo-600 hover:underline"
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

      {/* Subtle Footer */}
      <footer className="text-center text-xs text-gray-400">
        © {new Date().getFullYear()} RandomConnect
      </footer>
    </div>
  )
}
