import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Terms of Service - HomelabVPN',
  description: 'HomelabVPN Terms of Service - Read our terms and conditions.',
}

export default function TermsOfService() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">
            Terms of Service
          </h1>
          <p className="text-slate-400 mb-12">
            Last updated: January 31, 2026
          </p>

          <div className="prose prose-invert prose-slate max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p className="text-slate-300 mb-4">
                By accessing or using HomelabVPN (&quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, do not use the Service.
              </p>
              <p className="text-slate-300">
                We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting. Your continued use of the Service constitutes acceptance of modified Terms.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
              <p className="text-slate-300 mb-4">
                HomelabVPN provides virtual private network (VPN) services that encrypt your internet connection and mask your IP address. Our service includes:
              </p>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>Encrypted VPN tunnels using WireGuard protocol</li>
                <li>Access to VPN servers in multiple locations</li>
                <li>Client applications and configuration files</li>
                <li>Customer support</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">3. Account Registration</h2>
              <p className="text-slate-300 mb-4">
                To use the Service, you must create an account. You agree to:
              </p>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>
              <p className="text-slate-300">
                You must be at least 18 years old to create an account and use the Service.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">4. Acceptable Use Policy</h2>
              <p className="text-slate-300 mb-4">
                You agree NOT to use the Service for:
              </p>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>Any illegal activities under applicable law</li>
                <li>Distributing malware, viruses, or malicious code</li>
                <li>Unauthorized access to systems or networks</li>
                <li>Harassment, abuse, or harm to others</li>
                <li>Distribution of child exploitation material</li>
                <li>Sending spam or unsolicited communications</li>
                <li>Infringing intellectual property rights</li>
                <li>Activities that could damage our infrastructure or reputation</li>
              </ul>
              <p className="text-slate-300">
                We reserve the right to terminate accounts that violate these policies without refund.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">5. Payment and Billing</h2>

              <h3 className="text-xl font-medium text-white mb-3">5.1 Subscription Plans</h3>
              <p className="text-slate-300 mb-4">
                We offer various subscription plans (daily, monthly, yearly). Prices are displayed at checkout and may change with notice.
              </p>

              <h3 className="text-xl font-medium text-white mb-3">5.2 Automatic Renewal</h3>
              <p className="text-slate-300 mb-4">
                Subscriptions automatically renew unless cancelled before the renewal date. You can cancel anytime through your account dashboard.
              </p>

              <h3 className="text-xl font-medium text-white mb-3">5.3 Refund Policy</h3>
              <p className="text-slate-300 mb-4">
                We offer a 7-day money-back guarantee for new subscribers. To request a refund, contact support within 7 days of your initial purchase. Refunds are not available for renewals or accounts terminated for policy violations.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">6. Service Availability</h2>
              <p className="text-slate-300 mb-4">
                We strive to maintain 99.9% uptime but do not guarantee uninterrupted service. The Service may be temporarily unavailable due to:
              </p>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>Scheduled maintenance (with advance notice when possible)</li>
                <li>Emergency repairs or updates</li>
                <li>Circumstances beyond our control (DDoS attacks, natural disasters, etc.)</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">7. Intellectual Property</h2>
              <p className="text-slate-300 mb-4">
                All content, trademarks, and intellectual property associated with HomelabVPN are owned by us or our licensors. You are granted a limited, non-exclusive license to use our software and services for personal, non-commercial purposes only.
              </p>
              <p className="text-slate-300">
                You may not copy, modify, distribute, sell, or lease any part of our Service or software without explicit written permission.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">8. Limitation of Liability</h2>
              <p className="text-slate-300 mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, HOMELABVPN SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>Loss of profits, data, or business opportunities</li>
                <li>Service interruptions or failures</li>
                <li>Unauthorized access to your data (despite our security measures)</li>
                <li>Actions taken by third parties</li>
              </ul>
              <p className="text-slate-300">
                Our total liability shall not exceed the amount you paid for the Service in the 12 months preceding the claim.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">9. Disclaimer of Warranties</h2>
              <p className="text-slate-300">
                THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE ERROR-FREE, SECURE, OR UNINTERRUPTED. WE DO NOT GUARANTEE COMPLETE ANONYMITY OR PROTECTION FROM ALL SECURITY THREATS.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">10. Indemnification</h2>
              <p className="text-slate-300">
                You agree to indemnify and hold harmless HomelabVPN, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the Service or violation of these Terms.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">11. Termination</h2>
              <p className="text-slate-300 mb-4">
                We may terminate or suspend your account immediately, without prior notice, for:
              </p>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>Violation of these Terms</li>
                <li>Violation of the Acceptable Use Policy</li>
                <li>Fraudulent or illegal activity</li>
                <li>Non-payment of fees</li>
              </ul>
              <p className="text-slate-300">
                You may terminate your account at any time through your account settings.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">12. Governing Law</h2>
              <p className="text-slate-300">
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which HomelabVPN operates, without regard to conflict of law principles.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">13. Contact Information</h2>
              <p className="text-slate-300">
                For questions about these Terms, please contact us at:
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
