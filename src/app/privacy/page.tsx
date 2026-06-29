import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | ContentAI',
  description: 'Privacy Policy for ContentAI — PIPEDA & Quebec Law 25 compliant.',
}

const LAST_UPDATED = 'June 1, 2025'
const EMAIL = 'privacy@contentai.app'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-[#0D7377] hover:underline text-sm mb-8 inline-block">← Back to home</Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated: {LAST_UPDATED}</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
            <p className="text-gray-600 leading-relaxed">
              ContentAI (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your personal
              information. This Privacy Policy explains how we collect, use, disclose, and safeguard
              your information in compliance with Canada&apos;s <strong>Personal Information Protection and
              Electronic Documents Act (PIPEDA)</strong> and Quebec&apos;s <strong>Act respecting the protection
              of personal information in the private sector (Law 25)</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li><strong>Account data:</strong> email address, name, and password (hashed) when you register.</li>
              <li><strong>Content data:</strong> topics, tones, and generated content you create using our service.</li>
              <li><strong>Usage data:</strong> page views, feature usage, and session duration for analytics.</li>
              <li><strong>Payment data:</strong> billing information processed securely by Stripe — we never store card numbers.</li>
              <li><strong>Technical data:</strong> IP address, browser type, device identifiers, and cookies.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>To provide, maintain, and improve the ContentAI service.</li>
              <li>To process payments and manage subscriptions.</li>
              <li>To send transactional emails (account confirmations, billing receipts).</li>
              <li>To send marketing emails where you have given consent (you may opt out at any time).</li>
              <li>To analyze usage patterns and improve our product.</li>
              <li>To comply with legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Legal Basis for Processing</h2>
            <p className="text-gray-600 leading-relaxed">
              We process your personal information on the following legal bases:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-2">
              <li><strong>Contract performance:</strong> to deliver the service you signed up for.</li>
              <li><strong>Consent:</strong> for marketing communications and optional analytics.</li>
              <li><strong>Legitimate interests:</strong> for security monitoring and fraud prevention.</li>
              <li><strong>Legal obligation:</strong> to comply with applicable laws.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Sharing and Third Parties</h2>
            <p className="text-gray-600 leading-relaxed mb-2">We share your data only with:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li><strong>Supabase</strong> — database and authentication (EU-hosted, SOC 2 compliant).</li>
              <li><strong>Anthropic</strong> — AI content generation (your prompts are sent to their API; see Anthropic&apos;s privacy policy).</li>
              <li><strong>Stripe</strong> — payment processing (PCI DSS Level 1 compliant).</li>
              <li><strong>Resend</strong> — transactional email delivery.</li>
              <li><strong>Law enforcement</strong> — only when required by law or court order.</li>
            </ul>
            <p className="text-gray-600 mt-3">We do not sell your personal information to third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Data Retention</h2>
            <p className="text-gray-600 leading-relaxed">
              We retain your personal information for as long as your account is active or as needed
              to provide services. Generated content is retained until you delete it. You may request
              deletion of your account and all associated data at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Your Rights</h2>
            <p className="text-gray-600 leading-relaxed mb-2">
              Under PIPEDA and Quebec Law 25, you have the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Access the personal information we hold about you.</li>
              <li>Correct inaccurate or incomplete information.</li>
              <li>Withdraw consent for optional processing (e.g., marketing emails).</li>
              <li>Request deletion of your personal information.</li>
              <li>Lodge a complaint with the Office of the Privacy Commissioner of Canada.</li>
            </ul>
            <p className="text-gray-600 mt-3">
              To exercise these rights, contact us at{' '}
              <a href={`mailto:${EMAIL}`} className="text-[#0D7377] hover:underline">{EMAIL}</a>.
              We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Cookies</h2>
            <p className="text-gray-600 leading-relaxed">
              We use essential cookies for authentication and session management. We use optional
              analytics cookies with your consent. You may withdraw cookie consent at any time via
              the cookie settings banner or your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Security</h2>
            <p className="text-gray-600 leading-relaxed">
              We implement industry-standard security measures including encryption in transit (TLS),
              row-level security on all database tables, hashed passwords, and regular security audits.
              However, no system is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Changes to This Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of material
              changes by email or by displaying a prominent notice on our website.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              For privacy inquiries, contact our Privacy Officer at{' '}
              <a href={`mailto:${EMAIL}`} className="text-[#0D7377] hover:underline">{EMAIL}</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
