'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import {
  Server,
  Activity,
  Users,
  Wifi,
  Globe,
  RefreshCw,
  Settings,
  Power,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  HardDrive,
  Cpu,
  MemoryStick,
} from 'lucide-react'

interface VPNServer {
  id: string
  name: string
  country: string
  city: string
  hostname: string
  ip: string
  status: 'healthy' | 'warning' | 'offline' | 'maintenance'
  load: number
  connections: number
  bandwidthIn: number // Mbps
  bandwidthOut: number // Mbps
  cpu: number
  memory: number
  disk: number
  uptime: string
}

export default function ServersPage() {
  const [servers, setServers] = useState<VPNServer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedServer, setSelectedServer] = useState<VPNServer | null>(null)

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const token = localStorage.getItem('admin_token')
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
        const response = await fetch(`${backendUrl}/api/admin/servers`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        if (response.ok) {
          const data = await response.json()
          setServers(data.servers || [])
        }
      } catch (error) {
        console.error('Failed to fetch servers:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchServers()
    // Refresh every 30 seconds
    const interval = setInterval(fetchServers, 30000)
    return () => clearInterval(interval)
  }, [])

  const totalConnections = servers.reduce((sum, s) => sum + s.connections, 0)
  const totalBandwidth = servers.reduce((sum, s) => sum + s.bandwidthIn + s.bandwidthOut, 0)
  const healthyServers = servers.filter((s) => s.status === 'healthy').length
  const avgLoad = Math.round(servers.filter(s => s.status !== 'maintenance').reduce((sum, s) => sum + s.load, 0) / servers.filter(s => s.status !== 'maintenance').length)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'offline':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'maintenance':
        return <Settings className="w-5 h-5 text-blue-500 animate-spin" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'offline':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'maintenance':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const getLoadColor = (load: number) => {
    if (load < 50) return 'bg-green-500'
    if (load < 75) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <DashboardLayout title="VPN Servers" subtitle="Monitor and manage your VPN infrastructure">
      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
              <Server className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Healthy Servers</p>
              <p className="text-2xl font-bold text-slate-900">{healthyServers}/{servers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Connections</p>
              <p className="text-2xl font-bold text-slate-900">{totalConnections}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Average Load</p>
              <p className="text-2xl font-bold text-slate-900">{avgLoad}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Bandwidth</p>
              <p className="text-2xl font-bold text-slate-900">{(totalBandwidth / 1000).toFixed(1)} Gbps</p>
            </div>
          </div>
        </div>
      </div>

      {/* Server grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {servers.map((server) => (
          <div
            key={server.id}
            className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer ${
              selectedServer?.id === server.id ? 'ring-2 ring-cyan-500' : ''
            }`}
            onClick={() => setSelectedServer(server)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100">
                  <Globe className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{server.name}</h3>
                  <p className="text-sm text-slate-500">{server.city}, {server.country}</p>
                </div>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(server.status)}`}>
                {getStatusIcon(server.status)}
                <span className="text-sm font-medium capitalize">{server.status}</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Load</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getLoadColor(server.load)}`}
                      style={{ width: `${server.load}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-900">{server.load}%</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Connections</p>
                <p className="text-sm font-medium text-slate-900">{server.connections}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Bandwidth In</p>
                <p className="text-sm font-medium text-slate-900">{server.bandwidthIn} Mbps</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Bandwidth Out</p>
                <p className="text-sm font-medium text-slate-900">{server.bandwidthOut} Mbps</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{server.cpu}%</span>
              </div>
              <div className="flex items-center gap-2">
                <MemoryStick className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{server.memory}%</span>
              </div>
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{server.disk}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{server.uptime}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-500">{server.hostname}</p>
                <p className="text-xs text-slate-400">{server.ip}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-slate-400 hover:text-cyan-500 hover:bg-cyan-50 rounded-lg transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                  <Settings className="w-4 h-4" />
                </button>
                {server.status !== 'maintenance' && (
                  <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Power className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}
