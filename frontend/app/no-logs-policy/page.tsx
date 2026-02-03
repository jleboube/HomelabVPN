import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Shield, Server, Eye, Clock, Database, Lock } from 'lucide-react'

export const metadata = {
  title: 'No-Logs Policy - HomelabVPN',
  description: 'HomelabVPN No-Logs Policy - We never track, store, or share your online activity.',
}

const noLogItems = [
  {
    icon: Eye,
    title: 'No Browsing History',
    description: 'We never monitor or record the websites you visit, content you access, or searches you perform.',
  },
  {
    icon: Server,
    title: 'No Connection Logs',
    description: 'We do not log connection timestamps, session duration, or the VPN servers you connect to.',
  },
  {
    icon: Database,
    title: 'No Traffic Data',
    description: 'Your data packets, bandwidth usage, and traffic patterns are never stored or analyzed.',
  },
  {
    icon: Clock,
    title: 'No IP Addresses',
    description: 'Your original IP address is never logged when you connect to our servers.',
  },
]

export default function NoLogsPolicy() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-6">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Strict No-Logs Policy
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Your privacy is not a feature&mdash;it&apos;s the foundation of everything we do.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {noLogItems.map((item, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="prose prose-invert prose-slate max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Our Commitment</h2>
              <p className="text-slate-300 mb-4">
                At HomelabVPN, we believe that true privacy means having nothing to share. Our no-logs policy isn&apos;t just a marketing statement&mdash;it&apos;s a technical reality built into our infrastructure from the ground up.
              </p>
              <p className="text-slate-300">
                We operate under the principle that if data doesn&apos;t exist, it cannot be stolen, subpoenaed, or misused. This is why we&apos;ve architected our systems to avoid creating logs in the first place.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">What We Never Log</h2>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Never Logged - Zero Exceptions
                </h3>
                <ul className="grid md:grid-cols-2 gap-3 text-slate-300">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-400 rounded-full" />
                    Browsing history
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-400 rounded-full" />
                    Traffic destination
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-400 rounded-full" />
                    DNS queries
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-400 rounded-full" />
                    Data content
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-400 rounded-full" />
                    Original IP address
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-400 rounded-full" />
                    Connection timestamps
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-400 rounded-full" />
                    Session duration
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-400 rounded-full" />
                    Bandwidth per user
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Technical Implementation</h2>
              <p className="text-slate-300 mb-4">
                Our no-logs policy is enforced through technical measures, not just company policy:
              </p>
              <ul className="space-y-4 text-slate-300">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-cyan-400 text-sm font-semibold">1</span>
                  </div>
                  <div>
                    <strong className="text-white">RAM-Only Servers:</strong> Our VPN servers run entirely from RAM. When a server is powered down or rebooted, all data is permanently erased. No persistent storage is used for VPN operations.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-cyan-400 text-sm font-semibold">2</span>
                  </div>
                  <div>
                    <strong className="text-white">No Logging Configuration:</strong> WireGuard is configured with logging completely disabled at the kernel level. Connection data is processed in memory and immediately discarded.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-cyan-400 text-sm font-semibold">3</span>
                  </div>
                  <div>
                    <strong className="text-white">Shared IP Addresses:</strong> Multiple users share the same VPN IP address, making it impossible to trace activity back to any individual user.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-cyan-400 text-sm font-semibold">4</span>
                  </div>
                  <div>
                    <strong className="text-white">Private DNS:</strong> We operate our own DNS servers with no query logging, preventing DNS-based tracking of your activity.
                  </div>
                </li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">What We Do Store</h2>
              <p className="text-slate-300 mb-4">
                For transparency, here is the limited data we do store for account management:
              </p>
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
                <ul className="space-y-3 text-slate-300">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full" />
                    Email address (for account access and communication)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full" />
                    Subscription status (active, cancelled, etc.)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full" />
                    Payment records (processed by Stripe, we don&apos;t store card details)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full" />
                    WireGuard public keys (required for the VPN connection)
                  </li>
                </ul>
                <p className="text-slate-400 text-sm mt-4">
                  None of this data can be correlated with your online activity because we don&apos;t log activity.
                </p>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Legal Requests</h2>
              <p className="text-slate-300 mb-4">
                If we receive a legal request for user data, we can only provide what we have: email addresses and subscription status. We cannot provide browsing history, connection logs, or any activity data because <strong className="text-white">this data does not exist</strong>.
              </p>
              <p className="text-slate-300">
                We have never provided user activity data to any third party because we have never had it to provide.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Questions?</h2>
              <p className="text-slate-300">
                If you have questions about our no-logs policy, please contact us at{' '}
                <a href="mailto:support@vpn.z-q.me" className="text-cyan-400 hover:text-cyan-300">
                  support@vpn.z-q.me
                </a>
                . We&apos;re happy to explain our technical implementation in detail.
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
