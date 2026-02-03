'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Wifi,
  Zap,
  Globe,
  Shield,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react'

interface Issue {
  id: string
  icon: typeof AlertTriangle
  title: string
  description: string
  solutions: string[]
}

const issues: Issue[] = [
  {
    id: 'cannot-connect',
    icon: Wifi,
    title: 'Cannot Connect to VPN Server',
    description: 'The VPN connection fails to establish or times out.',
    solutions: [
      'Verify your internet connection is working (try loading a website without VPN).',
      'Check that your subscription is active in your dashboard.',
      'Try a different server location - the current server may be temporarily unavailable.',
      'Ensure your firewall isn\'t blocking WireGuard (UDP port 51820).',
      'Re-download your configuration file from the dashboard and import it again.',
      'Restart the WireGuard application.',
      'If on mobile, ensure you\'ve granted VPN permissions to the app.',
    ],
  },
  {
    id: 'connection-drops',
    icon: AlertTriangle,
    title: 'Connection Drops Frequently',
    description: 'VPN connects but disconnects randomly or frequently.',
    solutions: [
      'Check your base internet connection stability (run a speed test).',
      'Try enabling "Persistent Keepalive" in your WireGuard config (set to 25 seconds).',
      'Switch to a server location closer to your physical location.',
      'If on WiFi, try moving closer to your router or switching to ethernet.',
      'Disable any battery optimization settings that might affect the WireGuard app.',
      'On mobile, disable "Data Saver" or "Low Power Mode" which may interrupt connections.',
      'Update WireGuard to the latest version.',
    ],
  },
  {
    id: 'slow-speeds',
    icon: Zap,
    title: 'Slow VPN Speeds',
    description: 'Internet is noticeably slower when connected to VPN.',
    solutions: [
      'Connect to a server geographically closer to you - distance increases latency.',
      'Check server load on your dashboard and choose a server with lower utilization.',
      'Test your base internet speed (without VPN) to establish a baseline.',
      'Try a different server - some may have better routing to your ISP.',
      'If using WiFi, try a wired ethernet connection for more consistent speeds.',
      'Close bandwidth-heavy applications you\'re not using.',
      'Contact your ISP if your base speeds are unusually low.',
    ],
  },
  {
    id: 'ip-leak',
    icon: Shield,
    title: 'IP Address Not Changing / IP Leak',
    description: 'Websites still show your real IP address while connected.',
    solutions: [
      'Verify WireGuard shows "Active" or "Connected" status.',
      'Clear your browser cache and cookies, then check your IP again.',
      'Try using a different browser or incognito/private mode.',
      'Disable WebRTC in your browser (it can leak your real IP).',
      'Check that "AllowedIPs" in your config includes "0.0.0.0/0" for full tunnel.',
      'Ensure your DNS is set to use the VPN\'s DNS servers.',
      'Run a DNS leak test at dnsleaktest.com to check for DNS leaks.',
    ],
  },
  {
    id: 'dns-issues',
    icon: Globe,
    title: 'DNS Resolution Problems',
    description: 'Websites don\'t load but IP addresses work, or DNS leak detected.',
    solutions: [
      'Check that DNS settings in your WireGuard config point to our DNS servers.',
      'Try flushing your DNS cache (command varies by OS).',
      'Temporarily disable any local DNS services (Pi-hole, AdGuard, etc.).',
      'Verify your router isn\'t forcing DNS servers (common with some ISPs).',
      'On Windows, disable "Smart Multi-Homed Name Resolution" in Group Policy.',
      'Try setting custom DNS (1.1.1.1 or 8.8.8.8) in your WireGuard config.',
    ],
  },
]

function IssueCard({ issue }: { issue: Issue }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div
      id={issue.id}
      className="rounded-xl bg-white/5 border border-white/10 overflow-hidden"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-start gap-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center flex-shrink-0">
          <issue.icon className="w-6 h-6 text-cyan-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">{issue.title}</h3>
          <p className="text-slate-400 text-sm">{issue.description}</p>
        </div>
        <div className="flex-shrink-0 mt-1">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 border-t border-white/5">
          <div className="pt-4">
            <h4 className="text-sm font-semibold text-white mb-3">Solutions to try:</h4>
            <ol className="space-y-3">
              {issue.solutions.map((solution, index) => (
                <li key={index} className="flex items-start gap-3 text-slate-300 text-sm">
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium text-white flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span>{solution}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Troubleshooting() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-600/20 mb-6">
                <AlertTriangle className="w-8 h-8 text-orange-400" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Troubleshooting
              </h1>
              <p className="text-xl text-slate-400">
                Common issues and how to fix them.
              </p>
            </motion.div>
          </div>

          {/* Quick Links */}
          <div className="mb-12 p-6 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20">
            <h2 className="text-lg font-semibold text-white mb-4">Jump to issue:</h2>
            <div className="flex flex-wrap gap-2">
              {issues.map((issue) => (
                <a
                  key={issue.id}
                  href={`#${issue.id}`}
                  className="px-3 py-1.5 rounded-lg bg-white/10 text-slate-300 hover:text-white hover:bg-white/15 transition-colors text-sm"
                >
                  {issue.title}
                </a>
              ))}
            </div>
          </div>

          {/* Issues List */}
          <div className="space-y-4 mb-16">
            {issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>

          {/* Verify Connection Section */}
          <section id="verify-connection" className="mb-16">
            <h2 className="text-2xl font-semibold text-white mb-6">How to Verify Your Connection</h2>
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <p className="text-slate-300 mb-4">
                Use these tools to check if your VPN is working correctly:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <a
                  href="https://whatismyipaddress.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">IP Address Check</span>
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-slate-400 text-sm">
                    Should show VPN server location, not your real location.
                  </p>
                </a>
                <a
                  href="https://dnsleaktest.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">DNS Leak Test</span>
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-slate-400 text-sm">
                    Should only show VPN DNS servers, not your ISP&apos;s.
                  </p>
                </a>
                <a
                  href="https://browserleaks.com/webrtc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">WebRTC Leak Test</span>
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-slate-400 text-sm">
                    Check for IP leaks through WebRTC in your browser.
                  </p>
                </a>
                <a
                  href="https://fast.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">Speed Test</span>
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-slate-400 text-sm">
                    Compare speeds with and without VPN connected.
                  </p>
                </a>
              </div>
            </div>
          </section>

          {/* Still Need Help */}
          <div className="text-center p-8 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-3">
              Still Having Issues?
            </h3>
            <p className="text-slate-400 mb-6">
              If you&apos;ve tried the solutions above and still have problems, our support team is here to help.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/help"
                className="px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/15 transition-colors"
              >
                Help Center
              </a>
              <a
                href="/contact"
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
