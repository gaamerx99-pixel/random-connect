import { Link } from 'react-router-dom'
import {
  LockClosedIcon,
  HeartIcon,
  ShieldExclamationIcon,
  ArrowRightOnRectangleIcon,
  MapPinIcon,
  BanknotesIcon,
  HandRaisedIcon,
} from '@heroicons/react/24/outline'
import { LegalLayout } from '../../layouts/LegalLayout'

export function SafetyPage() {
  return (
    <LegalLayout
      title="Safety"
      subtitle="Short, practical guidance to keep your conversations safe, private, and enjoyable."
      metaDescription="Practical safety tips for RandomConnect. Learn how to protect your privacy, end conversations, report or block users, and stay safe online."
    >
      {/* 1. Core Notice */}
      <section className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5 sm:p-6 text-indigo-950 space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-800">
          Safety Notice
        </h2>
        <p className="text-sm sm:text-base font-semibold leading-relaxed">
          &ldquo;RandomConnect connects you with people you may not know. Stay cautious, protect your personal information, and report anything that makes you uncomfortable.&rdquo;
        </p>
      </section>

      {/* 2. Key Safety Pillars */}
      <div className="space-y-6 pt-2">
        {/* Section: Protect Your Privacy */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <LockClosedIcon className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-gray-900">
              1. Protect Your Privacy
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-600">
            Keep your personal identity secure. When speaking to strangers, adhere strictly to these rules:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-700">
            <li className="flex items-center gap-2 rounded-lg bg-gray-50 p-2.5 border border-gray-100">
              <span className="text-red-500 font-bold">•</span>
              <span><strong>Don&rsquo;t share passwords:</strong> Never reveal credentials or authentication codes to anyone.</span>
            </li>
            <li className="flex items-center gap-2 rounded-lg bg-gray-50 p-2.5 border border-gray-100">
              <span className="text-red-500 font-bold">•</span>
              <span><strong>Don&rsquo;t share financial information:</strong> Keep bank details, card numbers, and UPI IDs private.</span>
            </li>
            <li className="flex items-center gap-2 rounded-lg bg-gray-50 p-2.5 border border-gray-100">
              <span className="text-red-500 font-bold">•</span>
              <span><strong>Don&rsquo;t share your home address:</strong> Never disclose where you live, work, or study.</span>
            </li>
            <li className="flex items-center gap-2 rounded-lg bg-gray-50 p-2.5 border border-gray-100">
              <span className="text-red-500 font-bold">•</span>
              <span><strong>Avoid sharing sensitive personal information:</strong> Keep government IDs, phone numbers, and family info confidential.</span>
            </li>
          </ul>
        </section>

        {/* Section: Respect Other People */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 shadow-xs space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <HeartIcon className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-gray-900">
              2. Respect Other People
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Treat every individual with courtesy and kindness. People join RandomConnect from different cultures and
            backgrounds. Harassment, insults, hate speech, vulgarity, and bullying are strictly forbidden and result
            in immediate account termination.
          </p>
        </section>

        {/* Section: Report or Block */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <ShieldExclamationIcon className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-gray-900">
              3. Report or Block
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            You are always in control of your screen. If another user acts inappropriately, breaks the rules, or makes
            you uncomfortable, use the in-app safety tools immediately:
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
              <ShieldExclamationIcon className="h-4 w-4" />
              <span>Report User: Logs incident for moderator investigation</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
              <HandRaisedIcon className="h-4 w-4" />
              <span>Block User: Prevents future matchmaking with that user</span>
            </span>
          </div>
        </section>

        {/* Section: End the Conversation */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 shadow-xs space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-gray-900">
              4. End the Conversation
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            You are never obligated to continue talking to anyone. At the first sign of discomfort or pressure,
            simply click <strong>&ldquo;Next Stranger&rdquo;</strong> to switch to a new partner, or click
            <strong>&ldquo;End Call&rdquo;</strong> to leave the waiting room completely.
          </p>
        </section>

        {/* Section: Meet Responsibly */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 shadow-xs space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <MapPinIcon className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-gray-900">
              5. Meet Responsibly
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            RandomConnect is designed for spontaneous online video encounters. Do not agree to meet strangers
            in-person. Do not disclose your current physical location, travel itinerary, or daily routines.
          </p>
        </section>

        {/* Section: Never Send Money */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 shadow-xs space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <BanknotesIcon className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-gray-900">
              6. Never Send Money
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Never send money, cryptocurrency, gift cards, or financial assistance to anyone you meet online, regardless
            of the story they tell. Requests for funds are a primary indicator of fraud. Report anyone who asks for
            financial transfers immediately.
          </p>
        </section>
      </div>

      {/* 3. Action Hub */}
      <section className="mt-8 rounded-2xl border border-gray-200 bg-gray-50/70 p-6 text-center space-y-4">
        <h3 className="text-sm font-bold text-gray-900">
          In-App Safety Controls Summary
        </h3>
        <p className="text-xs text-gray-600 max-w-lg mx-auto">
          These controls are directly accessible whenever you are inside the Video Waiting Room:
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/waiting"
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 transition inline-flex items-center gap-1.5"
          >
            <ShieldExclamationIcon className="h-4 w-4 text-red-500" />
            <span>Report Control</span>
          </Link>
          <Link
            to="/waiting"
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 transition inline-flex items-center gap-1.5"
          >
            <HandRaisedIcon className="h-4 w-4 text-amber-600" />
            <span>Block Control</span>
          </Link>
          <Link
            to="/waiting"
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 transition inline-flex items-center gap-1.5"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4 text-indigo-600" />
            <span>End Conversation</span>
          </Link>
          <Link
            to="/contact"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
          >
            Contact Safety Team
          </Link>
        </div>
      </section>
    </LegalLayout>
  )
}
