'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Shield, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { completeGoogleOAuth } from '@/lib/auth'

function CallbackContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const errorParam = searchParams.get('error')

      if (errorParam) {
        setStatus('error')
        setError(`Google returned an error: ${errorParam}`)
        return
      }

      if (!code || !state) {
        setStatus('error')
        setError('Missing authorization code or state')
        return
      }

      try {
        await completeGoogleOAuth(code, state)
        setStatus('success')
        // Redirect to dashboard after successful login
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1500)
      } catch (err) {
        console.error('OAuth callback error:', err)
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Failed to complete login')
      }
    }

    handleCallback()
  }, [searchParams])

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
      {status === 'loading' && (
        <>
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Completing sign in...
          </h2>
          <p className="text-slate-400">
            Please wait while we verify your account
          </p>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Sign in successful!
          </h2>
          <p className="text-slate-400">
            Redirecting to your dashboard...
          </p>
        </>
      )}

      {status === 'error' && (
        <>
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Sign in failed
          </h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <div className="space-y-3">
            <a
              href="/login"
              className="block w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
            >
              Try Again
            </a>
            <a
              href="/"
              className="block w-full px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/15 transition-all"
            >
              Back to Home
            </a>
          </div>
        </>
      )}
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
      <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-white mb-2">
        Loading...
      </h2>
      <p className="text-slate-400">
        Please wait
      </p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="inline-flex items-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">
            Homelab<span className="text-cyan-400">VPN</span>
          </span>
        </div>

        {/* Status card with Suspense boundary */}
        <Suspense fallback={<LoadingFallback />}>
          <CallbackContent />
        </Suspense>
      </div>
    </div>
  )
}
