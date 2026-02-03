import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Privacy Policy - HomelabVPN',
  description: 'HomelabVPN Privacy Policy - Learn how we protect your data and privacy.',
}

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">
            Privacy Policy
          </h1>
          <p className="text-slate-400 mb-12">
            Last updated: January 31, 2026
          </p>

          <div className="prose prose-invert prose-slate max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
              <p className="text-slate-300 mb-4">
                HomelabVPN (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our VPN service.
              </p>
              <p className="text-slate-300">
                We operate under a strict no-logs policy, meaning we do not monitor, record, log, store, or share any of your online activity while connected to our VPN servers.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>

              <h3 className="text-xl font-medium text-white mb-3">2.1 Account Information</h3>
              <p className="text-slate-300 mb-4">
                When you create an account, we collect:
              </p>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>Email address (for account management and communication)</li>
                <li>Payment information (processed securely by Stripe; we do not store card details)</li>
                <li>Account credentials (passwords are hashed and never stored in plain text)</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-3">2.2 Information We Do NOT Collect</h3>
              <p className="text-slate-300 mb-4">
                We do NOT collect, log, or store:
              </p>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>Your browsing history or websites visited</li>
                <li>Traffic data or content of your communications</li>
                <li>DNS queries</li>
                <li>Your originating IP address when connected to our VPN</li>
                <li>Connection timestamps that could identify you</li>
                <li>Session duration</li>
                <li>Bandwidth usage tied to individual users</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
              <p className="text-slate-300 mb-4">
                The limited information we collect is used solely for:
              </p>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>Creating and managing your account</li>
                <li>Processing payments and managing subscriptions</li>
                <li>Sending important service updates and security notices</li>
                <li>Providing customer support</li>
                <li>Improving our service (using aggregated, anonymized data only)</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">4. Data Security</h2>
              <p className="text-slate-300 mb-4">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>WireGuard protocol with state-of-the-art cryptography</li>
                <li>256-bit AES encryption for all VPN traffic</li>
                <li>Perfect Forward Secrecy (PFS)</li>
                <li>Regular security audits of our infrastructure</li>
                <li>RAM-only servers that retain no data after reboot</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">5. Third-Party Services</h2>
              <p className="text-slate-300 mb-4">
                We use the following third-party services:
              </p>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li><strong>Stripe:</strong> For secure payment processing. Stripe&apos;s privacy policy applies to payment data.</li>
                <li><strong>Cloudflare:</strong> For DNS services and DDoS protection on our website.</li>
              </ul>
              <p className="text-slate-300">
                These services have their own privacy policies, and we encourage you to review them.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">6. Data Retention</h2>
              <p className="text-slate-300 mb-4">
                We retain your account information for as long as your account is active. If you delete your account, we will delete your personal information within 30 days, except where we are required by law to retain certain records.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">7. Your Rights</h2>
              <p className="text-slate-300 mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Export your data in a portable format</li>
                <li>Withdraw consent at any time</li>
              </ul>
              <p className="text-slate-300">
                To exercise these rights, contact us at <a href="mailto:support@vpn.z-q.me" className="text-cyan-400 hover:text-cyan-300">support@vpn.z-q.me</a>.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">8. Children&apos;s Privacy</h2>
              <p className="text-slate-300">
                Our service is not intended for users under 18 years of age. We do not knowingly collect personal information from children.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">9. Changes to This Policy</h2>
              <p className="text-slate-300">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by email or through a notice on our website. Your continued use of the service after changes become effective constitutes acceptance of the revised policy.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">10. Contact Us</h2>
              <p className="text-slate-300">
                If you have questions about this Privacy Policy, please contact us at:
              </p>
              <p className="text-slate-300 mt-4">
                <strong className="text-white">Email:</strong> <a href="mailto:support@vpn.z-q.me" className="text-cyan-400 hover:text-cyan-300">support@vpn.z-q.me</a>
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
