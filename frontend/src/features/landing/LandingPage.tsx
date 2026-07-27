import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  BoltIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  LockClosedIcon,
  PlayIcon,
  ShieldCheckIcon,
  SparklesIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline'

import { Button } from '../../components/ui/Button'
import { GlassPanel } from '../../components/ui/GlassPanel'

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
}

const features = [
  {
    title: 'Instant matching',
    description: 'A polished first step toward fast, low-friction conversations with new people.',
    icon: BoltIcon,
  },
  {
    title: 'Privacy-minded flows',
    description: 'Designed for clear controls, predictable states, and safer product decisions as the app grows.',
    icon: ShieldCheckIcon,
  },
  {
    title: 'Global by default',
    description: 'Responsive interface patterns that work across devices, regions, and connection quality.',
    icon: GlobeAltIcon,
  },
]

const stats = [
  { value: '< 3s', label: 'Target match start' },
  { value: '24/7', label: 'Always-on experience' },
  { value: '100%', label: 'Responsive interface' },
]

const faqs = [
  {
    question: 'Is video chat active yet?',
    answer: 'Not yet. This page is UI-only and intentionally does not implement WebRTC or matching behavior.',
  },
  {
    question: 'Does Login with Google authenticate users?',
    answer: 'No. The button is a visual placeholder until authentication is intentionally wired up.',
  },
  {
    question: 'Is this based on Omegle?',
    answer: 'No. The design direction is a premium SaaS-style product experience for RandomConnect.',
  },
]

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07080d]/75 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <a className="flex items-center gap-3" href="#top" aria-label="RandomConnect home">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
            <VideoCameraIcon className="h-5 w-5 text-emerald-300" />
          </span>
          <span className="text-base font-semibold">RandomConnect</span>
        </a>
        <div className="hidden items-center gap-7 text-sm text-zinc-300 md:flex">
          <a className="transition hover:text-white" href="#features">
            Features
          </a>
          <a className="transition hover:text-white" href="#stats">
            Stats
          </a>
          <a className="transition hover:text-white" href="#faq">
            FAQ
          </a>
        </div>
        <Button className="hidden min-h-10 px-4 md:inline-flex" variant="secondary">
          Login with Google
        </Button>
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
      <div className="absolute inset-0 rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.72),rgba(24,24,27,0.38)_42%,rgba(6,78,59,0.32))] shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl" />
      <div className="absolute left-[7%] top-[8%] h-[50%] w-[55%] overflow-hidden rounded-[1.5rem] border border-white/10 bg-zinc-950">
        <div className="h-full bg-[linear-gradient(145deg,#18181b,#064e3b_52%,#111827)]" />
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/35 px-3 py-1 text-xs text-white/80 backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-emerald-300" />
          Live preview
        </div>
      </div>
      <div className="absolute bottom-[9%] right-[7%] h-[49%] w-[57%] overflow-hidden rounded-[1.5rem] border border-white/10 bg-zinc-950">
        <div className="h-full bg-[linear-gradient(145deg,#312e81,#7f1d1d_48%,#0f172a)]" />
        <div className="absolute bottom-4 right-4 rounded-full bg-black/35 px-3 py-1 text-xs text-white/80 backdrop-blur-md">
          Stranger ready
        </div>
      </div>
      <GlassPanel className="absolute bottom-[18%] left-[8%] flex items-center gap-3 rounded-2xl px-4 py-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#08090f]">
          <PlayIcon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold">Smart queue</p>
          <p className="text-xs text-zinc-300">UI placeholder</p>
        </div>
      </GlassPanel>
      <GlassPanel className="absolute right-[6%] top-[13%] rounded-2xl px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <LockClosedIcon className="h-4 w-4 text-emerald-300" />
          Private by design
        </div>
      </GlassPanel>
    </motion.div>
  )
}

function HeroSection() {
  const navigate = useNavigate()

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
            Premium random video chat, built with restraint
          </motion.div>
          <motion.h1
            className="max-w-4xl text-5xl font-semibold leading-[1.03] text-white sm:text-6xl lg:text-7xl"
            variants={fadeUp}
          >
            Meet someone new in a calmer, sharper video chat experience.
          </motion.h1>
          <motion.p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300 sm:text-xl" variants={fadeUp}>
            RandomConnect is shaped like a serious product from day one: elegant flows, clear controls, and a UI ready
            for real-time conversation features when you decide to wire them in.
          </motion.p>
          <motion.div className="mt-9 flex flex-col gap-3 sm:flex-row" variants={fadeUp}>
            <Button className="w-full sm:w-auto" onClick={() => navigate('/waiting')}>
              <VideoCameraIcon className="h-5 w-5" />
              Start Video Chat
            </Button>
            <Button className="w-full sm:w-auto" variant="secondary">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-[#08090f]">
                G
              </span>
              Login with Google
            </Button>
          </motion.div>
          <motion.div className="mt-7 flex flex-col gap-3 text-sm text-zinc-400 sm:flex-row sm:items-center" variants={fadeUp}>
            <span className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-emerald-300" />
              UI only
            </span>
            <span className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-emerald-300" />
              No auth wired
            </span>
            <span className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-emerald-300" />
              No WebRTC wired
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
        <p className="text-sm font-semibold uppercase text-emerald-300">Product Foundation</p>
        <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Reusable patterns for a real platform.</h2>
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
              <span className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#08090f]">
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

function FaqSection() {
  return (
    <section id="faq" className="mx-auto max-w-4xl px-5 py-20 sm:px-8">
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase text-amber-300">FAQ</p>
        <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">What this landing page does today.</h2>
      </div>
      <div className="space-y-3">
        {faqs.map((faq) => (
          <GlassPanel className="rounded-3xl p-6" key={faq.question}>
            <h3 className="text-lg font-semibold">{faq.question}</h3>
            <p className="mt-3 leading-7 text-zinc-400">{faq.answer}</p>
          </GlassPanel>
        ))}
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/10 px-5 py-8 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
        <p>RandomConnect</p>
        <div className="flex gap-5">
          <a className="transition hover:text-white" href="#features">
            Features
          </a>
          <a className="transition hover:text-white" href="#stats">
            Stats
          </a>
          <a className="transition hover:text-white" href="#faq">
            FAQ
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
        <FaqSection />
      </main>
      <Footer />
    </>
  )
}
