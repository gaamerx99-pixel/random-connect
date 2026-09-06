import { Link } from 'react-router-dom'
import { LegalLayout } from '../../layouts/LegalLayout'

export function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="This Privacy Policy explains how RandomConnect collects, uses, protects, and discloses personal information when you use our web platform. We believe in transparency and data minimization."
      metaDescription="RandomConnect Privacy Policy. Honest and transparent disclosure of data collected, WebRTC real-time media handling, storage practices, and user privacy rights."
    >
      {/* Introduction */}
      <section className="space-y-3">
        <p>
          RandomConnect (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your
          privacy and handling your data with honesty and care. This Privacy Policy details the specific data we
          collect through your use of the RandomConnect web application and how that data is processed.
        </p>
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 text-xs text-indigo-900 leading-relaxed">
          <strong>Key Privacy Principle:</strong> RandomConnect connects users for real-time video, audio, and
          text conversations. <strong>We do not record, store, or archive your live audio or video streams.</strong> Text
          chat messages exchanged during a call are transient and not saved to any database.
        </div>
      </section>

      {/* 1. Information We Collect */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          1. Information We Collect
        </h2>
        <p>
          We only collect personal information that is reasonably necessary to provide the matchmaking,
          communication, account security, and moderation features of the platform. We do not collect extraneous
          background records or sell your personal information.
        </p>
      </section>

      {/* 2. Information You Provide */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          2. Information You Provide
        </h2>
        <p>When you configure your RandomConnect profile, you may choose to provide:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
          <li><strong>Display Name:</strong> The name shown to strangers when you connect.</li>
          <li><strong>Age:</strong> Self-declared age (must be 18 or older to access the platform).</li>
          <li><strong>Gender & Preferences:</strong> Your self-identified gender and your matchmaking preference (&ldquo;Anyone,&rdquo; &ldquo;Female,&rdquo; or &ldquo;Male&rdquo;).</li>
          <li><strong>Location Information:</strong> Country and city names entered into your profile settings.</li>
          <li><strong>Languages & Interests:</strong> Spoken languages and personal interest tags to assist in matchmaking.</li>
          <li><strong>Profile Picture & Bio:</strong> An avatar image URL and a brief self-description.</li>
        </ul>
      </section>

      {/* 3. Authentication Information */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          3. Authentication Information
        </h2>
        <p>
          RandomConnect utilizes <strong>Clerk</strong> as its third-party identity and authentication provider.
          When you sign up or log in, Clerk handles your credentials (e.g., email address, password, or Google
          OAuth sign-in). Our backend receives and synchronizes:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
          <li>A unique Clerk User Identifier (<code className="bg-gray-100 px-1 py-0.5 rounded text-xs">clerk_id</code>);</li>
          <li>Your registered email address (used for account management and security notifications);</li>
          <li>Your verified name and profile image as provided by the authentication provider.</li>
        </ul>
        <p>
          We never receive, store, or have access to your raw authentication passwords.
        </p>
      </section>

      {/* 4. Profile and Matching Information */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          4. Profile and Matching Information
        </h2>
        <p>
          To operate the real-time queue, our server manages temporary matching states, including:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
          <li>Online status (<code className="bg-gray-100 px-1 py-0.5 rounded text-xs">is_online</code>);</li>
          <li>Queue entry timestamps and matching eligibility;</li>
          <li>Active connection state (whether you are currently paired in a call);</li>
          <li>Rewarded ad credit counters (such as female matchmaking unlock credits earned through verified ads).</li>
        </ul>
      </section>

      {/* 5. Reports, Blocks and Safety Data */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          5. Reports, Blocks and Safety Data
        </h2>
        <p>
          When you interact with our safety tools:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
          <li><strong>Reports:</strong> If you submit a report against another user, we record the reporter ID, the reported user ID, the selected violation category (e.g., Inappropriate Behavior, Harassment, Underage User), any optional details you provide, and the timestamp. This information is accessible strictly to authorized administrators for safety review.</li>
          <li><strong>Blocks:</strong> If you block a user, that user&rsquo;s identifier is saved to your account&rsquo;s blocked users list and a block record is stored to prevent future matchmaking pairings.</li>
        </ul>
      </section>

      {/* 6. Technical Information */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          6. Technical Information & WebRTC
        </h2>
        <p>
          To establish browser-to-browser WebRTC video and audio streams:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
          <li><strong>Signaling Metadata:</strong> During the connection setup phase, our WebSocket server exchanges transient Session Description Protocol (SDP) offers, answers, and ICE candidate packets between you and your matched peer.</li>
          <li><strong>IP Addresses in P2P Connections:</strong> WebRTC establishes a direct peer-to-peer connection between browsers. By nature of peer-to-peer networking protocols, your device&rsquo;s public IP address is shared directly with the peer&rsquo;s browser to enable data packet transmission.</li>
          <li><strong>Local Device Preferences:</strong> Device labels and hardware IDs for your selected camera and microphone are stored locally on your device in <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">localStorage</code> and are not transmitted to our backend databases.</li>
        </ul>
      </section>

      {/* 7. How We Use Information */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          7. How We Use Information
        </h2>
        <p>We process your data for the following specific purposes:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
          <li>Operating, delivering, and facilitating random video and chat connections;</li>
          <li>Filtering queue matches according to your selected gender and interest preferences;</li>
          <li>Enforcing our 18+ age requirement and Community Guidelines;</li>
          <li>Investigating user reports and taking disciplinary action against abusive accounts;</li>
          <li>Tracking and crediting rewarded ad completions to unlock eligible matching features;</li>
          <li>Preventing fraud, abuse, automated scraping, and unauthorized system access.</li>
        </ul>
      </section>

      {/* 8. How We Share Information */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          8. How We Share Information
        </h2>
        <p>We do not sell, rent, or trade your personal data. Information is shared strictly in the following circumstances:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
          <li><strong>With Your Matched Peer:</strong> When you enter a live session, your peer receives your display name, country, profile initial/image, and your live video and audio stream. They do not receive your email address, full account details, or block list.</li>
          <li><strong>With Service Providers:</strong> We work with trusted infrastructure providers (e.g., Clerk for authentication, MongoDB Atlas for secure cloud database hosting) that process data solely on our behalf under confidentiality agreements.</li>
          <li><strong>For Safety & Legal Compliance:</strong> We may disclose information if required by law, subpoena, or search warrant, or where necessary to prevent imminent physical harm, investigate illegal conduct, or protect the safety of our users.</li>
        </ul>
      </section>

      {/* 9. Third-Party Services */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          9. Third-Party Services
        </h2>
        <p>
          Our application interacts with third-party service providers. We recommend reviewing their respective privacy policies:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
          <li><strong>Authentication:</strong> <a href="https://clerk.com/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Clerk Privacy Policy</a></li>
          <li><strong>Cloud Database:</strong> MongoDB Atlas (encrypted cloud database storage)</li>
          <li><strong>Advertising Partners:</strong> When third-party ad networks (such as Google Ad Manager or web rewarded video tags) are enabled in production, their data practices will be governed by their respective privacy terms.</li>
        </ul>
      </section>

      {/* 10. Data Retention */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          10. Data Retention & Media Storage
        </h2>
        <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 space-y-2 text-xs">
          <p>
            <strong>Live Audio & Video:</strong> We do NOT record, intercept, or store live video or audio streams. Media flows directly between peer browsers via WebRTC.
          </p>
          <p>
            <strong>In-Call Chat Messages:</strong> Text messages sent during a call are transiently routed via WebSocket signaling and held in browser memory during that active session only. They are NOT recorded in our database and disappear when the call ends.
          </p>
          <p>
            <strong>Account & Profile Data:</strong> Retained for as long as your account remains active. If you request account deletion, your profile record is permanently removed from the active database.
          </p>
          <p>
            <strong>Safety & Report Records:</strong> Retained for moderation oversight and audit trails to prevent banned individuals from re-registering.
          </p>
        </div>
      </section>

      {/* 11. Data Security */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          11. Data Security
        </h2>
        <p>
          We employ industry-standard technical and operational safeguards to protect your personal data, including:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
          <li>Transport Layer Security (TLS/HTTPS) encryption for all web and API traffic;</li>
          <li>Secure RS256/JWT token authentication on all protected endpoints;</li>
          <li>WebRTC DTLS/SRTP encryption for peer-to-peer audio and video transmission;</li>
          <li>Strict database role separation and administrative access controls.</li>
        </ul>
        <p className="text-xs text-gray-500">
          While we implement robust security measures, no transmission over the internet or cloud storage system can be guaranteed 100% secure.
        </p>
      </section>

      {/* 12. User Rights / Privacy Requests */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          12. User Rights & Privacy Requests
        </h2>
        <p>Depending on your jurisdiction, you may hold privacy rights regarding your personal information, including:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
          <li><strong>Access & Review:</strong> You can view your profile data at any time via your <Link to="/profile" className="text-indigo-600 hover:underline">Profile Page</Link>.</li>
          <li><strong>Correction:</strong> You can update or correct your profile information directly through your profile settings.</li>
          <li><strong>Erasure / Deletion:</strong> You may request the deletion of your account and personal profile data by contacting us at our <Link to="/contact" className="text-indigo-600 hover:underline">Contact / Grievance Page</Link>.</li>
          <li><strong>Objection / Restriction:</strong> You may object to or request restrictions on certain processing activities.</li>
        </ul>
      </section>

      {/* 13. Cookies and Local Storage */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          13. Cookies and Local Storage
        </h2>
        <p>
          RandomConnect utilizes browser local storage and authentication cookies to maintain sessions and provide basic functionality.
          We do not run hidden commercial tracking pixels in the application core. For a detailed breakdown of all storage keys, please consult our{' '}
          <Link to="/cookies" className="text-indigo-600 font-medium hover:underline">
            Cookie Policy
          </Link>
          .
        </p>
      </section>

      {/* 14. Children's Privacy / 18+ Restriction */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5 flex items-center justify-between">
          <span>14. Children&rsquo;s Privacy / Strict 18+ Restriction</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-100">
            Minors Prohibited
          </span>
        </h2>
        <p>
          <strong>RandomConnect is an adult-only platform.</strong> We do not knowingly solicit, collect, or maintain
          personal information from individuals under the age of 18. An explicit 18+ age confirmation gate is
          enforced before any user may access the application.
        </p>
        <p>
          If we discover or are notified that an account belongs to or is operated by someone under 18 years of age,
          we will immediately terminate the account and permanently delete all associated personal data. Parents,
          guardians, or users who suspect an underage user is on the platform should report the account immediately or
          contact us via our{' '}
          <Link to="/contact" className="text-indigo-600 font-medium hover:underline">
            Safety & Grievance Contact
          </Link>
          .
        </p>
      </section>

      {/* 15. International Data Transfers */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          15. International Data Transfers
        </h2>
        <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 text-xs text-gray-700 leading-relaxed">
          <strong>Cross-Border Operations:</strong> RandomConnect is accessible globally. Our servers, databases,
          and authentication providers may be located in regions outside your country of residence (such as the
          United States or Europe). By using the Service, you acknowledge that your information may be transferred
          to and processed in countries with data protection laws that may differ from those of your local jurisdiction.
        </div>
      </section>

      {/* 16. Changes to Privacy Policy */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          16. Changes to This Privacy Policy
        </h2>
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our technology, legal obligations,
          or operational practices. When updates are published, the &ldquo;Effective Date&rdquo; at the top of this
          page will be revised. We encourage you to periodically review this page to stay informed about how we are
          safeguarding your information.
        </p>
      </section>

      {/* 17. Contact / Grievance */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          17. Contact & Privacy Requests
        </h2>
        <p>
          If you have questions regarding this Privacy Policy, wish to submit a data access or deletion request, or
          wish to contact our Grievance Officer, please visit our{' '}
          <Link to="/contact" className="text-indigo-600 font-medium hover:underline">
            Contact / Grievance Page
          </Link>
          .
        </p>
      </section>
    </LegalLayout>
  )
}
