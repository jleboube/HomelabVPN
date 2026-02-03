'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { motion } from 'framer-motion'
import { Code, Copy, CheckCircle, Lock, Key, Server, User, CreditCard } from 'lucide-react'

const endpoints = [
  {
    category: 'Authentication',
    icon: Key,
    items: [
      {
        method: 'POST',
        path: '/api/auth/login',
        description: 'Authenticate user and receive JWT token',
        auth: false,
        requestBody: `{
  "email": "user@example.com",
  "password": "your_password"
}`,
        response: `{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "usr_123",
    "email": "user@example.com",
    "plan": "pro"
  }
}`,
      },
      {
        method: 'POST',
        path: '/api/auth/register',
        description: 'Create a new user account',
        auth: false,
        requestBody: `{
  "email": "user@example.com",
  "password": "secure_password"
}`,
        response: `{
  "message": "Account created. Check email for verification.",
  "userId": "usr_123"
}`,
      },
      {
        method: 'POST',
        path: '/api/auth/refresh',
        description: 'Refresh authentication token',
        auth: true,
        response: `{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}`,
      },
    ],
  },
  {
    category: 'User',
    icon: User,
    items: [
      {
        method: 'GET',
        path: '/api/user/me',
        description: 'Get current user profile',
        auth: true,
        response: `{
  "id": "usr_123",
  "email": "user@example.com",
  "plan": "pro",
  "status": "active",
  "createdAt": "2026-01-01T00:00:00Z"
}`,
      },
      {
        method: 'PUT',
        path: '/api/user/me',
        description: 'Update user profile',
        auth: true,
        requestBody: `{
  "email": "newemail@example.com"
}`,
        response: `{
  "message": "Profile updated successfully"
}`,
      },
    ],
  },
  {
    category: 'VPN',
    icon: Server,
    items: [
      {
        method: 'GET',
        path: '/api/vpn/servers',
        description: 'List available VPN servers',
        auth: true,
        response: `{
  "servers": [
    {
      "id": "us-east",
      "name": "US East",
      "location": "New York",
      "hostname": "us-east.vpn.z-q.me",
      "load": 35,
      "status": "online"
    }
  ]
}`,
      },
      {
        method: 'GET',
        path: '/api/vpn/config/:serverId',
        description: 'Download WireGuard configuration for a server',
        auth: true,
        response: `[Interface]
PrivateKey = <generated>
Address = 10.0.0.42/32
DNS = 1.1.1.1, 1.0.0.1

[Peer]
PublicKey = <server_public_key>
AllowedIPs = 0.0.0.0/0
Endpoint = us-east.vpn.z-q.me:51820
PersistentKeepalive = 25`,
      },
      {
        method: 'POST',
        path: '/api/vpn/keys',
        description: 'Generate new WireGuard key pair',
        auth: true,
        response: `{
  "publicKey": "abc123...",
  "clientIp": "10.0.0.42"
}`,
      },
    ],
  },
  {
    category: 'Subscription',
    icon: CreditCard,
    items: [
      {
        method: 'GET',
        path: '/api/subscription',
        description: 'Get current subscription details',
        auth: true,
        response: `{
  "plan": "pro",
  "status": "active",
  "billingCycle": "monthly",
  "currentPeriodEnd": "2026-02-01T00:00:00Z",
  "cancelAtPeriodEnd": false
}`,
      },
      {
        method: 'POST',
        path: '/api/subscription/checkout',
        description: 'Create Stripe checkout session',
        auth: true,
        requestBody: `{
  "plan": "pro",
  "billingCycle": "monthly"
}`,
        response: `{
  "checkoutUrl": "https://checkout.stripe.com/..."
}`,
      },
      {
        method: 'POST',
        path: '/api/subscription/cancel',
        description: 'Cancel subscription at period end',
        auth: true,
        response: `{
  "message": "Subscription will cancel at period end",
  "cancelAt": "2026-02-01T00:00:00Z"
}`,
      },
    ],
  },
]

const methodColors: Record<string, string> = {
  GET: 'bg-green-500/20 text-green-400',
  POST: 'bg-blue-500/20 text-blue-400',
  PUT: 'bg-yellow-500/20 text-yellow-400',
  DELETE: 'bg-red-500/20 text-red-400',
}

function CodeBlock({ code, language = 'json' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative">
      <pre className="p-4 rounded-lg bg-slate-900 text-slate-300 text-sm overflow-x-auto">
        <code>{code}</code>
      </pre>
      <button
        onClick={copyToClipboard}
        className="absolute top-2 right-2 p-2 rounded bg-white/10 hover:bg-white/20 transition-colors"
        title="Copy to clipboard"
      >
        {copied ? (
          <CheckCircle className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4 text-slate-400" />
        )}
      </button>
    </div>
  )
}

export default function ApiDocs() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 mb-6">
                <Code className="w-8 h-8 text-cyan-400" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                API Documentation
              </h1>
              <p className="text-xl text-slate-400">
                Integrate HomelabVPN into your applications.
              </p>
            </motion.div>
          </div>

          {/* Base URL */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">Base URL</h2>
            <CodeBlock code="https://api.vpn.z-q.me" language="text" />
          </section>

          {/* Authentication */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">Authentication</h2>
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-start gap-4 mb-4">
                <Lock className="w-6 h-6 text-cyan-400 mt-1" />
                <div>
                  <p className="text-slate-300 mb-4">
                    Most API endpoints require authentication. Include your JWT token in the Authorization header:
                  </p>
                  <CodeBlock code={`Authorization: Bearer <your_jwt_token>`} />
                </div>
              </div>
              <div className="mt-4 p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <p className="text-slate-300 text-sm">
                  <strong className="text-cyan-400">Note:</strong> Tokens expire after 24 hours. Use the <code className="px-1.5 py-0.5 rounded bg-white/10">/api/auth/refresh</code> endpoint to get a new token.
                </p>
              </div>
            </div>
          </section>

          {/* Rate Limiting */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">Rate Limiting</h2>
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <p className="text-slate-300 mb-4">
                API requests are rate limited to ensure fair usage:
              </p>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full" />
                  <strong>Authenticated requests:</strong> 100 requests per minute
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full" />
                  <strong>Unauthenticated requests:</strong> 20 requests per minute
                </li>
              </ul>
              <p className="text-slate-400 text-sm mt-4">
                Rate limit headers are included in all responses: <code className="px-1.5 py-0.5 rounded bg-white/10">X-RateLimit-Remaining</code> and <code className="px-1.5 py-0.5 rounded bg-white/10">X-RateLimit-Reset</code>.
              </p>
            </div>
          </section>

          {/* Endpoints */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-6">Endpoints</h2>

            {endpoints.map((category, categoryIndex) => (
              <div key={categoryIndex} className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
                    <category.icon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{category.category}</h3>
                </div>

                <div className="space-y-6">
                  {category.items.map((endpoint, endpointIndex) => (
                    <div
                      key={endpointIndex}
                      className="p-6 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${methodColors[endpoint.method]}`}>
                          {endpoint.method}
                        </span>
                        <code className="text-white font-mono">{endpoint.path}</code>
                        {endpoint.auth && (
                          <span className="px-2 py-1 rounded bg-white/10 text-slate-400 text-xs flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Auth Required
                          </span>
                        )}
                      </div>

                      <p className="text-slate-400 mb-4">{endpoint.description}</p>

                      {endpoint.requestBody && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-slate-300 mb-2">Request Body</h4>
                          <CodeBlock code={endpoint.requestBody} />
                        </div>
                      )}

                      <div>
                        <h4 className="text-sm font-semibold text-slate-300 mb-2">Response</h4>
                        <CodeBlock code={endpoint.response} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* Error Codes */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-6">Error Codes</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-3 px-4 text-white font-semibold">Code</th>
                    <th className="py-3 px-4 text-white font-semibold">Meaning</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4"><code className="text-red-400">400</code></td>
                    <td className="py-3 px-4">Bad Request - Invalid parameters</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4"><code className="text-red-400">401</code></td>
                    <td className="py-3 px-4">Unauthorized - Invalid or missing token</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4"><code className="text-red-400">403</code></td>
                    <td className="py-3 px-4">Forbidden - Insufficient permissions</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4"><code className="text-red-400">404</code></td>
                    <td className="py-3 px-4">Not Found - Resource doesn&apos;t exist</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4"><code className="text-red-400">429</code></td>
                    <td className="py-3 px-4">Too Many Requests - Rate limit exceeded</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4"><code className="text-red-400">500</code></td>
                    <td className="py-3 px-4">Internal Server Error - Something went wrong</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Support */}
          <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20">
            <h3 className="text-xl font-semibold text-white mb-3">
              Need API Support?
            </h3>
            <p className="text-slate-400 mb-6">
              Have questions about integration or need help with the API?
            </p>
            <a
              href="/contact"
              className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
            >
              Contact Developer Support
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
