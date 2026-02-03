'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { Check, Sparkles, Zap } from 'lucide-react'

type BillingPeriod = 'daily' | 'monthly' | 'yearly'

interface Plan {
  id: string
  name: string
  description: string
  pricing: {
    daily: number
    monthly: number
    yearly: number
  }
  features: string[]
  popular?: boolean
  icon: typeof Zap
}

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Perfect for individuals who need privacy essentials',
    pricing: {
      daily: 2,
      monthly: 10,
      yearly: 80,
    },
    features: [
      'WireGuard protocol',
      'No activity logs',
      'AES-256 encryption',
      'Up to 3 devices',
      'US server location',
      'Email support',
    ],
    icon: Zap,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For power users who need maximum flexibility',
    pricing: {
      daily: 4,
      monthly: 15,
      yearly: 120,
    },
    features: [
      'Everything in Basic',
      '10+ server locations',
      'Unlimited devices',
      'Auto key rotation',
      'Kill switch',
      'Priority support',
      'Custom DNS',
      'Port forwarding',
    ],
    popular: true,
    icon: Sparkles,
  },
]

const billingOptions: { value: BillingPeriod; label: string; discount?: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly', discount: 'Save 33%' },
]

function PricingCard({
  plan,
  billingPeriod,
  onSelect,
}: {
  plan: Plan
  billingPeriod: BillingPeriod
  onSelect: (planId: string, period: BillingPeriod) => void
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  const price = plan.pricing[billingPeriod]
  const periodLabel = billingPeriod === 'daily' ? 'day' : billingPeriod === 'monthly' ? 'month' : 'year'

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: plan.popular ? 0.1 : 0 }}
      whileHover={{ y: -10, transition: { duration: 0.3 } }}
      className={`relative rounded-3xl p-8 ${
        plan.popular
          ? 'bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border-2 border-cyan-500/50 shadow-xl shadow-cyan-500/20'
          : 'bg-white/5 border border-white/10'
      }`}
    >
      {/* Popular badge */}
      {plan.popular && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-4 left-1/2 -translate-x-1/2"
        >
          <span className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-bold rounded-full shadow-lg">
            MOST POPULAR
          </span>
        </motion.div>
      )}

      {/* Plan header */}
      <div className="mb-6">
        <div className={`inline-flex p-3 rounded-xl ${
          plan.popular ? 'bg-cyan-500/20' : 'bg-white/10'
        } mb-4`}>
          <plan.icon className={`w-6 h-6 ${plan.popular ? 'text-cyan-400' : 'text-slate-400'}`} />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
        <p className="text-slate-400">{plan.description}</p>
      </div>

      {/* Pricing */}
      <div className="mb-8">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold text-white">${price}</span>
          <span className="text-slate-400">/{periodLabel}</span>
        </div>
        {billingPeriod === 'yearly' && (
          <p className="text-sm text-cyan-400 mt-2">
            Billed annually (${price}/year)
          </p>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-4 mb-8">
        {plan.features.map((feature, index) => (
          <motion.li
            key={feature}
            initial={{ opacity: 0, x: -10 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="flex items-start gap-3"
          >
            <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
              plan.popular ? 'bg-cyan-500' : 'bg-slate-600'
            }`}>
              <Check className="w-3 h-3 text-white" />
            </div>
            <span className="text-slate-300">{feature}</span>
          </motion.li>
        ))}
      </ul>

      {/* CTA Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onSelect(plan.id, billingPeriod)}
        className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
          plan.popular
            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50'
            : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
        }`}
      >
        Get Started
      </motion.button>
    </motion.div>
  )
}

export default function PricingCards() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly')
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  const handleSelectPlan = async (planId: string, period: BillingPeriod) => {
    // In production, this would redirect to Stripe Checkout
    console.log(`Selected plan: ${planId}, period: ${period}`)

    // Example Stripe checkout redirect:
    // const response = await fetch('/api/checkout', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ planId, billingPeriod: period }),
    // })
    // const { checkoutUrl } = await response.json()
    // window.location.href = checkoutUrl

    alert(`Starting checkout for ${planId} plan (${period})...`)
  }

  return (
    <section id="pricing" className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>

      <div ref={sectionRef} className="container mx-auto px-6 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-medium mb-4">
            Simple Pricing
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Choose Your{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Protection
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            No hidden fees. No surprise charges. Cancel anytime.
          </p>
        </motion.div>

        {/* Billing toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex justify-center mb-12"
        >
          <div className="inline-flex p-1 rounded-xl bg-white/5 border border-white/10">
            {billingOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setBillingPeriod(option.value)}
                className={`relative px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${
                  billingPeriod === option.value
                    ? 'bg-cyan-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {option.label}
                {option.discount && billingPeriod === option.value && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute -top-2 -right-2 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full"
                  >
                    {option.discount}
                  </motion.span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              billingPeriod={billingPeriod}
              onSelect={handleSelectPlan}
            />
          ))}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <p className="text-slate-500 text-sm mb-4">Trusted payment processing by</p>
          <div className="flex items-center justify-center gap-8">
            <svg className="h-8 text-slate-400" viewBox="0 0 60 25" fill="currentColor">
              <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.02 1.04-.06 1.48zm-3.67-3.14c0-1.47-.78-2.88-2.42-2.88-1.58 0-2.48 1.37-2.54 2.88h4.96zM25.03 5.83h3.98v14.17h-3.98V5.83zm-4.66 4.36c0-1.33-.5-1.77-1.4-1.77-.8 0-1.78.42-2.63 1.02v10.56h-3.98V5.83h3.98v1.6c1.32-1.23 2.78-1.97 4.37-1.97 2.53 0 3.64 1.63 3.64 4.11v10.43h-3.98V10.2zM.98 5.81h3.98v14.17H.98V5.81zm1.99-1.55c1.41 0 2.4-.98 2.4-2.21 0-1.23-.99-2.23-2.4-2.23-1.4 0-2.4 1-2.4 2.23 0 1.23.99 2.21 2.4 2.21zm39.33 5.94c0-1.33-.5-1.77-1.4-1.77-.8 0-1.78.42-2.63 1.02v10.56h-3.98V5.83h3.98v1.6c1.32-1.23 2.78-1.97 4.37-1.97 2.53 0 3.64 1.63 3.64 4.11v10.43h-3.98V10.2z"/>
            </svg>
            <span className="text-slate-400 text-2xl font-bold">stripe</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
