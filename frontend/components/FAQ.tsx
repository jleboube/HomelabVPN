'use client'

import { motion, AnimatePresence, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'What makes HomelabVPN different from other VPNs?',
    answer: 'HomelabVPN uses the modern WireGuard protocol, which is significantly faster and more secure than legacy protocols. We operate a zero-knowledge infrastructure, meaning we physically cannot access your browsing data. Plus, our auto-scaling Kubernetes infrastructure ensures consistent performance regardless of user load.',
  },
  {
    question: 'Do you keep any logs of my activity?',
    answer: 'Absolutely not. We maintain a strict no-logs policy. We don\'t track, store, or sell any of your browsing activity, connection timestamps, bandwidth usage, or IP addresses. Our infrastructure is designed so that logging is technically impossible.',
  },
  {
    question: 'How do I set up HomelabVPN on my device?',
    answer: 'It\'s incredibly simple! For macOS and iOS, we provide one-click installation profiles. Just download your configuration file from your dashboard, and your device will automatically configure the VPN. No third-party apps required - it uses the native WireGuard support built into your operating system.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards, debit cards, and digital wallets through our secure Stripe payment processing. All transactions are encrypted and we never store your full payment details on our servers.',
  },
  {
    question: 'Can I use HomelabVPN on multiple devices?',
    answer: 'Yes! The Basic plan supports up to 3 devices simultaneously, while the Pro plan offers unlimited device connections. Each device gets its own unique WireGuard key for maximum security.',
  },
  {
    question: 'What is WireGuard and why is it better?',
    answer: 'WireGuard is a modern VPN protocol that\'s faster, simpler, and more secure than older protocols like OpenVPN or IPSec. It uses state-of-the-art cryptography, has a smaller attack surface (only 4,000 lines of code vs 100,000+ for OpenVPN), and provides 3-4x faster connection speeds.',
  },
  {
    question: 'What is your refund policy?',
    answer: 'We offer a 30-day money-back guarantee for all plans. If you\'re not satisfied with our service for any reason, contact our support team within 30 days of your purchase for a full refund, no questions asked.',
  },
  {
    question: 'How do I cancel my subscription?',
    answer: 'You can cancel your subscription anytime from your dashboard. Your VPN access will remain active until the end of your current billing period. We don\'t do sneaky auto-renewals without notice - you\'ll always receive a reminder before your subscription renews.',
  },
]

function FAQItem({
  faq,
  isOpen,
  onToggle,
  index,
}: {
  faq: typeof faqs[0]
  isOpen: boolean
  onToggle: () => void
  index: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="border-b border-white/10 last:border-0"
    >
      <button
        onClick={onToggle}
        className="w-full py-6 flex items-center justify-between gap-4 text-left"
      >
        <span className="text-lg font-medium text-white pr-8">{faq.question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0"
        >
          <ChevronDown className={`w-5 h-5 ${isOpen ? 'text-cyan-400' : 'text-slate-500'}`} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-slate-400 leading-relaxed">{faq.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  return (
    <section id="faq" className="py-24 relative">
      <div ref={sectionRef} className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-medium mb-4">
            FAQ
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Frequently Asked{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Everything you need to know about HomelabVPN
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm overflow-hidden">
            <div className="p-2 md:p-4">
              {faqs.map((faq, index) => (
                <FAQItem
                  key={index}
                  faq={faq}
                  isOpen={openIndex === index}
                  onToggle={() => setOpenIndex(openIndex === index ? null : index)}
                  index={index}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-12"
        >
          <p className="text-slate-400 mb-4">Still have questions?</p>
          <motion.a
            href="/contact"
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center gap-2 px-6 py-3 border border-cyan-500/50 text-cyan-400 rounded-lg font-medium hover:bg-cyan-500/10 transition-colors"
          >
            Contact Support
          </motion.a>
        </motion.div>
      </div>
    </section>
  )
}
