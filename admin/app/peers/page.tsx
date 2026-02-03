'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import {
  Search,
  Monitor,
  Smartphone,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  AlertCircle,
} from 'lucide-react'
import { format } from 'date-fns'

interface Peer {
  id: string
  userId: string
  email: string
  publicKey: string
  clientIP: string
  platform: 'desktop' | 'ios-relay'
  createdAt: string
  rotatedAt: string | null
  active: boolean
}

interface PeerStats {
  total: number
  desktop: number
  iosRelay: number
}

export default function PeersPage() {
  const [peers, setPeers] = useState<Peer[]>([])
  const [stats, setStats] = useState<PeerStats>({ total: 0, desktop: 0, iosRelay: 0 })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [selectedPeers, setSelectedPeers] = useState<string[]>([])
  const [updating, setUpdating] = useState<string | null>(null)
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchPeers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      const response = await fetch(`${backendUrl}/api/admin/v1/peers?platform=${platformFilter}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setPeers(data.peers || [])
        setStats(data.stats || { total: 0, desktop: 0, iosRelay: 0 })
      } else {
        setError('Failed to fetch peers')
      }
    } catch (error) {
      console.error('Failed to fetch peers:', error)
      setError('Failed to fetch peers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPeers()
  }, [platformFilter])

  const filteredPeers = peers.filter((peer) => {
    const matchesSearch =
      peer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      peer.publicKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
      peer.clientIP.includes(searchQuery)
    return matchesSearch
  })

  const handleSelectAll = () => {
    if (selectedPeers.length === filteredPeers.length) {
      setSelectedPeers([])
    } else {
      setSelectedPeers(filteredPeers.map((p) => p.id))
    }
  }

  const handleSelectPeer = (peerId: string) => {
    setSelectedPeers((prev) =>
      prev.includes(peerId) ? prev.filter((id) => id !== peerId) : [...prev, peerId]
    )
  }

  const updatePeerPlatform = async (peerId: string, newPlatform: 'desktop' | 'ios-relay') => {
    setUpdating(peerId)
    setError(null)
    try {
      const token = localStorage.getItem('admin_token')
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      const response = await fetch(`${backendUrl}/api/admin/v1/peers/${peerId}/platform`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ platform: newPlatform }),
      })

      if (response.ok) {
        setSuccess(`Platform updated to ${newPlatform}`)
        fetchPeers()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update platform')
      }
    } catch (error) {
      console.error('Failed to update peer:', error)
      setError('Failed to update peer platform')
    } finally {
      setUpdating(null)
    }
  }

  const bulkUpdatePlatform = async (newPlatform: 'desktop' | 'ios-relay') => {
    if (selectedPeers.length === 0) return

    setBulkUpdating(true)
    setError(null)
    try {
      const token = localStorage.getItem('admin_token')
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      const response = await fetch(`${backendUrl}/api/admin/v1/peers/bulk-platform`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ peerIds: selectedPeers, platform: newPlatform }),
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess(`Updated ${data.updated} peers to ${newPlatform}`)
        setSelectedPeers([])
        fetchPeers()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update peers')
      }
    } catch (error) {
      console.error('Failed to bulk update:', error)
      setError('Failed to update peers')
    } finally {
      setBulkUpdating(false)
    }
  }

  const getPlatformBadge = (platform: string) => {
    if (platform === 'ios-relay') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
          <Smartphone className="w-3 h-3" />
          iOS Relay
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        <Monitor className="w-3 h-3" />
        Desktop
      </span>
    )
  }

  const getStatusBadge = (active: boolean) => {
    return active ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <Check className="w-3 h-3" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
        <X className="w-3 h-3" />
        Inactive
      </span>
    )
  }

  return (
    <DashboardLayout title="Peers" subtitle="Manage WireGuard peer configurations and platform assignments">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Monitor className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-sm text-slate-500">Total Peers</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Monitor className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.desktop}</p>
              <p className="text-sm text-slate-500">Desktop (wstunnel)</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Smartphone className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.iosRelay}</p>
              <p className="text-sm text-slate-500">iOS Relay (direct UDP)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <Check className="w-5 h-5 text-green-500" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Actions bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by email, key, or IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-80 rounded-lg border border-slate-200 text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
              />
            </div>

            {/* Platform filter */}
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm focus:border-cyan-500 outline-none"
            >
              <option value="all">All Platforms</option>
              <option value="desktop">Desktop</option>
              <option value="ios-relay">iOS Relay</option>
            </select>
          </div>

          <button
            onClick={fetchPeers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Bulk actions */}
        {selectedPeers.length > 0 && (
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-200">
            <span className="text-sm text-slate-600">
              {selectedPeers.length} selected
            </span>
            <button
              onClick={() => bulkUpdatePlatform('desktop')}
              disabled={bulkUpdating}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Monitor className="w-4 h-4" />
              Set Desktop
            </button>
            <button
              onClick={() => bulkUpdatePlatform('ios-relay')}
              disabled={bulkUpdating}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            >
              <Smartphone className="w-4 h-4" />
              Set iOS Relay
            </button>
          </div>
        )}
      </div>

      {/* Peers table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left">
                <input
                  type="checkbox"
                  checked={selectedPeers.length === filteredPeers.length && filteredPeers.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
                />
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Client IP
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Platform
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading peers...
                </td>
              </tr>
            ) : filteredPeers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  No peers found
                </td>
              </tr>
            ) : (
              filteredPeers.map((peer) => (
                <tr key={peer.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedPeers.includes(peer.id)}
                      onChange={() => handleSelectPeer(peer.id)}
                      className="w-4 h-4 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{peer.email}</p>
                      <p className="text-xs text-slate-400 font-mono">{peer.publicKey.slice(0, 20)}...</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-slate-600">{peer.clientIP}</span>
                  </td>
                  <td className="px-6 py-4">{getPlatformBadge(peer.platform)}</td>
                  <td className="px-6 py-4">{getStatusBadge(peer.active)}</td>
                  <td className="px-6 py-4 text-slate-600 text-sm">
                    {format(new Date(peer.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {peer.platform === 'desktop' ? (
                        <button
                          onClick={() => updatePeerPlatform(peer.id, 'ios-relay')}
                          disabled={updating === peer.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {updating === peer.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Smartphone className="w-3 h-3" />
                          )}
                          Switch to iOS
                        </button>
                      ) : (
                        <button
                          onClick={() => updatePeerPlatform(peer.id, 'desktop')}
                          disabled={updating === peer.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {updating === peer.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Monitor className="w-3 h-3" />
                          )}
                          Switch to Desktop
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            Showing {filteredPeers.length} of {peers.length} peers
          </p>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Monitor className="w-4 h-4 text-blue-500" /> Desktop: Uses wstunnel (Cloudflare)
            </span>
            <span className="mx-2">|</span>
            <span className="inline-flex items-center gap-1">
              <Smartphone className="w-4 h-4 text-orange-500" /> iOS Relay: Direct UDP (Linode)
            </span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
