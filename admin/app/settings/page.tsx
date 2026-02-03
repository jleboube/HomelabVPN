'use client'

import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import {
  Save,
  Shield,
  Bell,
  Mail,
  Key,
  Globe,
  Database,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [showStripeKey, setShowStripeKey] = useState(false)
  const [saved, setSaved] = useState(false)

  const [settings, setSettings] = useState({
    // General
    siteName: '',
    siteUrl: '',
    adminEmail: '',
    supportEmail: '',

    // Security
    sessionTimeout: 15,
    maxLoginAttempts: 5,
    requireMFA: false,
    ipWhitelist: '',

    // Notifications
    emailNewUser: true,
    emailNewSubscription: true,
    emailCancellation: true,
    emailPaymentFailed: true,
    slackWebhook: '',

    // API Keys
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    googleClientId: '',
    googleClientSecret: '',

    // VPN Settings
    defaultDNS: '1.1.1.1, 1.0.0.1',
    keepaliveInterval: 25,
    maxDevicesBasic: 3,
    maxDevicesPro: 10,
  })
  const [loading, setLoading] = useState(true)

  const fetchSettings = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      const response = await fetch(`${backendUrl}/api/admin/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setSettings(prev => ({ ...prev, ...data }))
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      const response = await fetch(`${backendUrl}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })
      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        console.error('Failed to save settings')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'vpn', label: 'VPN Settings', icon: Database },
  ]

  return (
    <DashboardLayout title="Settings" subtitle="Configure your VPN service">
      <div className="flex gap-8">
        {/* Sidebar tabs */}
        <div className="w-64 flex-shrink-0">
          <nav className="bg-white rounded-xl shadow-sm border border-slate-200 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-cyan-50 text-cyan-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content area */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">General Settings</h3>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Site Name
                    </label>
                    <input
                      type="text"
                      value={settings.siteName}
                      onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Site URL
                    </label>
                    <input
                      type="text"
                      value={settings.siteUrl}
                      onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Admin Email
                    </label>
                    <input
                      type="email"
                      value={settings.adminEmail}
                      onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Support Email
                    </label>
                    <input
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Security Settings</h3>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Session Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Max Login Attempts
                    </label>
                    <input
                      type="number"
                      value={settings.maxLoginAttempts}
                      onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">Require MFA for Admins</p>
                    <p className="text-sm text-slate-500">Require multi-factor authentication for admin access</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, requireMFA: !settings.requireMFA })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      settings.requireMFA ? 'bg-cyan-500' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.requireMFA ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    IP Whitelist (comma-separated)
                  </label>
                  <textarea
                    value={settings.ipWhitelist}
                    onChange={(e) => setSettings({ ...settings, ipWhitelist: e.target.value })}
                    placeholder="Leave empty to allow all IPs"
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none resize-none h-24"
                  />
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Notification Settings</h3>

                <div className="space-y-4">
                  {[
                    { key: 'emailNewUser', label: 'New User Registration', desc: 'Get notified when a new user signs up' },
                    { key: 'emailNewSubscription', label: 'New Subscription', desc: 'Get notified when a user subscribes' },
                    { key: 'emailCancellation', label: 'Subscription Cancellation', desc: 'Get notified when a user cancels' },
                    { key: 'emailPaymentFailed', label: 'Failed Payment', desc: 'Get notified when a payment fails' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900">{item.label}</p>
                        <p className="text-sm text-slate-500">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => setSettings({ ...settings, [item.key]: !settings[item.key as keyof typeof settings] })}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          settings[item.key as keyof typeof settings] ? 'bg-cyan-500' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            settings[item.key as keyof typeof settings] ? 'left-7' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Slack Webhook URL
                  </label>
                  <input
                    type="text"
                    value={settings.slackWebhook}
                    onChange={(e) => setSettings({ ...settings, slackWebhook: e.target.value })}
                    placeholder="https://hooks.slack.com/services/..."
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                  />
                </div>
              </div>
            )}

            {/* API Keys */}
            {activeTab === 'api' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    Keep your API keys secure. Never share them publicly.
                  </p>
                </div>

                <h3 className="text-lg font-semibold text-slate-900">Stripe Configuration</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Stripe Secret Key
                    </label>
                    <div className="relative">
                      <input
                        type={showStripeKey ? 'text' : 'password'}
                        value={settings.stripeSecretKey}
                        onChange={(e) => setSettings({ ...settings, stripeSecretKey: e.target.value })}
                        className="w-full px-4 py-2 pr-12 rounded-lg border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStripeKey(!showStripeKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showStripeKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Stripe Webhook Secret
                    </label>
                    <input
                      type="password"
                      value={settings.stripeWebhookSecret}
                      onChange={(e) => setSettings({ ...settings, stripeWebhookSecret: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                    />
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-slate-900 mt-8">Google OAuth</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Client ID
                    </label>
                    <input
                      type="text"
                      value={settings.googleClientId}
                      onChange={(e) => setSettings({ ...settings, googleClientId: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Client Secret
                    </label>
                    <input
                      type="password"
                      value={settings.googleClientSecret}
                      onChange={(e) => setSettings({ ...settings, googleClientSecret: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* VPN Settings */}
            {activeTab === 'vpn' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">VPN Configuration</h3>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Default DNS Servers
                    </label>
                    <input
                      type="text"
                      value={settings.defaultDNS}
                      onChange={(e) => setSettings({ ...settings, defaultDNS: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Keepalive Interval (seconds)
                    </label>
                    <input
                      type="number"
                      value={settings.keepaliveInterval}
                      onChange={(e) => setSettings({ ...settings, keepaliveInterval: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Max Devices (Basic Plan)
                    </label>
                    <input
                      type="number"
                      value={settings.maxDevicesBasic}
                      onChange={(e) => setSettings({ ...settings, maxDevicesBasic: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Max Devices (Pro Plan)
                    </label>
                    <input
                      type="number"
                      value={settings.maxDevicesPro}
                      onChange={(e) => setSettings({ ...settings, maxDevicesPro: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Save button */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
              {saved ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span>Settings saved successfully!</span>
                </div>
              ) : (
                <span />
              )}
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500 text-white font-semibold rounded-lg hover:bg-cyan-600 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
