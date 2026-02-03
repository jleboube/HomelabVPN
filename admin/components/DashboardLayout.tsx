'use client'

import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import { Bell, Search, User } from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export default function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const [admin, setAdmin] = useState<{ email: string; name: string } | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    const adminData = localStorage.getItem('admin_user')

    if (!token) {
      window.location.href = '/login'
      return
    }

    if (adminData) {
      setAdmin(JSON.parse(adminData))
    }
  }, [])

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />

      {/* Main content */}
      <main className="ml-64">
        {/* Top header */}
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
              {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 w-64 rounded-lg border border-slate-200 text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                />
              </div>

              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* Admin profile */}
              <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <span className="block text-sm font-medium text-slate-700">
                    {admin?.name || 'Admin'}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {admin?.email || 'admin@vpn.z-q.me'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
