import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react'
import {
  BoltIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  LockClosedIcon,
  PlayIcon,
  ShieldCheckIcon,
  SparklesIcon,
  VideoCameraIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'

import { Button } from '../../components/ui/Button'
import { GlassPanel } from '../../components/ui/GlassPanel'
import { useSafeAuth } from '../../contexts/AuthContext'

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
}

const features = [
  {
    title: 'Smart Gender & Preference Matching',
    description: 'Connect with online strangers tailored to your gender preferences and language filters.',
    icon: BoltIcon,
  },
  {
    title: 'Secure & Private WebRTC Calls',
    description: 'Direct peer-to-peer audio and video streaming with instant report and block controls.',
    icon: ShieldCheckIcon,
  },
  {
    title: 'Global Fast Matchmaking',
    description: 'Sub-3 second queue matchmaking powered by FastAPI WebSockets & MongoDB.',
    icon: GlobeAltIcon,
  },
]

const stats = [
  { value: '< 3s', label: 'Target match speed' },
  { value: '100%', label: 'P2P WebRTC privacy' },
  { value: '24/7', label: 'Always-on queue' },
]

function Navbar() {
  const navigate = useNavigate()
  const { isSignedIn, isClerkConfigured } = useSafeAuth()

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07080d]/75 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <a className="flex items-center gap-3" href="#top" aria-label="RandomConnect home">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
            <VideoCameraIcon className="h-5 w-5 text-indigo-400" />
          </span>
          <span className="text-base font-semibold text-white">RandomConnect</span>
        </a>

        <div className="flex items-center gap-3">
          {isSignedIn ? (
            <>
              <button
                className="flex items-center gap-2 rounded-xl bg-indigo-600/30 border border-indigo-500/40 px-4 py-2 text-xs font-semibold text-indigo-200 hover:bg-indigo-600/50 transition"
                onClick={() => navigate('/dashboard')}
              >
                <span>Dashboard</span>
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </button>
              <UserButton afterSignOutUrl="/" />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <SignInButton mode="modal">
                <Button className="min-h-9 px-3.5 text-xs font-medium" variant="secondary">
                  Log in
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button className="min-h-9 px-3.5 text-xs font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-md shadow-indigo-500/20">
                  Create Account
                </Button>
              </SignUpButton>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}

function HeroVisual() {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      className="relative mx-auto mt-12 aspect-[1.05] w-full max-w-[560px] lg:mt-0"
      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className="absolute inset-0 rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.72),rgba(24,24,27,0.38)_42%,rgba(67,56,202,0.32))] shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl" />
      <div className="absolute left-[7%] top-[8%] h-[50%] w-[55%] overflow-hidden rounded-[1.5rem] border border-white/10 bg-zinc-950">
        <div className="h-full bg-[linear-gradient(145deg,#18181b,#4338ca_52%,#111827)]" />
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/35 px-3 py-1 text-xs text-white/80 backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Local Camera
        </div>
      </div>
      <div className="absolute bottom-[9%] right-[7%] h-[49%] w-[57%] overflow-hidden rounded-[1.5rem] border border-white/10 bg-zinc-950">
        <div className="h-full bg-[linear-gradient(145deg,#312e81,#6b21a8_48%,#0f172a)]" />
        <div className="absolute bottom-4 right-4 rounded-full bg-black/35 px-3 py-1 text-xs text-white/80 backdrop-blur-md">
          Matched Stranger
        </div>
      </div>
      <GlassPanel className="absolute bottom-[18%] left-[8%] flex items-center gap-3 rounded-2xl px-4 py-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 text-white">
          <PlayIcon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold">Gender Match Engine</p>
          <p className="text-xs text-zinc-300">FastAPI + WebSockets</p>
        </div>
      </GlassPanel>
      <GlassPanel className="absolute right-[6%] top-[13%] rounded-2xl px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
          <LockClosedIcon className="h-4 w-4" />
          P2P Encrypted
        </div>
      </GlassPanel>
    </motion.div>
  )
}

function HeroSection() {
  const navigate = useNavigate()
  const { isSignedIn } = useSafeAuth()

  return (
    <section id="top" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#07080d_0%,#101014_46%,#07080d_100%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-24 pt-20 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:pb-28 lg:pt-24">
        <motion.div initial="hidden" animate="visible" transition={{ staggerChildren: 0.08 }}>
          <motion.div
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 text-sm text-zinc-200 backdrop-blur-xl"
            variants={fadeUp}
          >
            <SparklesIcon className="h-4 w-4 text-amber-300" />
            Next-Gen Random Video & Text Chat Application
          </motion.div>
          <motion.h1
            className="max-w-4xl text-5xl font-semibold leading-[1.03] text-white sm:text-6xl lg:text-7xl"
            variants={fadeUp}
          >
            Connect with new strangers around the world.
          </motion.h1>
          <motion.p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300 sm:text-xl" variants={fadeUp}>
            RandomConnect delivers real-time P2P WebRTC video calls, gender-based matchmaking, instant report/block safety controls, and real-time chat.
          </motion.p>
          <motion.div className="mt-9 flex flex-col gap-3 sm:flex-row" variants={fadeUp}>
            {isSignedIn ? (
              <>
                <button
                  className="flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-8 py-4 font-bold text-white shadow-xl shadow-indigo-500/25 transition hover:scale-[1.02] active:scale-[0.98]"
                  onClick={() => navigate('/dashboard')}
                >
                  <VideoCameraIcon className="h-6 w-6 animate-pulse" />
                  <span>Go to Dashboard & Start Match</span>
                </button>
                <button
                  className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-6 py-4 font-semibold text-white transition hover:bg-white/20"
                  onClick={() => navigate('/waiting')}
                >
                  <span>Instant Stranger Video Call</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <SignUpButton mode="modal">
                  <button className="flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-8 py-4 font-bold text-white shadow-xl shadow-indigo-500/25 transition hover:scale-[1.02] active:scale-[0.98]">
                    <VideoCameraIcon className="h-6 w-6 animate-pulse" />
                    <span>Create Account & Start Match</span>
                  </button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <button className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-6 py-4 font-semibold text-white transition hover:bg-white/20">
                    <span>Already have account? Log in</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                </SignInButton>
              </>
            )}
          </motion.div>

          <motion.div className="mt-7 flex flex-col gap-3 text-sm text-zinc-400 sm:flex-row sm:items-center" variants={fadeUp}>
            <span className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-emerald-300" />
              Clerk Auth Ready
            </span>
            <span className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-emerald-300" />
              MongoDB Database
            </span>
            <span className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-emerald-300" />
              P2P WebRTC Video Call
            </span>
          </motion.div>
        </motion.div>
        <HeroVisual />
      </div>
    </section>
  )
}

function FeaturesSection() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
      <div className="mb-10 max-w-2xl">
        <p className="text-sm font-semibold uppercase text-indigo-400">Platform Features</p>
        <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Everything you need for safe & fast random chat.</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <motion.article
              className="rounded-3xl border border-white/10 bg-white/[0.055] p-6 backdrop-blur-xl transition hover:bg-white/[0.075]"
              initial={{ opacity: 0, y: 18 }}
              key={feature.title}
              transition={{ delay: index * 0.08, duration: 0.45 }}
              viewport={{ once: true, amount: 0.4 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <span className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500 text-white">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="mt-3 leading-7 text-zinc-400">{feature.description}</p>
            </motion.article>
          )
        })}
      </div>
    </section>
  )
}

function StatsSection() {
  return (
    <section id="stats" className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
      <GlassPanel className="grid gap-6 rounded-[2rem] p-6 sm:grid-cols-3 sm:p-8">
        {stats.map((stat) => (
          <div className="border-white/10 py-3 sm:border-l sm:first:border-l-0 sm:first:pl-0 sm:pl-8" key={stat.label}>
            <p className="text-4xl font-semibold text-white">{stat.value}</p>
            <p className="mt-2 text-sm text-zinc-400">{stat.label}</p>
          </div>
        ))}
      </GlassPanel>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/10 px-5 py-8 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
        <p>RandomConnect © {new Date().getFullYear()}</p>
        <div className="flex gap-5">
          <a className="transition hover:text-white" href="#features">
            Features
          </a>
          <a className="transition hover:text-white" href="#stats">
            Stats
          </a>
        </div>
      </div>
    </footer>
  )
}

export function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <StatsSection />
      </main>
      <Footer />
    </>
  )
}
