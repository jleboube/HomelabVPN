import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Tag, Zap, Shield, Bug, Sparkles } from 'lucide-react'

export const metadata = {
  title: 'Changelog - HomelabVPN',
  description: 'See what\'s new in HomelabVPN - release notes, updates, and improvements.',
}

const changeTypes = {
  feature: { icon: Sparkles, label: 'New Feature', color: 'text-green-400 bg-green-400/10' },
  improvement: { icon: Zap, label: 'Improvement', color: 'text-cyan-400 bg-cyan-400/10' },
  security: { icon: Shield, label: 'Security', color: 'text-purple-400 bg-purple-400/10' },
  fix: { icon: Bug, label: 'Bug Fix', color: 'text-orange-400 bg-orange-400/10' },
}

const releases = [
  {
    version: '1.2.0',
    date: 'January 31, 2026',
    changes: [
      { type: 'feature' as const, description: 'Added 3 new server locations: Australia (Sydney), Canada (Toronto), and France (Paris)' },
      { type: 'feature' as const, description: 'Introduced flexible billing with daily, monthly, and yearly subscription options' },
      { type: 'improvement' as const, description: 'Improved server load balancing for better connection speeds' },
      { type: 'security' as const, description: 'Updated WireGuard to latest version with enhanced cryptographic primitives' },
      { type: 'fix' as const, description: 'Fixed configuration download issue on Safari browsers' },
    ],
  },
  {
    version: '1.1.0',
    date: 'January 15, 2026',
    changes: [
      { type: 'feature' as const, description: 'Launched Pro subscription tier with additional features' },
      { type: 'feature' as const, description: 'Added support for multiple device configurations' },
      { type: 'improvement' as const, description: 'Redesigned user dashboard with better status visibility' },
      { type: 'improvement' as const, description: 'Enhanced mobile responsiveness across all pages' },
      { type: 'security' as const, description: 'Implemented additional rate limiting on authentication endpoints' },
    ],
  },
  {
    version: '1.0.0',
    date: 'January 1, 2026',
    changes: [
      { type: 'feature' as const, description: 'Initial release of HomelabVPN' },
      { type: 'feature' as const, description: 'WireGuard-based VPN with 7 server locations' },
      { type: 'feature' as const, description: 'Automatic configuration generation and download' },
      { type: 'feature' as const, description: 'Secure Stripe payment integration' },
      { type: 'security' as const, description: 'Implemented strict no-logs policy with RAM-only servers' },
    ],
  },
]

export default function Changelog() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 mb-6">
              <Tag className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Changelog
            </h1>
            <p className="text-xl text-slate-400">
              Stay up to date with the latest HomelabVPN updates and improvements.
            </p>
          </div>

          <div className="space-y-12">
            {releases.map((release, releaseIndex) => (
              <div key={releaseIndex} className="relative">
                {/* Timeline line */}
                {releaseIndex < releases.length - 1 && (
                  <div className="absolute left-6 top-16 bottom-0 w-px bg-white/10" />
                )}

                {/* Version header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {release.version.split('.')[0]}.{release.version.split('.')[1]}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Version {release.version}</h2>
                    <p className="text-slate-400 text-sm">{release.date}</p>
                  </div>
                </div>

                {/* Changes */}
                <div className="ml-16 space-y-3">
                  {release.changes.map((change, changeIndex) => {
                    const typeInfo = changeTypes[change.type]
                    const Icon = typeInfo.icon
                    return (
                      <div
                        key={changeIndex}
                        className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${typeInfo.color}`}>
                            <Icon className="w-3 h-3" />
                            {typeInfo.label}
                          </div>
                          <p className="text-slate-300 flex-1">{change.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Subscribe section */}
          <div className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 text-center">
            <h3 className="text-xl font-semibold text-white mb-3">
              Stay Updated
            </h3>
            <p className="text-slate-400 mb-6">
              We&apos;ll notify you via email when we release major updates and new features.
            </p>
            <a
              href="/dashboard"
              className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
            >
              Sign In to Your Account
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
