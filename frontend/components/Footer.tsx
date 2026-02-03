'use client'

import { motion } from 'framer-motion'
import { Shield, Github, Twitter, Mail } from 'lucide-react'

const footerLinks = {
  product: [
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'Download', href: '/dashboard' },
    { label: 'Changelog', href: '/changelog' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Status', href: '/status' },
    { label: 'Setup Guide', href: '/setup-guide' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'No-Logs Policy', href: '/no-logs-policy' },
    { label: 'GDPR', href: '/gdpr' },
  ],
  support: [
    { label: 'Help Center', href: '/help' },
    { label: 'Troubleshooting', href: '/troubleshooting' },
    { label: 'API Docs', href: '/api-docs' },
    { label: 'FAQ', href: '/#faq' },
  ],
}

const socialLinks = [
  { icon: Twitter, href: 'https://twitter.com/homelabvpn', label: 'Twitter' },
  { icon: Github, href: 'https://github.com/homelabvpn', label: 'GitHub' },
  { icon: Mail, href: 'mailto:support@vpn.z-q.me', label: 'Email' },
]

export default function Footer() {
  return (
    <footer className="relative pt-24 pb-12 border-t border-white/5">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-16">
          {/* Brand column */}
          <div className="col-span-2">
            <motion.a
              href="/"
              className="flex items-center gap-2 mb-4"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Homelab<span className="text-cyan-400">VPN</span>
              </span>
            </motion.a>
            <p className="text-slate-400 mb-6 max-w-xs">
              Military-grade privacy protection. No logs. No tracking.
              Your internet, your rules.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-cyan-500/50 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white font-semibold mb-4 capitalize">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-slate-400 hover:text-cyan-400 transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} HomelabVPN. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-slate-500 text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
