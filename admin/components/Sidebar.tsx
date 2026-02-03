'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Shield,
  LayoutDashboard,
  Users,
  CreditCard,
  Server,
  Settings,
  LogOut,
  Activity,
  Globe,
  Smartphone,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Peers', href: '/peers', icon: Smartphone },
  { name: 'Subscriptions', href: '/subscriptions', icon: CreditCard },
  { name: 'VPN Servers', href: '/servers', icon: Server },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    window.location.href = '/login'
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg">HomelabVPN</span>
            <span className="block text-xs text-slate-400">Admin Panel</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Status indicator */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800/50">
          <div className="relative">
            <Activity className="w-5 h-5 text-green-400" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
          </div>
          <div>
            <span className="block text-sm font-medium text-white">System Status</span>
            <span className="block text-xs text-green-400">All systems operational</span>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="p-4 border-t border-slate-800">
        <div className="grid grid-cols-2 gap-2">
          <div className="px-3 py-2 bg-slate-800/50 rounded-lg text-center">
            <Globe className="w-4 h-4 text-slate-400 mx-auto mb-1" />
            <span className="block text-lg font-bold text-white">10</span>
            <span className="block text-xs text-slate-500">Servers</span>
          </div>
          <div className="px-3 py-2 bg-slate-800/50 rounded-lg text-center">
            <Users className="w-4 h-4 text-slate-400 mx-auto mb-1" />
            <span className="block text-lg font-bold text-white">--</span>
            <span className="block text-xs text-slate-500">Online</span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
