const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface ApiError {
  error: string
  status: number
}

class AdminApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_URL}/api/admin/v1`
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('admin_token')
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken()
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw { error: error.error || 'Request failed', status: response.status } as ApiError
    }

    return response.json()
  }

  // Auth endpoints
  async login(username: string, password: string) {
    return this.request<{
      token: string
      refreshToken: string
      expiresIn: number
      user: {
        id: string
        email: string
        username: string
        role: string
      }
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  }

  async refreshToken(refreshToken: string) {
    return this.request<{
      token: string
      expiresIn: number
    }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })
  }

  async logout() {
    return this.request<{ status: string }>('/logout', { method: 'POST' })
  }

  async getCurrentAdmin() {
    return this.request<{
      id: string
      email: string
      username: string
      role: string
      lastLoginAt: string
      createdAt: string
    }>('/me')
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ status: string }>('/me/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  }

  // Dashboard endpoints
  async getDashboardStats() {
    return this.request<{
      totalUsers: number
      activeUsers: number
      activeConnections: number
      totalBandwidth: number
      monthlyRevenue: number
      serversOnline: number
      totalServers: number
    }>('/dashboard/stats')
  }

  async getSystemHealth() {
    return this.request<{
      cpu: number
      memory: number
      disk: number
      networkIn: number
      networkOut: number
      uptime: number
      goRoutines: number
    }>('/dashboard/health')
  }

  async getBandwidthHistory(period: string = '24h') {
    return this.request<
      Array<{
        time: string
        bandwidthIn: number
        bandwidthOut: number
      }>
    >(`/dashboard/bandwidth?period=${period}`)
  }

  async getUserGrowth(period: string = '30d') {
    return this.request<
      Array<{
        date: string
        fullDate: string
        newUsers: number
        totalUsers: number
      }>
    >(`/dashboard/user-growth?period=${period}`)
  }

  async getRevenueStats() {
    return this.request<{
      mrr: number
      arr: number
      breakdown: Array<{
        plan: string
        billingPeriod: string
        subscribers: number
        revenue: number
        mrrContribution: number
      }>
      churn: {
        count: number
        rate: number
      }
    }>('/dashboard/revenue')
  }

  // User management endpoints
  async getUsers(params: {
    page?: number
    limit?: number
    search?: string
    status?: string
    plan?: string
  } = {}) {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())
    if (params.search) searchParams.set('search', params.search)
    if (params.status) searchParams.set('status', params.status)
    if (params.plan) searchParams.set('plan', params.plan)

    return this.request<{
      users: Array<{
        id: string
        email: string
        createdAt: string
        lastLoginAt: string | null
        plan: string
        status: string
        renewalDate: string | null
      }>
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
    }>(`/users?${searchParams.toString()}`)
  }

  async getUser(id: string) {
    return this.request<{
      id: string
      email: string
      createdAt: string
      lastLoginAt: string | null
      deletedAt: string | null
      subscription: {
        plan: string
        status: string
        renewalDate: string | null
        startDate: string
      }
    }>(`/users/${id}`)
  }

  async updateUser(id: string, data: { email?: string; status?: string }) {
    return this.request<{ status: string }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteUser(id: string) {
    return this.request<{ status: string }>(`/users/${id}`, { method: 'DELETE' })
  }

  // Subscription management endpoints
  async getSubscriptions(params: {
    page?: number
    limit?: number
    status?: string
    plan?: string
  } = {}) {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())
    if (params.status) searchParams.set('status', params.status)
    if (params.plan) searchParams.set('plan', params.plan)

    return this.request<{
      subscriptions: Array<{
        id: string
        userId: string
        email: string
        plan: string
        status: string
        billingPeriod: string
        startDate: string
        renewalDate: string | null
        cancelledAt: string | null
        stripeId: string | null
      }>
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
    }>(`/subscriptions?${searchParams.toString()}`)
  }

  async updateSubscription(id: string, data: { status?: string; plan?: string }) {
    return this.request<{ status: string }>(`/subscriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async cancelSubscription(id: string) {
    return this.request<{ status: string }>(`/subscriptions/${id}/cancel`, {
      method: 'POST',
    })
  }

  // Server management endpoints
  async getServers() {
    return this.request<{
      servers: Array<{
        id: string
        country: string
        city: string
        hostname: string
        ip: string
        status: string
        capacity: number
        currentLoad: number
        listenPort: number
        createdAt: string
        updatedAt: string
        metrics: {
          connections: number
          bandwidthIn: number
          bandwidthOut: number
          cpu: number
          memory: number
          latency: number
        }
      }>
    }>('/servers')
  }

  async updateServer(id: string, data: { status?: string; capacity?: number }) {
    return this.request<{ status: string }>(`/servers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Audit logs endpoint
  async getAuditLogs(params: { page?: number; limit?: number } = {}) {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())

    return this.request<{
      logs: Array<{
        id: string
        adminId: string
        username: string
        action: string
        targetType: string | null
        targetId: string | null
        details: Record<string, unknown> | null
        ipAddress: string | null
        createdAt: string
      }>
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
    }>(`/audit-logs?${searchParams.toString()}`)
  }
}

export const adminApi = new AdminApiClient()
export type { ApiError }
