'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import {
  Search,
  Download,
  CreditCard,
  TrendingUp,
  DollarSign,
  Calendar,
  MoreVertical,
  RefreshCw,
  XCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { format } from 'date-fns'

interface Subscription {
  id: string
  userId: string
  userEmail: string
  userName: string
  planId: string
  status: 'active' | 'cancelled' | 'expired' | 'past_due'
  billingPeriod: 'daily' | 'monthly' | 'yearly'
  amount: number
  startDate: string
  renewalDate: string
  cancelledAt: string | null
}

interface SubscriptionStats {
  totalRevenue: number
  mrr: number
  activeSubscriptions: number
  churnRate: number
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [stats, setStats] = useState<SubscriptionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [planFilter, setPlanFilter] = useState<string>('all')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('admin_token')
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }

        const [subsRes, statsRes] = await Promise.all([
          fetch(`${backendUrl}/api/admin/subscriptions`, { headers }),
          fetch(`${backendUrl}/api/admin/subscriptions/stats`, { headers }),
        ])

        if (subsRes.ok) {
          const data = await subsRes.json()
          setSubscriptions(data.subscriptions || [])
        }

        if (statsRes.ok) {
          const data = await statsRes.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch subscriptions:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.userName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter
    const matchesPlan = planFilter === 'all' || sub.planId === planFilter
    return matchesSearch && matchesStatus && matchesPlan
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-slate-500" />
      case 'past_due':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'expired':
        return <Clock className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-700',
      cancelled: 'bg-slate-100 text-slate-700',
      past_due: 'bg-yellow-100 text-yellow-700',
      expired: 'bg-red-100 text-red-700',
    }
    return styles[status as keyof typeof styles] || styles.cancelled
  }

  const formatBillingPeriod = (period: string) => {
    const labels = { daily: 'Daily', monthly: 'Monthly', yearly: 'Yearly' }
    return labels[period as keyof typeof labels] || period
  }

  return (
    <DashboardLayout title="Subscriptions" subtitle="Manage subscription plans and billing">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-900">${stats?.totalRevenue.toLocaleString() || '0'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Monthly Recurring</p>
              <p className="text-2xl font-bold text-slate-900">${stats?.mrr.toLocaleString() || '0'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Active Subscriptions</p>
              <p className="text-2xl font-bold text-slate-900">{stats?.activeSubscriptions || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600">
              <RefreshCw className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Churn Rate</p>
              <p className="text-2xl font-bold text-slate-900">{stats?.churnRate || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 rounded-lg border border-slate-200 text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm focus:border-cyan-500 outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="cancelled">Cancelled</option>
              <option value="past_due">Past Due</option>
              <option value="expired">Expired</option>
            </select>

            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm focus:border-cyan-500 outline-none"
            >
              <option value="all">All Plans</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
            </select>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Subscriptions table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Billing
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Renewal Date
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSubscriptions.map((sub) => (
              <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-slate-900">{sub.userName}</p>
                    <p className="text-sm text-slate-500">{sub.userEmail}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                    sub.planId === 'pro' ? 'bg-purple-100 text-purple-700' : 'bg-cyan-100 text-cyan-700'
                  }`}>
                    {sub.planId}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {formatBillingPeriod(sub.billingPeriod)}
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium text-slate-900">${sub.amount}</span>
                  <span className="text-slate-500">/{sub.billingPeriod === 'daily' ? 'day' : sub.billingPeriod === 'monthly' ? 'mo' : 'yr'}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(sub.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(sub.status)}`}>
                      {sub.status.replace('_', ' ')}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {format(new Date(sub.renewalDate), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {sub.status === 'active' && (
                      <button className="px-3 py-1.5 text-xs text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors">
                        Cancel
                      </button>
                    )}
                    {sub.status === 'cancelled' && (
                      <button className="px-3 py-1.5 text-xs text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        Reactivate
                      </button>
                    )}
                    {sub.status === 'past_due' && (
                      <button className="px-3 py-1.5 text-xs text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors">
                        Retry Payment
                      </button>
                    )}
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            Showing {filteredSubscriptions.length} of {subscriptions.length} subscriptions
          </p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 bg-cyan-50 text-cyan-600 rounded-lg text-sm font-medium">1</button>
            <button className="px-3 py-1 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">2</button>
            <button className="px-3 py-1 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">3</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
