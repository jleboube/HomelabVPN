'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import {
  Shield,
  Download,
  Monitor,
  Smartphone,
  Globe,
  Key,
  RefreshCw,
  CheckCircle,
  Settings,
  LogOut,
  Copy,
  ExternalLink,
  Server,
  AlertCircle,
  Loader2,
} from 'lucide-react'

interface User {
  email: string
  plan: 'basic' | 'pro'
  subscription: {
    status: string
    renewalDate: string
    billingPeriod: string
  }
  vpnConfig: {
    publicKey: string
    clientIP: string
    createdAt: string
  }
}

interface ServerLocation {
  id: string
  country: string
  city: string
  flag: string
  load: number
  status: 'online' | 'offline' | 'maintenance'
}

const downloadOptions = [
  {
    id: 'macos',
    name: 'macOS',
    icon: Monitor,
    description: 'One-click install for macOS 12+',
    format: 'wg-config',
  },
  {
    id: 'ios',
    name: 'iOS',
    icon: Smartphone,
    description: 'Configuration profile for iOS 15+',
    format: 'mobileconfig',
  },
]

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Shield
  label: string
  value: string
  color: string
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="p-6 rounded-2xl bg-white/5 border border-white/10"
    >
      <div className={`inline-flex p-3 rounded-xl ${color} mb-4`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-slate-400 text-sm mb-1">{label}</p>
      <p className="text-white text-xl font-semibold">{value}</p>
    </motion.div>
  )
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [servers, setServers] = useState<ServerLocation[]>([])
  const [selectedServer, setSelectedServer] = useState('us-east')
  const [isRegeneratingKey, setIsRegeneratingKey] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    fetchUserData()
    fetchServers()
  }, [])

  const fetchUserData = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      const response = await fetch(`${backendUrl}/api/user/me`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data)
      } else if (response.status === 401) {
        // Redirect to login if unauthorized
        window.location.href = '/login'
      } else {
        throw new Error('Failed to fetch user data')
      }
    } catch (err) {
      console.error('Error fetching user:', err)
      setError('Unable to load user data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchServers = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      const response = await fetch(`${backendUrl}/api/vpn/servers`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setServers(data.servers || [])
      } else {
        throw new Error('Failed to fetch servers')
      }
    } catch (err) {
      console.error('Error fetching servers:', err)
      // Use fallback server list if API fails
      setServers([
        { id: 'us-east', country: 'United States', city: 'New York', flag: '🇺🇸', load: 0, status: 'online' },
        { id: 'us-west', country: 'United States', city: 'Los Angeles', flag: '🇺🇸', load: 0, status: 'online' },
        { id: 'uk', country: 'United Kingdom', city: 'London', flag: '🇬🇧', load: 0, status: 'online' },
        { id: 'de', country: 'Germany', city: 'Frankfurt', flag: '🇩🇪', load: 0, status: 'online' },
        { id: 'nl', country: 'Netherlands', city: 'Amsterdam', flag: '🇳🇱', load: 0, status: 'online' },
        { id: 'jp', country: 'Japan', city: 'Tokyo', flag: '🇯🇵', load: 0, status: 'online' },
        { id: 'sg', country: 'Singapore', city: 'Singapore', flag: '🇸🇬', load: 0, status: 'online' },
        { id: 'au', country: 'Australia', city: 'Sydney', flag: '🇦🇺', load: 0, status: 'online' },
        { id: 'ca', country: 'Canada', city: 'Toronto', flag: '🇨🇦', load: 0, status: 'online' },
        { id: 'fr', country: 'France', city: 'Paris', flag: '🇫🇷', load: 0, status: 'online' },
      ])
    }
  }

  const handleDownload = async (format: string) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      const response = await fetch(
        `${backendUrl}/api/vpn/config/${selectedServer}?format=${format}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to download configuration')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = format === 'mobileconfig' ? 'homelabvpn.mobileconfig' : 'homelabvpn.conf'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Download error:', err)
      alert('Failed to download configuration. Please try again.')
    }
  }

  const handleRegenerateKey = async () => {
    setIsRegeneratingKey(true)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      const response = await fetch(`${backendUrl}/api/vpn/keys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to regenerate keys')
      }

      const data = await response.json()
      if (user) {
        setUser({
          ...user,
          vpnConfig: {
            ...user.vpnConfig,
            publicKey: data.publicKey,
            createdAt: new Date().toISOString(),
          },
        })
      }
      alert('WireGuard keys regenerated successfully! Please download your new configuration.')
    } catch (err) {
      console.error('Key regeneration error:', err)
      alert('Failed to regenerate keys. Please try again.')
    } finally {
      setIsRegeneratingKey(false)
    }
  }

  const handleCopyPublicKey = () => {
    if (user?.vpnConfig.publicKey) {
      navigator.clipboard.writeText(user.vpnConfig.publicKey)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.href = '/'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center">
        <div className="text-center p-8 rounded-2xl bg-white/5 border border-white/10 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Unable to Load Dashboard</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setError(null)
                setIsLoading(true)
                fetchUserData()
              }}
              className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
            >
              Try Again
            </button>
            <a
              href="/"
              className="block w-full px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/15 transition-all text-center"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Homelab<span className="text-cyan-400">VPN</span>
              </span>
            </a>

            <div className="flex items-center gap-4">
              <span className="text-slate-400 text-sm hidden md:block">
                {user?.email}
              </span>
              <button className="p-2 text-slate-400 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        {/* Welcome section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back!
          </h1>
          <p className="text-slate-400">
            Manage your VPN configurations and subscription.
          </p>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
        >
          <StatCard
            icon={Shield}
            label="Plan"
            value={user?.plan.toUpperCase() || 'N/A'}
            color="bg-gradient-to-br from-cyan-500 to-blue-600"
          />
          <StatCard
            icon={CheckCircle}
            label="Status"
            value={user?.subscription.status === 'active' ? 'Active' : 'Inactive'}
            color="bg-gradient-to-br from-green-500 to-emerald-600"
          />
          <StatCard
            icon={Globe}
            label="Selected Server"
            value={servers.find((s) => s.id === selectedServer)?.city || 'None'}
            color="bg-gradient-to-br from-teal-500 to-emerald-600"
          />
          <StatCard
            icon={Key}
            label="Key Created"
            value={user?.vpnConfig.createdAt ? new Date(user.vpnConfig.createdAt).toLocaleDateString() : 'N/A'}
            color="bg-gradient-to-br from-orange-500 to-amber-600"
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Server selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-cyan-400" />
                  Server Locations
                </h2>
                {user?.plan === 'basic' && (
                  <span className="px-3 py-1 bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-medium rounded-full">
                    Pro required for all locations
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {servers.map((server, index) => {
                  const isLocked = user?.plan === 'basic' && index > 0
                  return (
                    <motion.button
                      key={server.id}
                      whileHover={!isLocked ? { scale: 1.02 } : {}}
                      whileTap={!isLocked ? { scale: 0.98 } : {}}
                      onClick={() => !isLocked && setSelectedServer(server.id)}
                      disabled={isLocked || server.status !== 'online'}
                      className={`p-4 rounded-xl text-left transition-all ${
                        selectedServer === server.id
                          ? 'bg-cyan-500/20 border-2 border-cyan-500'
                          : isLocked || server.status !== 'online'
                          ? 'bg-white/5 border border-white/5 opacity-50 cursor-not-allowed'
                          : 'bg-white/5 border border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{server.flag}</span>
                          <div>
                            <p className="text-white font-medium">{server.city}</p>
                            <p className="text-slate-500 text-sm">{server.country}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {server.status === 'online' ? (
                            <div className={`text-sm font-medium ${
                              server.load < 40 ? 'text-green-400' :
                              server.load < 70 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {server.load > 0 ? `${server.load}% load` : 'Available'}
                            </div>
                          ) : (
                            <div className="text-sm font-medium text-red-400">
                              {server.status === 'maintenance' ? 'Maintenance' : 'Offline'}
                            </div>
                          )}
                          {isLocked && (
                            <span className="text-xs text-slate-500">Pro only</span>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </motion.div>

          {/* Download section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
                <Download className="w-5 h-5 text-cyan-400" />
                Download Config
              </h2>

              <div className="space-y-4">
                {downloadOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDownload(option.format)}
                    className="w-full p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 hover:border-cyan-500/50 text-left transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-cyan-500/20">
                        <option.icon className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold">{option.name}</p>
                        <p className="text-slate-400 text-sm">{option.description}</p>
                      </div>
                      <Download className="w-5 h-5 text-cyan-400" />
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Key info */}
              <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-400 text-sm">Your Public Key</span>
                  <button
                    onClick={handleCopyPublicKey}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                  >
                    {copySuccess ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs">Copied!</span>
                      </>
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <code className="text-xs text-slate-300 font-mono break-all">
                  {user?.vpnConfig.publicKey || 'Not generated'}
                </code>
              </div>

              {/* Regenerate key button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRegenerateKey}
                disabled={isRegeneratingKey}
                className="w-full mt-4 p-3 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRegeneratingKey ? 'animate-spin' : ''}`} />
                {isRegeneratingKey ? 'Regenerating...' : 'Regenerate Keys'}
              </motion.button>
            </div>

            {/* Quick links */}
            <div className="mt-6 p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
              <div className="space-y-3">
                <a
                  href="/setup-guide"
                  className="flex items-center gap-3 text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Setup Guide</span>
                </a>
                <a
                  href="/troubleshooting"
                  className="flex items-center gap-3 text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Troubleshooting</span>
                </a>
                <a
                  href="/api-docs"
                  className="flex items-center gap-3 text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>API Documentation</span>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
