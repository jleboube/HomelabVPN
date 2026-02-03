'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import {
  Shield,
  Zap,
  Globe,
  Lock,
  Eye,
  Server,
  Smartphone,
  RefreshCw
} from 'lucide-react'

const features = [
  {
    icon: Shield,
    title: 'Zero-Knowledge Architecture',
    description: 'We physically cannot see your activity. No logs. No metadata. No exceptions.',
    color: 'from-cyan-500 to-blue-500',
    delay: 0,
  },
  {
    icon: Zap,
    title: 'WireGuard Protocol',
    description: 'State-of-the-art cryptography with 4x faster speeds than legacy VPN protocols.',
    color: 'from-yellow-500 to-orange-500',
    delay: 0.1,
  },
  {
    icon: Globe,
    title: '10+ Global Locations',
    description: 'Connect from anywhere. US, UK, Germany, Japan, Singapore, and more.',
    color: 'from-green-500 to-emerald-500',
    delay: 0.2,
  },
  {
    icon: Lock,
    title: 'AES-256 Encryption',
    description: 'Military-grade encryption that would take billions of years to crack.',
    color: 'from-teal-500 to-emerald-500',
    delay: 0.3,
  },
  {
    icon: Eye,
    title: 'No User Tracking',
    description: 'Your browsing habits are yours alone. We don\'t sell data. Period.',
    color: 'from-pink-500 to-rose-500',
    delay: 0.4,
  },
  {
    icon: Server,
    title: 'Auto-Scaling Infrastructure',
    description: 'Kubernetes-powered servers that scale with demand. Always fast.',
    color: 'from-indigo-500 to-blue-500',
    delay: 0.5,
  },
  {
    icon: Smartphone,
    title: 'One-Click Install',
    description: 'Works natively with macOS and iOS. No third-party apps required.',
    color: 'from-teal-500 to-cyan-500',
    delay: 0.6,
  },
  {
    icon: RefreshCw,
    title: 'Auto Key Rotation',
    description: 'Optional automatic key rotation for enhanced security.',
    color: 'from-amber-500 to-yellow-500',
    delay: 0.7,
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
}

function FeatureCard({ feature }: { feature: typeof features[0] }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: feature.delay }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="group relative p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 backdrop-blur-sm transition-colors duration-300"
    >
      {/* Gradient glow on hover */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

      {/* Icon */}
      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-4`}>
        <feature.icon className="w-6 h-6 text-white" />
      </div>

      {/* Content */}
      <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
      <p className="text-slate-400 leading-relaxed">{feature.description}</p>

      {/* Decorative corner */}
      <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden rounded-tr-2xl">
        <div className={`absolute top-0 right-0 w-full h-full bg-gradient-to-br ${feature.color} opacity-5 transform rotate-45 translate-x-1/2 -translate-y-1/2`} />
      </div>
    </motion.div>
  )
}

export default function FeatureShowcase() {
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  return (
    <section id="features" className="py-24 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
          animate={{ x: [-50, 50, -50], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 15, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"
          animate={{ x: [50, -50, 50], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 12, repeat: Infinity }}
        />
      </div>

      <div ref={sectionRef} className="container mx-auto px-6 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-medium mb-4">
            Why Choose Us
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Privacy by{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Design
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Built from the ground up with your privacy as the foundation.
            Not an afterthought.
          </p>
        </motion.div>

        {/* Feature grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
