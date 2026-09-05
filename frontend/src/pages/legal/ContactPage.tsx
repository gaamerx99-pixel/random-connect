import { useState } from 'react'
import {
  EnvelopeIcon,
  ShieldExclamationIcon,
  DocumentTextIcon,
  ScaleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { LegalLayout } from '../../layouts/LegalLayout'

// Production Configurable Support Email Placeholders
// Override via VITE_SUPPORT_EMAIL, VITE_SAFETY_EMAIL, VITE_GRIEVANCE_EMAIL in .env
const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || 'support@YOUR-DOMAIN.com'
const SAFETY_EMAIL = import.meta.env.VITE_SAFETY_EMAIL || 'safety@YOUR-DOMAIN.com'
const PRIVACY_EMAIL = import.meta.env.VITE_PRIVACY_EMAIL || 'privacy@YOUR-DOMAIN.com'
const GRIEVANCE_EMAIL = import.meta.env.VITE_GRIEVANCE_EMAIL || 'grievance@YOUR-DOMAIN.com'

export function ContactPage() {
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [category, setCategory] = useState('General Support')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulated contact dispatch
    setFormSubmitted(true)
  }

  return (
    <LegalLayout
      title="Contact / Grievance Officer"
      subtitle="Reach our support, safety, privacy, and grievance teams. We take user inquiries and safety reports seriously."
      metaDescription="Contact RandomConnect support, safety, and grievance officers. Submit inquiries, report safety concerns, or file formal privacy requests."
    >
      {/* Channels Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 1. General Support */}
        <div className="rounded-xl border border-gray-200 bg-[#f9fafb] p-5 space-y-2">
          <div className="flex items-center gap-2.5 text-indigo-600 font-bold text-sm">
            <EnvelopeIcon className="h-5 w-5" />
            <span>General Support</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            For general technical assistance, account inquiries, bug reports, and feedback.
          </p>
          <div className="pt-2">
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=RandomConnect%20Support%20Inquiry`}
              className="text-xs font-mono font-semibold text-indigo-600 hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>
        </div>

        {/* 2. Safety & Moderation */}
        <div className="rounded-xl border border-gray-200 bg-[#f9fafb] p-5 space-y-2">
          <div className="flex items-center gap-2.5 text-red-600 font-bold text-sm">
            <ShieldExclamationIcon className="h-5 w-5" />
            <span>Safety & Reporting</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            For urgent safety concerns, reporting abusive behavior, harassment, or underage users.
          </p>
          <div className="pt-2">
            <a
              href={`mailto:${SAFETY_EMAIL}?subject=RandomConnect%20Safety%20Report`}
              className="text-xs font-mono font-semibold text-red-600 hover:underline"
            >
              {SAFETY_EMAIL}
            </a>
          </div>
        </div>

        {/* 3. Privacy & Data Requests */}
        <div className="rounded-xl border border-gray-200 bg-[#f9fafb] p-5 space-y-2">
          <div className="flex items-center gap-2.5 text-emerald-600 font-bold text-sm">
            <DocumentTextIcon className="h-5 w-5" />
            <span>Privacy & Data Requests</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            For data access, account deletion requests, or questions regarding our Privacy Policy.
          </p>
          <div className="pt-2">
            <a
              href={`mailto:${PRIVACY_EMAIL}?subject=RandomConnect%20Privacy%20Request`}
              className="text-xs font-mono font-semibold text-emerald-600 hover:underline"
            >
              {PRIVACY_EMAIL}
            </a>
          </div>
        </div>

        {/* 4. Grievance Redressal Officer */}
        <div className="rounded-xl border border-gray-200 bg-[#f9fafb] p-5 space-y-2">
          <div className="flex items-center gap-2.5 text-purple-600 font-bold text-sm">
            <ScaleIcon className="h-5 w-5" />
            <span>Grievance Officer</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            For formal legal complaints, regulatory compliance, and statutory grievances.
          </p>
          <div className="pt-2">
            <a
              href={`mailto:${GRIEVANCE_EMAIL}?subject=Formal%20Grievance%20Notice`}
              className="text-xs font-mono font-semibold text-purple-600 hover:underline"
            >
              {GRIEVANCE_EMAIL}
            </a>
          </div>
        </div>
      </section>

      {/* Production Notice */}
      <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 text-xs text-gray-500 leading-relaxed">
        <strong>Configuration Notice:</strong> Email addresses displayed above use production environment placeholders
        (<code className="bg-gray-100 px-1 py-0.5 rounded text-[11px]">VITE_SUPPORT_EMAIL</code>,{' '}
        <code className="bg-gray-100 px-1 py-0.5 rounded text-[11px]">VITE_GRIEVANCE_EMAIL</code>). Configure your actual
        domain email routing in your production environment settings before launch.
      </div>

      {/* In-Page Direct Contact Form */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-gray-900">
          Send a Direct Message
        </h2>

        {formSubmitted ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center space-y-2">
            <CheckCircleIcon className="h-8 w-8 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-emerald-900">Message Received</h3>
            <p className="text-xs text-emerald-700 max-w-md mx-auto leading-relaxed">
              Thank you for contacting us. Your message has been received and routed to our team for review.
            </p>
            <button
              onClick={() => {
                setFormSubmitted(false)
                setMessage('')
                setSubject('')
              }}
              className="mt-2 text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Inquiry Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-2.5 text-xs text-gray-800 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  required
                >
                  <option value="General Support">General Support</option>
                  <option value="Safety & Harassment Report">Safety & Harassment Report</option>
                  <option value="Privacy / Data Deletion Request">Privacy / Data Deletion Request</option>
                  <option value="Formal Grievance">Formal Grievance</option>
                  <option value="Other">Other Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Your Contact Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-2.5 text-xs text-gray-800 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your inquiry..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-2.5 text-xs text-gray-800 focus:border-indigo-600 focus:bg-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Message Details *
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please describe your inquiry or report in detail..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-2.5 text-xs text-gray-800 focus:border-indigo-600 focus:bg-white focus:outline-none"
                required
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer"
              >
                Submit Message
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Statutory Grievance Redressal Details Notice */}
      <section className="space-y-2 text-xs text-gray-500">
        <h3 className="font-bold text-gray-700">Grievance Redressal Process</h3>
        <p className="leading-relaxed">
          In accordance with applicable online intermediary rules, grievances related to user harassment, illegal
          content, or safety violations are reviewed by our safety operations team. Users are encouraged to provide
          sufficient details (such as approximate timestamp, user display name, and nature of the complaint) to
          assist in swift resolution.
        </p>
      </section>
    </LegalLayout>
  )
}
