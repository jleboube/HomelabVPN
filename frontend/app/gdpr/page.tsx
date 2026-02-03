import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Shield, Download, Trash2, Edit, Eye, Clock } from 'lucide-react'

export const metadata = {
  title: 'GDPR Compliance - HomelabVPN',
  description: 'HomelabVPN GDPR Compliance - Learn about your data rights under GDPR.',
}

const rights = [
  {
    icon: Eye,
    title: 'Right to Access',
    description: 'You can request a copy of all personal data we hold about you.',
  },
  {
    icon: Edit,
    title: 'Right to Rectification',
    description: 'You can request correction of any inaccurate personal data.',
  },
  {
    icon: Trash2,
    title: 'Right to Erasure',
    description: 'You can request deletion of your personal data ("right to be forgotten").',
  },
  {
    icon: Download,
    title: 'Right to Data Portability',
    description: 'You can request your data in a machine-readable format.',
  },
  {
    icon: Clock,
    title: 'Right to Restrict Processing',
    description: 'You can request we limit how we use your data.',
  },
  {
    icon: Shield,
    title: 'Right to Object',
    description: 'You can object to certain types of data processing.',
  },
]

export default function GDPRCompliance() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            GDPR Compliance
          </h1>
          <p className="text-xl text-slate-400 mb-12">
            Your data rights under the General Data Protection Regulation
          </p>

          <div className="prose prose-invert prose-slate max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Our Commitment to GDPR</h2>
              <p className="text-slate-300 mb-4">
                HomelabVPN is committed to protecting the privacy and rights of all users, including those protected by the European Union&apos;s General Data Protection Regulation (GDPR). This page explains how we comply with GDPR and how you can exercise your rights.
              </p>
              <p className="text-slate-300">
                Our strict no-logs policy means we collect minimal data by design, which naturally aligns with GDPR&apos;s data minimization principle.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Your Rights Under GDPR</h2>
              <p className="text-slate-300 mb-6">
                If you are located in the European Economic Area (EEA), you have the following rights:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {rights.map((right, index) => (
                  <div
                    key={index}
                    className="p-5 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
                        <right.icon className="w-5 h-5 text-cyan-400" />
                      </div>
                      <h3 className="text-white font-semibold">{right.title}</h3>
                    </div>
                    <p className="text-slate-400 text-sm">{right.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Data We Process</h2>
              <p className="text-slate-300 mb-4">
                In compliance with GDPR&apos;s transparency requirements, here is a complete list of personal data we process:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-3 px-4 text-white font-semibold">Data Type</th>
                      <th className="py-3 px-4 text-white font-semibold">Purpose</th>
                      <th className="py-3 px-4 text-white font-semibold">Legal Basis</th>
                      <th className="py-3 px-4 text-white font-semibold">Retention</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300">
                    <tr className="border-b border-white/5">
                      <td className="py-3 px-4">Email Address</td>
                      <td className="py-3 px-4">Account management, communication</td>
                      <td className="py-3 px-4">Contract performance</td>
                      <td className="py-3 px-4">Until account deletion</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3 px-4">Payment Data</td>
                      <td className="py-3 px-4">Process subscriptions</td>
                      <td className="py-3 px-4">Contract performance</td>
                      <td className="py-3 px-4">As required by law</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3 px-4">WireGuard Public Key</td>
                      <td className="py-3 px-4">VPN authentication</td>
                      <td className="py-3 px-4">Contract performance</td>
                      <td className="py-3 px-4">Until account deletion</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3 px-4">Support Correspondence</td>
                      <td className="py-3 px-4">Customer support</td>
                      <td className="py-3 px-4">Legitimate interest</td>
                      <td className="py-3 px-4">2 years or upon request</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                <p className="text-slate-300 text-sm">
                  <strong className="text-cyan-400">Note:</strong> Due to our no-logs policy, we do not process any VPN activity data (browsing history, IP addresses, connection times, etc.). This data is never collected in the first place.
                </p>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Legal Basis for Processing</h2>
              <p className="text-slate-300 mb-4">
                Under GDPR, we process your data based on the following legal bases:
              </p>
              <ul className="space-y-4 text-slate-300">
                <li>
                  <strong className="text-white">Contract Performance (Article 6(1)(b)):</strong> Processing necessary to provide our VPN service as agreed when you subscribe.
                </li>
                <li>
                  <strong className="text-white">Legal Obligation (Article 6(1)(c)):</strong> Processing required to comply with legal requirements (e.g., tax records).
                </li>
                <li>
                  <strong className="text-white">Legitimate Interest (Article 6(1)(f)):</strong> Processing for fraud prevention, security, and service improvement, balanced against your rights.
                </li>
                <li>
                  <strong className="text-white">Consent (Article 6(1)(a)):</strong> Where required, we obtain explicit consent (e.g., marketing communications). You can withdraw consent at any time.
                </li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Data Transfers</h2>
              <p className="text-slate-300 mb-4">
                Our VPN servers are located in multiple countries to provide the service. When your data is transferred outside the EEA, we ensure appropriate safeguards are in place:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2">
                <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
                <li>Adequacy decisions for countries with equivalent data protection</li>
                <li>Technical measures ensuring data protection regardless of location</li>
              </ul>
              <p className="text-slate-300 mt-4">
                Remember: due to our no-logs architecture, no personal activity data exists on our VPN servers to transfer.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Data Protection Officer</h2>
              <p className="text-slate-300 mb-4">
                For GDPR-related inquiries, you can contact our data protection team at:
              </p>
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <p className="text-white font-medium">Data Protection Team</p>
                <p className="text-slate-400">HomelabVPN</p>
                <p className="text-cyan-400">
                  <a href="mailto:privacy@vpn.z-q.me" className="hover:text-cyan-300">
                    privacy@vpn.z-q.me
                  </a>
                </p>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">How to Exercise Your Rights</h2>
              <p className="text-slate-300 mb-4">
                To exercise any of your GDPR rights, you can:
              </p>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>Email us at <a href="mailto:privacy@vpn.z-q.me" className="text-cyan-400 hover:text-cyan-300">privacy@vpn.z-q.me</a></li>
                <li>Use the account settings in your dashboard to download or delete your data</li>
                <li>Contact our support team for assistance</li>
              </ul>
              <p className="text-slate-300">
                We will respond to your request within 30 days. If we need more time, we will notify you of the extension and reasons.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Right to Lodge a Complaint</h2>
              <p className="text-slate-300">
                If you believe we have not handled your data appropriately, you have the right to lodge a complaint with your local Data Protection Authority (DPA). We encourage you to contact us first so we can address your concerns directly.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Updates to This Policy</h2>
              <p className="text-slate-300">
                We may update this GDPR compliance page to reflect changes in our practices or legal requirements. Material changes will be communicated via email to all users.
              </p>
              <p className="text-slate-400 mt-4">
                Last updated: January 31, 2026
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
