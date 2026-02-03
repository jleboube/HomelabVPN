import { loadStripe, Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null> | null = null

export const getStripe = () => {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    if (key) {
      stripePromise = loadStripe(key)
    } else {
      console.warn('Stripe publishable key not found')
      stripePromise = Promise.resolve(null)
    }
  }
  return stripePromise
}

export interface CheckoutSessionResponse {
  sessionId: string
  checkoutUrl: string
}

export async function createCheckoutSession(
  planId: string,
  billingPeriod: 'daily' | 'monthly' | 'yearly',
  token: string
): Promise<CheckoutSessionResponse> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/subscriptions/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ planId, billingPeriod }),
  })

  if (!response.ok) {
    throw new Error('Failed to create checkout session')
  }

  return response.json()
}

export async function redirectToCheckout(
  planId: string,
  billingPeriod: 'daily' | 'monthly' | 'yearly',
  token: string
): Promise<void> {
  const { checkoutUrl } = await createCheckoutSession(planId, billingPeriod, token)
  window.location.href = checkoutUrl
}
