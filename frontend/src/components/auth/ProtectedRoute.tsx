import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { SignInButton, SignUpButton } from '@clerk/clerk-react'
import { motion } from 'framer-motion'
import {
  LockClosedIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserPlusIcon,
  ArrowLeftIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline'

import { useSafeAuth } from '../../contexts/AuthContext'
import { GlassPanel } from '../ui/GlassPanel'
import { Button } from '../ui/Button'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate()
  const { isLoaded, isSignedIn, isClerkConfigured } = useSafeAuth()

  // 1. Loading state while Clerk initializes
  if (!isLoaded) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <VideoCameraIcon className="absolute h-6 w-6 text-indigo-400 animate-pulse" />
        </div>
        <p className="mt-4 text-sm font-medium text-zinc-400 animate-pulse">
          Verifying secure session...
        </p>
      </div>
    )
  }

  // 2. If Clerk is not configured (e.g. dev mock), allow access
  if (!isClerkConfigured) {
    return <>{children}</>
  }

  // 3. If signed in, render the protected component directly
  if (isSignedIn) {
    return <>{children}</>
  }

  // 4. If NOT signed in, show modern Auth Gate screen
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.4 }}
      >
        <GlassPanel className="p-8 text-center rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
          {/* Ambient Glow Accent */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none" />

          {/* Icon Badge */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 shadow-inner">
            <LockClosedIcon className="h-8 w-8" />
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight sm:text-3xl">
            Account Required
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">
            Stranger matching and video calling feature access karne ke liye pehle apna free account banayein ya login karein.
          </p>

          {/* Trust features */}
          <div className="my-6 space-y-2 rounded-2xl border border-white/5 bg-white/[0.03] p-3.5 text-left text-xs text-zinc-400">
            <div className="flex items-center gap-2 text-zinc-300">
              <ShieldCheckIcon className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Safe & P2P Encrypted Video Chat</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-300">
              <SparklesIcon className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Custom Gender & Language Match Filters</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <SignUpButton mode="modal">
              <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:scale-[1.02] active:scale-[0.98]">
                <UserPlusIcon className="h-4 w-4" />
                <span>Create Free Account (Sign Up)</span>
              </button>
            </SignUpButton>

            <SignInButton mode="modal">
              <Button className="w-full py-3 text-sm font-semibold border-white/15 bg-white/10 hover:bg-white/20 text-white" variant="secondary">
                Already have an account? Log in
              </Button>
            </SignInButton>

            <button
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition pt-2"
              onClick={() => navigate('/')}
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              <span>Back to Home</span>
            </button>
          </div>
        </GlassPanel>
      </motion.div>
    </div>
  )
}
