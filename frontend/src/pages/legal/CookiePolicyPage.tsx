import { Link } from 'react-router-dom'
import { LegalLayout } from '../../layouts/LegalLayout'

export function CookiePolicyPage() {
  return (
    <LegalLayout
      title="Cookie Policy"
      subtitle="Understand how RandomConnect uses cookies, local storage, and related browser technologies to make the platform work."
      metaDescription="RandomConnect Cookie Policy. Transparent disclosure of browser local storage and authentication cookies actually used on our platform."
    >
      {/* Overview */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          1. What Are Cookies and Local Storage?
        </h2>
        <p>
          Cookies and browser local storage are standard web technologies that allow websites to store small amounts
          of text or data directly within your web browser. This data enables web applications to remember your
          preferences, maintain your logged-in session, and function smoothly across page reloads.
        </p>
      </section>

      {/* Actual Storage Mechanisms in Use */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          2. Technologies Actually Used by RandomConnect
        </h2>
        <p>
          We believe in strict data honesty. We do not use deceptive tracking technologies. Below is an exhaustive list
          of the local storage keys and cookies used by the current application:
        </p>

        {/* LocalStorage Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Storage Key / Name</th>
                <th className="py-2.5 px-3">Technology</th>
                <th className="py-2.5 px-3">Purpose</th>
                <th className="py-2.5 px-3">Lifespan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-600">
              <tr>
                <td className="py-2.5 px-3 font-mono font-semibold text-gray-900">randomconnect_age_confirmed</td>
                <td className="py-2.5 px-3">Browser LocalStorage</td>
                <td className="py-2.5 px-3">Remembers that you confirmed you are 18 years of age or older so you are not prompted repeatedly.</td>
                <td className="py-2.5 px-3">Persistent until cleared</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono font-semibold text-gray-900">rc_selected_video_device</td>
                <td className="py-2.5 px-3">Browser LocalStorage</td>
                <td className="py-2.5 px-3">Saves your chosen camera hardware ID so you do not have to re-select your preferred camera on every visit.</td>
                <td className="py-2.5 px-3">Persistent until cleared</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono font-semibold text-gray-900">rc_selected_audio_device</td>
                <td className="py-2.5 px-3">Browser LocalStorage</td>
                <td className="py-2.5 px-3">Saves your chosen microphone hardware ID for seamless audio capture in future sessions.</td>
                <td className="py-2.5 px-3">Persistent until cleared</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono font-semibold text-gray-900">rc_guest_session_id</td>
                <td className="py-2.5 px-3">Browser SessionStorage</td>
                <td className="py-2.5 px-3">Temporary identifier for anonymous WebRTC signaling connection routing during an active browser tab.</td>
                <td className="py-2.5 px-3">Tab session only (deleted on close)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono font-semibold text-gray-900">__session, __client_uat</td>
                <td className="py-2.5 px-3">HTTP Cookies (Clerk)</td>
                <td className="py-2.5 px-3">Secure authentication tokens managed by Clerk to keep you securely signed in to your account.</td>
                <td className="py-2.5 px-3">Session / Auth expiration</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Third-Party Trackers & Advertising Disclosure */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          3. Third-Party Trackers & Advertising Cookies
        </h2>
        <p>
          In its current build, RandomConnect <strong>does NOT run third-party advertising cookies, behavioral tracking pixels,
          or cross-site profiling scripts</strong> (such as Facebook Pixel or third-party analytics trackers). Rewarded video
          ads are currently operated via local simulation or privacy-first adapters.
        </p>
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 leading-relaxed">
          <strong>Mandatory Notice for Future Production Deployment:</strong> When third-party advertising networks
          (such as Google Ad Manager, Google Publisher Tag, or programmatic video ad SDKs) or third-party analytics
          services are activated for production monetization, those services will deploy their own cookies and tracking
          mechanisms. <strong>This Cookie Policy will be formally updated to identify each ad partner, categories of data
          collected, and cookie opt-out mechanisms before those technologies are enabled.</strong>
        </div>
      </section>

      {/* How to Manage / Delete */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          4. How to Manage Cookies and Local Storage
        </h2>
        <p>
          You have full control over data stored in your browser. You can view, manage, or delete cookies and local storage
          at any time through your browser settings:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-gray-600">
          <li><strong>Google Chrome:</strong> Settings &rarr; Privacy and security &rarr; Cookies and other site data &rarr; See all site data and permissions.</li>
          <li><strong>Mozilla Firefox:</strong> Settings &rarr; Privacy & Security &rarr; Cookies and Site Data &rarr; Manage Data.</li>
          <li><strong>Apple Safari:</strong> Preferences &rarr; Privacy &rarr; Manage Website Data.</li>
          <li><strong>Microsoft Edge:</strong> Settings &rarr; Cookies and site permissions &rarr; Manage and delete cookies and site data.</li>
        </ul>
        <p className="text-xs text-gray-500">
          Note: If you clear local storage, you will be prompted to re-confirm your 18+ age status and re-select your preferred camera/microphone hardware.
        </p>
      </section>

      {/* Contact Link */}
      <section className="border-t border-gray-100 pt-4 text-xs text-gray-500">
        Have questions about our cookie or local storage practices? Please reach out via our{' '}
        <Link to="/contact" className="text-indigo-600 font-medium hover:underline">
          Contact / Grievance Page
        </Link>
        .
      </section>
    </LegalLayout>
  )
}
