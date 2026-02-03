'use client'

import { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import {
  Users,
  CreditCard,
  Activity,
  Wifi,
  HardDrive,
  Cpu,
  MemoryStick,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  monthlyUsers: number
  totalRevenue: number
  monthlyRevenue: number
  bandwidthUsed: number
  activeConnections: number
  serverLoad: number
}

interface TrafficDataPoint {
  time: string
  inbound: number
  outbound: number
}

interface UserGrowthPoint {
  month: string
  users: number
}

interface SubscriptionBreakdown {
  name: string
  value: number
  color: string
}

interface ServerStatus {
  id: string
  name: string
  city: string
  status: 'healthy' | 'warning' | 'critical'
  load: number
  connections: number
}

interface SystemMetrics {
  cpu: number
  memory: number
  disk: number
  network: number
}

function StatCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color,
  loading,
}: {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative'
  icon: typeof Users
  color: string
  loading?: boolean
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          {loading ? (
            <div className="h-9 flex items-center mt-2">
              <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
              {change && (
                <div className={`flex items-center gap-1 mt-2 text-sm ${
                  changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {changeType === 'positive' ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {change}
                </div>
              )}
            </>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )
}

function SystemMetricCard({
  title,
  value,
  unit,
  icon: Icon,
  loading,
}: {
  title: string
  value: number
  unit: string
  icon: typeof Cpu
  loading?: boolean
}) {
  const getColor = (val: number) => {
    if (val < 50) return 'text-green-500'
    if (val < 75) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getBgColor = (val: number) => {
    if (val < 50) return 'bg-green-500'
    if (val < 75) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-center gap-3 mb-3">
        <Icon className={`w-5 h-5 ${loading ? 'text-slate-400' : getColor(value)}`} />
        <span className="text-sm font-medium text-slate-600">{title}</span>
      </div>
      {loading ? (
        <div className="h-8 flex items-center">
          <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
        </div>
      ) : (
        <>
          <div className="flex items-end gap-2">
            <span className={`text-2xl font-bold ${getColor(value)}`}>{value}</span>
            <span className="text-sm text-slate-500 mb-1">{unit}</span>
          </div>
          <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${getBgColor(value)} transition-all duration-500`}
              style={{ width: `${Math.min(value, 100)}%` }}
            />
          </div>
        </>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [trafficData, setTrafficData] = useState<TrafficDataPoint[]>([])
  const [userGrowth, setUserGrowth] = useState<UserGrowthPoint[]>([])
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionBreakdown[]>([])
  const [serverStatus, setServerStatus] = useState<ServerStatus[]>([])
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }

      // Fetch all dashboard data in parallel
      const [statsRes, trafficRes, growthRes, subsRes, serversRes, metricsRes] = await Promise.all([
        fetch(`${backendUrl}/api/admin/stats`, { headers }),
        fetch(`${backendUrl}/api/admin/traffic`, { headers }),
        fetch(`${backendUrl}/api/admin/user-growth`, { headers }),
        fetch(`${backendUrl}/api/admin/subscriptions/breakdown`, { headers }),
        fetch(`${backendUrl}/api/admin/servers/status`, { headers }),
        fetch(`${backendUrl}/api/admin/system/metrics`, { headers }),
      ])

      // Handle stats
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }

      // Handle traffic data
      if (trafficRes.ok) {
        const data = await trafficRes.json()
        setTrafficData(data.traffic || [])
      }

      // Handle user growth
      if (growthRes.ok) {
        const data = await growthRes.json()
        setUserGrowth(data.growth || [])
      }

      // Handle subscription breakdown
      if (subsRes.ok) {
        const data = await subsRes.json()
        setSubscriptionData(data.breakdown || [])
      }

      // Handle server status
      if (serversRes.ok) {
        const data = await serversRes.json()
        setServerStatus(data.servers || [])
      }

      // Handle system metrics
      if (metricsRes.ok) {
        const data = await metricsRes.json()
        setSystemMetrics(data)
      }

      setError(null)
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      setError('Failed to load dashboard data. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [fetchDashboardData])

  return (
    <DashboardLayout title="Dashboard" subtitle="Overview of your VPN service">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
          <button
            onClick={() => {
              setLoading(true)
              fetchDashboardData()
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {/* Main stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers.toLocaleString() || '0'}
          change={stats ? `${stats.monthlyUsers} this month` : undefined}
          changeType="positive"
          icon={Users}
          color="bg-gradient-to-br from-cyan-500 to-blue-600"
          loading={loading}
        />
        <StatCard
          title="Active Connections"
          value={stats?.activeConnections || 0}
          change={stats?.activeUsers ? `${stats.activeUsers} active users` : undefined}
          changeType="positive"
          icon={Wifi}
          color="bg-gradient-to-br from-green-500 to-emerald-600"
          loading={loading}
        />
        <StatCard
          title="Monthly Revenue"
          value={stats ? `$${stats.monthlyRevenue.toLocaleString()}` : '$0'}
          change={stats ? `$${stats.totalRevenue.toLocaleString()} total` : undefined}
          changeType="positive"
          icon={CreditCard}
          color="bg-gradient-to-br from-purple-500 to-violet-600"
          loading={loading}
        />
        <StatCard
          title="Bandwidth Used"
          value={stats ? `${stats.bandwidthUsed} TB` : '0 TB'}
          change="This month"
          changeType="positive"
          icon={Activity}
          color="bg-gradient-to-br from-orange-500 to-amber-600"
          loading={loading}
        />
      </div>

      {/* System metrics */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">System Health</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SystemMetricCard
            title="CPU Usage"
            value={systemMetrics?.cpu || 0}
            unit="%"
            icon={Cpu}
            loading={loading}
          />
          <SystemMetricCard
            title="Memory"
            value={systemMetrics?.memory || 0}
            unit="%"
            icon={MemoryStick}
            loading={loading}
          />
          <SystemMetricCard
            title="Disk Usage"
            value={systemMetrics?.disk || 0}
            unit="%"
            icon={HardDrive}
            loading={loading}
          />
          <SystemMetricCard
            title="Network I/O"
            value={systemMetrics?.network || 0}
            unit="Mbps"
            icon={Globe}
            loading={loading}
          />
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Traffic chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Network Traffic (24h)</h3>
          {loading ? (
            <div className="h-[250px] flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
          ) : trafficData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={trafficData}>
                  <defs>
                    <linearGradient id="inboundGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="outboundGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="inbound"
                    stroke="#06b6d4"
                    fill="url(#inboundGradient)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="outbound"
                    stroke="#8b5cf6"
                    fill="url(#outboundGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-500" />
                  <span className="text-sm text-slate-600">Inbound (GB)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-sm text-slate-600">Outbound (GB)</span>
                </div>
              </div>
            </>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-500">
              No traffic data available
            </div>
          )}
        </div>

        {/* User growth chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">User Growth</h3>
          {loading ? (
            <div className="h-[250px] flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
          ) : userGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Bar dataKey="users" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-500">
              No user growth data available
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Server status */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Server Status</h3>
          {loading ? (
            <div className="h-[200px] flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
          ) : serverStatus.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                    <th className="pb-3 font-medium">Server</th>
                    <th className="pb-3 font-medium">Location</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Load</th>
                    <th className="pb-3 font-medium">Connections</th>
                  </tr>
                </thead>
                <tbody>
                  {serverStatus.map((server) => (
                    <tr key={server.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-3">
                        <span className="font-medium text-slate-900">{server.name}</span>
                      </td>
                      <td className="py-3 text-slate-600">{server.city}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          server.status === 'healthy'
                            ? 'bg-green-100 text-green-700'
                            : server.status === 'warning'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {server.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                server.load < 50
                                  ? 'bg-green-500'
                                  : server.load < 75
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${server.load}%` }}
                            />
                          </div>
                          <span className="text-sm text-slate-600">{server.load}%</span>
                        </div>
                      </td>
                      <td className="py-3 text-slate-600">{server.connections}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-500">
              No server data available
            </div>
          )}
        </div>

        {/* Subscription breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Subscriptions</h3>
          {loading ? (
            <div className="h-[180px] flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
          ) : subscriptionData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={subscriptionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {subscriptionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {subscriptionData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-slate-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-slate-900">{item.value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-slate-500">
              No subscription data available
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
