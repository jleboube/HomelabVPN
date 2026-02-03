'use client'

import { useState, useEffect, useCallback } from 'react'
import { adminApi, ApiError } from '@/lib/api'

// Generic hook for fetching data
export function useAdminFetch<T>(
  fetcher: () => Promise<T>,
  dependencies: unknown[] = [],
  options: { immediate?: boolean } = { immediate: true }
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(options.immediate)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      setData(result)
    } catch (err) {
      const apiError = err as ApiError
      if (apiError.status === 401) {
        // Token expired, try to refresh
        const refreshToken = localStorage.getItem('admin_refresh_token')
        if (refreshToken) {
          try {
            const refreshData = await adminApi.refreshToken(refreshToken)
            localStorage.setItem('admin_token', refreshData.token)
            // Retry the original request
            const result = await fetcher()
            setData(result)
            return
          } catch {
            // Refresh failed, redirect to login
            localStorage.removeItem('admin_token')
            localStorage.removeItem('admin_refresh_token')
            localStorage.removeItem('admin_user')
            window.location.href = '/login'
            return
          }
        }
        // No refresh token, redirect to login
        window.location.href = '/login'
        return
      }
      setError(apiError.error || 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [fetcher])

  useEffect(() => {
    if (options.immediate) {
      fetch()
    }
  }, [...dependencies, options.immediate])

  return { data, loading, error, refetch: fetch }
}

// Dashboard stats hook
export function useDashboardStats() {
  return useAdminFetch(() => adminApi.getDashboardStats())
}

// System health hook
export function useSystemHealth() {
  return useAdminFetch(() => adminApi.getSystemHealth())
}

// Bandwidth history hook
export function useBandwidthHistory(period: string = '24h') {
  return useAdminFetch(() => adminApi.getBandwidthHistory(period), [period])
}

// User growth hook
export function useUserGrowth(period: string = '30d') {
  return useAdminFetch(() => adminApi.getUserGrowth(period), [period])
}

// Revenue stats hook
export function useRevenueStats() {
  return useAdminFetch(() => adminApi.getRevenueStats())
}

// Users list hook
export function useUsers(params: Parameters<typeof adminApi.getUsers>[0] = {}) {
  return useAdminFetch(
    () => adminApi.getUsers(params),
    [params.page, params.limit, params.search, params.status, params.plan]
  )
}

// Subscriptions list hook
export function useSubscriptions(params: Parameters<typeof adminApi.getSubscriptions>[0] = {}) {
  return useAdminFetch(
    () => adminApi.getSubscriptions(params),
    [params.page, params.limit, params.status, params.plan]
  )
}

// Servers list hook
export function useServers() {
  return useAdminFetch(() => adminApi.getServers())
}

// Audit logs hook
export function useAuditLogs(params: { page?: number; limit?: number } = {}) {
  return useAdminFetch(
    () => adminApi.getAuditLogs(params),
    [params.page, params.limit]
  )
}

// Auth check hook
export function useAuthCheck() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [user, setUser] = useState<{
    id: string
    email: string
    username: string
    role: string
  } | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    const userStr = localStorage.getItem('admin_user')

    if (!token) {
      setIsAuthenticated(false)
      return
    }

    try {
      if (userStr) {
        setUser(JSON.parse(userStr))
      }
      setIsAuthenticated(true)
    } catch {
      setIsAuthenticated(false)
    }
  }, [])

  return { isAuthenticated, user }
}

// Auto-refresh hook for real-time data
export function useAutoRefresh<T>(
  fetcher: () => Promise<T>,
  intervalMs: number = 30000
) {
  const { data, loading, error, refetch } = useAdminFetch(fetcher)

  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, intervalMs)

    return () => clearInterval(interval)
  }, [refetch, intervalMs])

  return { data, loading, error, refetch }
}
