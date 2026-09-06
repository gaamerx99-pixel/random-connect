import { Link } from 'react-router-dom'
import {
  ShieldExclamationIcon,
  HandRaisedIcon,
  ArrowRightOnRectangleIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline'
import { LegalLayout } from '../../layouts/LegalLayout'

export function CommunityGuidelinesPage() {
  const prohibitedItems = [
    {
      title: 'Nudity & Sexual/Explicit Content',
      desc: 'Broadcasting nudity, sexual acts, pornographic material, masturbation, or displaying sexually explicit items is strictly prohibited.',
    },
    {
      title: 'Sexual Harassment & Exploitation',
      desc: 'Unsolicited sexual advances, sexually suggestive remarks, coerced behavior, non-consensual exposure, or sexual exploitation will result in immediate bans.',
    },
    {
      title: 'Minors & Child Safety',
      desc: 'RandomConnect is an 18+ platform. Minors are strictly prohibited. Any attempt to solicit, contact, groom, or depict individuals under 18 will be reported to law enforcement.',
    },
    {
      title: 'Harassment, Bullying & Threats',
      desc: 'Targeting individuals with insults, persistent intimidation, threats of violence, degradation, or malicious bullying is unacceptable.',
    },
    {
      title: 'Hate Speech & Discrimination',
      desc: 'Promoting hatred, dehumanizing language, slurs, or discrimination on the basis of race, ethnicity, religion, disability, gender, age, or sexual orientation is banned.',
    },
    {
      title: 'Scams, Fraud & Financial Solicitation',
      desc: 'Asking for money, selling subscriptions, promoting investment or crypto schemes, requesting gift cards, or engaging in fraudulent deception.',
    },
    {
      title: 'Impersonation & False Identity',
      desc: 'Pretending to be someone else, posing as a celebrity or organization, or falsifying your identity to mislead others.',
    },
    {
      title: 'Doxxing & Private Information Sharing',
      desc: 'Sharing another person’s telephone number, residential address, social media handle, private photographs, or sensitive data without explicit consent.',
    },
    {
      title: 'Illegal Activities & Weapons',
      desc: 'Depicting or encouraging illegal drug consumption, brandishing weapons, facilitating unlawful transactions, or inciting violence.',
    },
    {
      title: 'Spam, Bots & Automated Broadcasting',
      desc: 'Using automated bots, continuous looped prerecorded video, spam links, commercial broadcasting, or disrupting platform services.',
    },
    {
      title: 'Abusive & Malicious Behavior',
      desc: 'Intentionally trolling, creating hostile environments, or attempting to compromise other users’ digital security.',
    },
  ]

  return (
    <LegalLayout
      title="Community Guidelines"
      subtitle="Be respectful. Stay safe."
      metaDescription="RandomConnect Community Guidelines. Our standards for respectful, safe, and adult-only random video, audio, and text chat."
    >
      {/* Core Mission Banner */}
      <section className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6 sm:p-8 text-center space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xs">
          <HeartIcon className="h-6 w-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
          Be respectful. Stay safe.
        </h2>
        <p className="max-w-2xl mx-auto text-sm text-gray-600 leading-relaxed">
          RandomConnect connects you with people you may not know from communities across the world. Our
          mission is to provide a spontaneous, friendly, and welcoming space for adult video and text
          conversations. To keep this community positive and safe, everyone must abide by these guidelines.
        </p>
      </section>

      {/* Golden Rule of Personal Information */}
      <section className="rounded-2xl border border-red-200 bg-red-50/70 p-5 sm:p-6 text-red-950 space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm text-red-900">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600 shrink-0" />
          <span>Important Safety Warning</span>
        </div>
        <p className="text-sm font-semibold leading-relaxed">
          Never share passwords, financial information, home address, or other sensitive personal information with strangers.
        </p>
        <p className="text-xs text-red-800/90 leading-relaxed">
          Strangers you meet on the internet do not need to know where you live, where you work, your financial
          details, or your private contact channels. Keep your interactions on the platform and guard your privacy.
        </p>
      </section>

      {/* Prohibited Conduct Grid */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
          <NoSymbolIcon className="h-5 w-5 text-red-500" />
          <span>What Is Strictly Prohibited</span>
        </h2>
        <p className="text-sm text-gray-600">
          We maintain zero tolerance for conduct that compromises user safety, dignity, or legal compliance. Engaging
          in any of the following will lead to immediate moderation intervention:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
          {prohibitedItems.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-gray-200 bg-[#f9fafb] p-4 text-xs transition hover:border-gray-300"
            >
              <h3 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h3>
              <p className="text-gray-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Clear Instructions for Uncomfortable Situations */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-gray-900">
          What to Do If You Encounter Inappropriate Behavior
        </h2>
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 text-xs sm:text-sm font-semibold text-indigo-950">
          &ldquo;If someone makes you uncomfortable, end the conversation, block them, and report them.&rdquo;
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/50 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
            </div>
            <div>
              <strong className="block text-gray-900 mb-0.5">1. End Conversation</strong>
              <span className="text-gray-600">Click &ldquo;Next Stranger&rdquo; or &ldquo;End Call&rdquo; to immediately disconnect.</span>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/50 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <HandRaisedIcon className="h-4 w-4" />
            </div>
            <div>
              <strong className="block text-gray-900 mb-0.5">2. Block Them</strong>
              <span className="text-gray-600">Use the Block control to ensure you will never be matched again.</span>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/50 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <ShieldExclamationIcon className="h-4 w-4" />
            </div>
            <div>
              <strong className="block text-gray-900 mb-0.5">3. Report Them</strong>
              <span className="text-gray-600">Submit a quick report so our moderation team can take disciplinary action.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Enforcement & Consequences */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          Enforcement & Penalties
        </h2>
        <p className="text-sm text-gray-600">
          Our team investigates reports submitted by users. Violations of these Community Guidelines result in
          disciplinary action based on the severity and frequency of the violation:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-gray-600">
          <li><strong>Official Warnings:</strong> Issued for minor or inadvertent rule infringements.</li>
          <li><strong>Temporary Suspensions:</strong> Access to matchmaking and calls is locked for designated periods.</li>
          <li><strong>Permanent Account Termination:</strong> Severe or repeated violations, including nudity, minor exploitation, hate speech, or harassment, result in permanent bans and hardware/network restrictions.</li>
          <li><strong>Referral to Law Enforcement:</strong> In cases involving criminal conduct, child sexual exploitation, or imminent threats to human life, we cooperate fully with relevant law enforcement authorities.</li>
        </ul>
      </section>

      {/* Related Resources Link */}
      <section className="border-t border-gray-100 pt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="text-gray-500">Need practical tips on avoiding online risks?</span>
        <Link
          to="/safety"
          className="inline-flex items-center gap-1.5 font-semibold text-indigo-600 hover:text-indigo-700"
        >
          <span>Read our Practical Safety Guide</span>
          <span>&rarr;</span>
        </Link>
      </section>
    </LegalLayout>
  )
}
