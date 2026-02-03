'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { motion } from 'framer-motion'
import {
  Search,
  Monitor,
  Smartphone,
  Settings,
  CreditCard,
  Shield,
  HelpCircle,
  ChevronRight,
  ExternalLink
} from 'lucide-react'

const categories = [
  {
    icon: Monitor,
    title: 'Getting Started',
    description: 'New to HomelabVPN? Start here.',
    articles: [
      { title: 'How to create an account', href: '/setup-guide#create-account' },
      { title: 'Download and install the VPN', href: '/setup-guide#download' },
      { title: 'Connect to your first server', href: '/setup-guide#connect' },
      { title: 'Understanding your dashboard', href: '/setup-guide#dashboard' },
    ],
  },
  {
    icon: Smartphone,
    title: 'Device Setup',
    description: 'Configure VPN on any device.',
    articles: [
      { title: 'Setup on macOS', href: '/setup-guide#macos' },
      { title: 'Setup on iOS', href: '/setup-guide#ios' },
      { title: 'Setup on Windows', href: '/setup-guide#windows' },
      { title: 'Setup on Linux', href: '/setup-guide#linux' },
    ],
  },
  {
    icon: Settings,
    title: 'Configuration',
    description: 'Customize your VPN settings.',
    articles: [
      { title: 'Change DNS settings', href: '/setup-guide#dns' },
      { title: 'Configure kill switch', href: '/setup-guide#killswitch' },
      { title: 'Set up split tunneling', href: '/setup-guide#split-tunneling' },
      { title: 'Import WireGuard config', href: '/setup-guide#import-config' },
    ],
  },
  {
    icon: CreditCard,
    title: 'Billing & Account',
    description: 'Manage your subscription.',
    articles: [
      { title: 'Upgrade or downgrade plan', href: '/dashboard' },
      { title: 'Update payment method', href: '/dashboard' },
      { title: 'Cancel subscription', href: '/dashboard' },
      { title: 'Request a refund', href: '/contact' },
    ],
  },
  {
    icon: Shield,
    title: 'Security & Privacy',
    description: 'Learn about our security.',
    articles: [
      { title: 'Our no-logs policy', href: '/no-logs-policy' },
      { title: 'How WireGuard encryption works', href: '/setup-guide#encryption' },
      { title: 'Why we use RAM-only servers', href: '/no-logs-policy#technical-implementation' },
      { title: 'GDPR and your data rights', href: '/gdpr' },
    ],
  },
  {
    icon: HelpCircle,
    title: 'Troubleshooting',
    description: 'Fix common issues.',
    articles: [
      { title: 'Connection drops frequently', href: '/troubleshooting#connection-drops' },
      { title: 'Slow speeds', href: '/troubleshooting#slow-speeds' },
      { title: 'Cannot connect to server', href: '/troubleshooting#cannot-connect' },
      { title: 'IP address not changing', href: '/troubleshooting#ip-leak' },
    ],
  },
]

const popularArticles = [
  { title: 'How to install WireGuard and import your config', href: '/setup-guide#import-config' },
  { title: 'Which server location should I choose?', href: '/setup-guide#server-selection' },
  { title: 'What is a kill switch and should I enable it?', href: '/setup-guide#killswitch' },
  { title: 'How to check if my VPN is working', href: '/troubleshooting#verify-connection' },
  { title: 'Understanding our subscription plans', href: '/#pricing' },
]

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="max-w-4xl mx-auto text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Help Center
              </h1>
              <p className="text-xl text-slate-400 mb-8">
                Find answers, guides, and support for HomelabVPN
              </p>

              {/* Search */}
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search for help..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </motion.div>
          </div>

          {/* Popular Articles */}
          <div className="max-w-4xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20"
            >
              <h2 className="text-lg font-semibold text-white mb-4">Popular Articles</h2>
              <div className="space-y-2">
                {popularArticles.map((article, index) => (
                  <a
                    key={index}
                    href={article.href}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group"
                  >
                    <span className="text-slate-300 group-hover:text-white transition-colors">
                      {article.title}
                    </span>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                  </a>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Categories */}
          <div className="max-w-6xl mx-auto mb-16">
            <h2 className="text-2xl font-semibold text-white text-center mb-8">Browse by Category</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center mb-4">
                    <category.icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{category.title}</h3>
                  <p className="text-slate-400 text-sm mb-4">{category.description}</p>
                  <ul className="space-y-2">
                    {category.articles.map((article, articleIndex) => (
                      <li key={articleIndex}>
                        <a
                          href={article.href}
                          className="text-sm text-slate-300 hover:text-cyan-400 transition-colors flex items-center gap-1"
                        >
                          <ChevronRight className="w-4 h-4" />
                          {article.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Contact CTA */}
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="p-8 rounded-2xl bg-white/5 border border-white/10"
            >
              <h2 className="text-xl font-semibold text-white mb-3">
                Can&apos;t find what you&apos;re looking for?
              </h2>
              <p className="text-slate-400 mb-6">
                Our support team is here to help. Get in touch and we&apos;ll respond within 24 hours.
              </p>
              <a
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
              >
                Contact Support
                <ExternalLink className="w-4 h-4" />
              </a>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
