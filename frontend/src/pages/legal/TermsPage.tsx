import { Link } from 'react-router-dom'
import { LegalLayout } from '../../layouts/LegalLayout'

export function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="Please read these Terms of Service carefully before accessing or using RandomConnect. By accessing or using any part of the service, you agree to become bound by these terms."
      metaDescription="RandomConnect Terms of Service. Review user obligations, strict 18+ eligibility, prohibited conduct, rewarded credits, disclaimers, and service policies."
    >
      {/* 1. Acceptance of Terms */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          1. Acceptance of Terms
        </h2>
        <p>
          These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you
          (&ldquo;User,&rdquo; &ldquo;you,&rdquo; or &ldquo;your&rdquo;) and RandomConnect (&ldquo;we,&rdquo;
          &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By accessing, browsing, registering for, or using the
          RandomConnect web application, services, or associated features (collectively, the &ldquo;Service&rdquo;),
          you acknowledge that you have read, understood, and agreed to be bound by these Terms, as well as our{' '}
          <Link to="/privacy" className="text-indigo-600 font-medium hover:underline">
            Privacy Policy
          </Link>{' '}
          and{' '}
          <Link to="/community-guidelines" className="text-indigo-600 font-medium hover:underline">
            Community Guidelines
          </Link>
          .
        </p>
        <p className="font-medium text-gray-900">
          If you do not agree to all of these Terms, you must immediately cease accessing and using the Service.
        </p>
      </section>

      {/* 2. Eligibility — 18+ Only */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5 flex items-center justify-between">
          <span>2. Eligibility — 18+ Only</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-100">
            Strict 18+ Requirement
          </span>
        </h2>
        <p>
          <strong>RandomConnect is strictly intended for adults aged 18 and over.</strong> You must be at least
          eighteen (18) years of age, or the age of legal majority in your jurisdiction (whichever is greater),
          to access or use the Service.
        </p>
        <p>
          By accessing or using the Service, you affirmatively represent and warrant that you are at least 18 years
          old and possess the legal capacity to enter into these Terms. Underage access is strictly prohibited. If
          we learn or have reason to suspect that any user is under 18 years of age, we will immediately terminate
          their access and remove their associated account data.
        </p>
      </section>

      {/* 3. Description of RandomConnect */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          3. Description of RandomConnect
        </h2>
        <p>
          RandomConnect is an online communications platform designed to connect adult strangers in real time for
          randomized video, audio, and text conversations. The Service utilizes WebRTC technology to establish
          direct peer-to-peer live media connections alongside matchmaking queues and profile preference filtering.
        </p>
        <p>
          Because connections are established spontaneously with strangers around the world, you acknowledge that
          RandomConnect cannot preview, guarantee, or control the real-time statements, behavior, or actions of any
          user you may encounter.
        </p>
      </section>

      {/* 4. User Accounts and Authentication */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          4. User Accounts and Authentication
        </h2>
        <p>
          Authentication on RandomConnect is managed through our secure third-party authentication provider,
          Clerk. You agree to:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
          <li>Provide accurate, current, and truthful information during registration and profile creation.</li>
          <li>Maintain the confidentiality and security of your authentication credentials.</li>
          <li>Promptly notify us via our <Link to="/contact" className="text-indigo-600 hover:underline">Contact / Grievance page</Link> if you discover unauthorized use of your account.</li>
          <li>Accept responsibility for all activities conducted under your account.</li>
        </ul>
        <p>
          You may not register multiple accounts to circumvent disciplinary actions, blocks, or platform restrictions.
        </p>
      </section>

      {/* 5. User Responsibilities */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          5. User Responsibilities
        </h2>
        <p>
          You are solely responsible for your conduct, your communications, your interactions with strangers,
          and any content or live streams you transmit through the Service. You agree to:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
          <li>Comply with all applicable local, national, and international laws, treaties, and regulations.</li>
          <li>Exercise caution and good judgment when communicating with unfamiliar individuals.</li>
          <li>Protect your sensitive personal details, including your full legal name, physical address, financial details, passwords, and contact numbers.</li>
          <li>Immediately terminate any conversation with any individual who behaves inappropriately or makes you feel unsafe.</li>
        </ul>
      </section>

      {/* 6. Prohibited Conduct */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          6. Prohibited Conduct
        </h2>
        <p>
          RandomConnect maintains a strict zero-tolerance policy toward harmful, abusive, illegal, and explicit
          conduct. You explicitly agree that you will <strong>NOT</strong> engage in, facilitate, or encourage any of the
          following:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3">
            <span className="font-bold text-gray-900 block mb-1">Sexual & Explicit Content</span>
            Transmitting nudity, sexually explicit material, pornography, sexual acts, or soliciting sexual encounters.
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3">
            <span className="font-bold text-gray-900 block mb-1">Sexual Harassment & Exploitation</span>
            Non-consensual sexual remarks, unsolicited exposure, sexual exploitation, or coercion of any kind.
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3">
            <span className="font-bold text-gray-900 block mb-1">Protection of Minors</span>
            Any attempt to contact, groom, exploit, solicit, or interact with minors or broadcast underage imagery.
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3">
            <span className="font-bold text-gray-900 block mb-1">Harassment & Bullying</span>
            Intimidating, stalking, threatening, demeaning, or persistently disturbing other participants.
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3">
            <span className="font-bold text-gray-900 block mb-1">Hate Speech & Discrimination</span>
            Attacking, disparaging, or promoting violence against individuals based on race, ethnicity, religion, gender, disability, or orientation.
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3">
            <span className="font-bold text-gray-900 block mb-1">Scams & Financial Fraud</span>
            Requesting money, selling financial schemes, asking for gift cards, cryptocurrency, or wire transfers.
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3">
            <span className="font-bold text-gray-900 block mb-1">Impersonation & Deception</span>
            Impersonating another person, brand, moderator, staff member, or falsifying your identity.
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3">
            <span className="font-bold text-gray-900 block mb-1">Doxxing & Privacy Invasions</span>
            Sharing another person&rsquo;s private information, phone numbers, addresses, social profiles, or images without consent.
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3">
            <span className="font-bold text-gray-900 block mb-1">Illegal Activities & Violence</span>
            Depicting, promoting, or inciting violence, weapon usage, illegal drug trade, self-harm, or unlawful acts.
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3">
            <span className="font-bold text-gray-900 block mb-1">Spam & Commercial Solicitation</span>
            Unsolicited advertising, spam bots, automated broadcasting, commercial promotion, or phishing links.
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3">
            <span className="font-bold text-gray-900 block mb-1">System & Security Tampering</span>
            Reverse-engineering, scraping, automated socket polling, exploiting signaling servers, or bypassing safety gates.
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3">
            <span className="font-bold text-gray-900 block mb-1">Circumvention of Bans</span>
            Creating new accounts or manipulating network parameters to evade administrative blocks or bans.
          </div>
        </div>
      </section>

      {/* 7. Random Video/Audio/Text Conversations */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          7. Random Video/Audio/Text Conversations
        </h2>
        <p>
          You understand that RandomConnect connects you with unvetted strangers over the internet. While we
          provide reporting, blocking, and moderation mechanisms, <strong>we cannot and do not guarantee the identity,
          background, motives, or behavior of any stranger you encounter.</strong>
        </p>
        <p>
          You acknowledge that you enter every conversation voluntarily, assume all associated risks, and retain
          the right and power to end any video or chat connection at any moment by clicking &ldquo;Next Stranger&rdquo;
          or &ldquo;End Call.&rdquo;
        </p>
      </section>

      {/* 8. User-Generated Content */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          8. User-Generated Content
        </h2>
        <p>
          &ldquo;User Content&rdquo; refers to all live audio, video, text messages, profile bios, profile pictures,
          and communications transmitted by you on the Service. You retain ownership of your content. However, by
          transmitting content via the Service, you grant RandomConnect a worldwide, royalty-free, non-exclusive license
          to route, transmit, host, display, and process such content solely to the extent necessary to operate,
          deliver, and protect the Service.
        </p>
        <p>
          You represent that you have all necessary rights, licenses, and consents to transmit any content you share,
          and that your content does not infringe upon any third-party intellectual property or privacy rights.
        </p>
      </section>

      {/* 9. Reporting, Blocking and Moderation */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          9. Reporting, Blocking and Moderation
        </h2>
        <p>
          To maintain a safe environment, RandomConnect provides user-accessible safety tools:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
          <li><strong>Report:</strong> You may file a report against any peer during a live session, specifying reasons such as inappropriate behavior, harassment, nudity, or underage suspicion. Reports are logged for review by platform administrators.</li>
          <li><strong>Block:</strong> When you block a user, that user is recorded to your blocklist and our matchmaking queue will prevent future pairings between your accounts.</li>
          <li><strong>Moderation:</strong> Our administrative team monitors reported accounts and reserves the right to issue warnings, suspend accounts, or permanently terminate access.</li>
        </ul>
      </section>

      {/* 10. Account Suspension and Termination */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          10. Account Suspension and Termination
        </h2>
        <p>
          We reserve the right, at our sole discretion and without prior notice or liability, to suspend, terminate,
          or restrict your account or access to the Service for any reason, including without limitation:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
          <li>Violation of these Terms or the Community Guidelines;</li>
          <li>Multiple substantiated user reports or safety flags;</li>
          <li>Suspected fraudulent, illegal, or abusive conduct;</li>
          <li>Extended periods of inactivity.</li>
        </ul>
        <p>
          You may terminate your account at any time by discontinuing use of the Service or contacting us to request
          account deletion.
        </p>
      </section>

      {/* 11. Rewarded Ads and Female Connection Credits */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          11. Rewarded Ads and Female Connection Credits
        </h2>
        <p>
          RandomConnect may offer optional features such as gender-preference matching (for example, male users
          seeking female connections) supported by rewarded video advertisements.
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
          <li><strong>Non-Monetary Credits:</strong> Match credits acquired through rewarded ad completions are promotional, non-monetary virtual tokens. They carry no cash value, cannot be exchanged for real currency, and cannot be transferred between accounts.</li>
          <li><strong>Provider Verification:</strong> Credits are awarded only upon verified completion of an advertisement through an authorized provider. Fraudulent or scripted completions will be invalidated.</li>
          <li><strong>Availability:</strong> Rewarded ad availability depends on third-party ad networks, user location, and queue inventory. We do not guarantee that rewarded ads or matching credits will be available at all times.</li>
        </ul>
      </section>

      {/* 12. Third-Party Services */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          12. Third-Party Services
        </h2>
        <p>
          The Service integrates or interacts with third-party providers, including Clerk (for authentication),
          WebRTC STUN/TURN infrastructure, and potential advertising networks. Your use of third-party services is
          governed by the respective terms and privacy policies of those providers. RandomConnect is not responsible
          for the content, availability, or practices of third-party services.
        </p>
      </section>

      {/* 13. Intellectual Property */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          13. Intellectual Property
        </h2>
        <p>
          The Service, including its logos, brand identity, visual interface, source code, designs, algorithms,
          and documentation, is the proprietary property of RandomConnect and its licensors and is protected by
          applicable copyright, trademark, and intellectual property laws. You may not copy, modify, distribute,
          sell, or reverse-engineer any part of the Service without our prior written authorization.
        </p>
      </section>

      {/* 14. Service Availability */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          14. Service Availability
        </h2>
        <p>
          We strive to keep the Service online and reliable. However, the Service is provided on an &ldquo;AS IS&rdquo;
          and &ldquo;AS AVAILABLE&rdquo; basis. We do not guarantee uninterrupted, bug-free, or error-free operation.
          The Service may be temporarily unavailable due to maintenance, system upgrades, network congestion, or
          unforeseen technical disruptions.
        </p>
      </section>

      {/* 15. Disclaimer of Warranties */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          15. Disclaimer of Warranties
        </h2>
        <p className="uppercase text-xs font-semibold tracking-wider text-gray-500">
          Please read this section carefully.
        </p>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, RANDOMCONNECT DISCLAIMS ALL WARRANTIES OF ANY KIND,
          WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING WITHOUT LIMITATION WARRANTIES OF
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
        </p>
        <p>
          WE MAKE NO REPRESENTATIONS OR WARRANTIES CONCERNING: (A) THE ACCURACY OR TRUTHFULNESS OF USER IDENTITIES
          OR PROFILES; (B) THE SAFETY OR CONDUCT OF ANY USER; (C) THE QUALITY OR CONTINUITY OF WEBRTC PEER
          CONNECTIONS; OR (D) THAT THE SERVICE WILL MEET YOUR INDIVIDUAL EXPECTATIONS.
        </p>
      </section>

      {/* 16. Limitation of Liability */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          16. Limitation of Liability
        </h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL RANDOMCONNECT, ITS OPERATORS,
          DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
          PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, GOODWILL, OR PERSONAL DISTRESS
          ARISING OUT OF OR RELATED TO:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-gray-600">
          <li>YOUR ACCESS TO OR INABILITY TO ACCESS OR USE THE SERVICE;</li>
          <li>THE CONDUCT, STATEMENTS, OR CONTENT OF ANY THIRD PARTY OR STRANGER ON THE SERVICE;</li>
          <li>ANY CONTENT OR SENSITIVE INFORMATION SHARED DURING A VIDEO, AUDIO, OR CHAT CALL;</li>
          <li>UNAUTHORIZED ACCESS TO OR ALTERATION OF YOUR TRANSMISSIONS.</li>
        </ul>
        <p>
          IN NO EVENT SHALL OUR TOTAL AGGREGATE LIABILITY EXCEED THE GREATER OF ONE HUNDRED DOLLARS ($100 USD) OR
          THE AMOUNT PAID BY YOU TO RANDOMCONNECT IN THE PAST TWELVE MONTHS.
        </p>
      </section>

      {/* 17. Changes to the Service and Terms */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          17. Changes to the Service and Terms
        </h2>
        <p>
          We reserve the right to revise, update, or replace these Terms at any time. When material changes are made,
          we will update the &ldquo;Effective Date&rdquo; at the top of this document. Your continued use of the Service
          after any revision constitutes your acceptance of the revised Terms. If you do not accept the new terms,
          you must discontinue using the Service.
        </p>
      </section>

      {/* 18. Contact / Grievance */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          18. Contact / Grievance
        </h2>
        <p>
          If you have questions regarding these Terms of Service, wish to report a violation, or need to file a formal
          grievance, please visit our dedicated{' '}
          <Link to="/contact" className="text-indigo-600 font-medium hover:underline">
            Contact / Grievance Page
          </Link>
          .
        </p>
      </section>

      {/* 19. Governing Law */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5">
          19. Governing Law & Jurisdiction
        </h2>
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 leading-relaxed">
          <strong>Production Configuration Notice:</strong> These Terms and any dispute arising out of or related
          to the Service shall be governed by and construed in accordance with the applicable laws of the operating
          entity&rsquo;s jurisdiction, without giving effect to conflict of laws principles. Specific dispute
          resolution, arbitration venue, and statutory jurisdiction clauses should be reviewed and configured by legal
          counsel prior to commercial deployment.
        </div>
      </section>
    </LegalLayout>
  )
}
