'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { motion } from 'framer-motion'
import { Shield, Lock, Zap, Globe, Users, Heart } from 'lucide-react'

const values = [
  {
    icon: Lock,
    title: 'Privacy First',
    description: 'We believe privacy is a fundamental right, not a luxury. Our entire infrastructure is built around this principle.',
  },
  {
    icon: Shield,
    title: 'No Compromises',
    description: 'We never log your activity, sell your data, or compromise on security. Your trust is our most valuable asset.',
  },
  {
    icon: Zap,
    title: 'Performance',
    description: 'Privacy shouldn\'t mean slow connections. We use WireGuard for blazing-fast speeds without sacrificing security.',
  },
  {
    icon: Globe,
    title: 'Accessibility',
    description: 'Everyone deserves access to a private internet. We keep our pricing fair and our service easy to use.',
  },
]

const stats = [
  { value: '10+', label: 'Server Locations' },
  { value: '99.9%', label: 'Uptime' },
  { value: '0', label: 'Logs Stored' },
  { value: '24/7', label: 'Support' },
]

export default function About() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                About HomelabVPN
              </h1>
              <p className="text-xl text-slate-400 mb-8">
                We started HomelabVPN with a simple mission: provide rock-solid VPN protection without the corporate bloat, invasive tracking, or inflated prices.
              </p>
            </motion.div>
          </div>

          {/* Story Section */}
          <div className="max-w-4xl mx-auto mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="p-8 rounded-2xl bg-white/5 border border-white/10"
            >
              <h2 className="text-2xl font-semibold text-white mb-4">Our Story</h2>
              <div className="space-y-4 text-slate-300">
                <p>
                  HomelabVPN was born from frustration with the VPN industry. Too many providers make grand privacy claims while secretly logging user data, cluttering their apps with ads, and charging premium prices for basic protection.
                </p>
                <p>
                  We took a different approach. Built from the ground up with privacy as the core architecture, not an afterthought. We use WireGuard&mdash;the most modern, secure, and efficient VPN protocol available&mdash;and run our servers on RAM-only infrastructure so no data ever touches a disk.
                </p>
                <p>
                  Our pricing is straightforward because we believe everyone deserves access to genuine privacy. No gimmicks, no hidden fees, no data harvesting to subsidize &ldquo;free&rdquo; tiers.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Stats */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className="text-center p-6 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="text-3xl md:text-4xl font-bold text-cyan-400 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-slate-400 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Values */}
          <div className="max-w-4xl mx-auto mb-20">
            <h2 className="text-2xl font-semibold text-white text-center mb-10">Our Values</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center mb-4">
                    <value.icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{value.title}</h3>
                  <p className="text-slate-400">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="p-8 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Ready to Take Back Your Privacy?
              </h2>
              <p className="text-slate-400 mb-6">
                Join thousands of users who trust HomelabVPN to protect their online activity.
              </p>
              <a
                href="/#pricing"
                className="inline-block px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
              >
                Get Started
              </a>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
