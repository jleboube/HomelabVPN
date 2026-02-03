'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Terminal,
  Apple,
  Monitor,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ExternalLink
} from 'lucide-react'

export default function SetupPage() {
  const [copied, setCopied] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>('macos')

  const installCommand = 'curl -fsSL https://vpn.z-q.me/install.sh | bash'

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-white">
            HomelabVPN
          </Link>
          <Link
            href="/dashboard"
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Dashboard →
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Get Started with HomelabVPN
          </h1>
          <p className="text-xl text-slate-400">
            Connect securely in minutes with our easy setup process
          </p>
        </div>

        {/* Quick Install */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Terminal className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-semibold text-white">Quick Install (macOS & Linux)</h2>
          </div>
          <p className="text-slate-400 mb-6">
            Run this single command in your terminal to install everything automatically:
          </p>
          <div className="bg-slate-900 rounded-lg p-4 flex items-center justify-between gap-4">
            <code className="text-cyan-400 text-sm md:text-base font-mono break-all">
              {installCommand}
            </code>
            <button
              onClick={() => copyToClipboard(installCommand)}
              className="flex-shrink-0 p-2 hover:bg-slate-700 rounded-lg transition-colors"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-400" />
              ) : (
                <Copy className="w-5 h-5 text-slate-400" />
              )}
            </button>
          </div>
          <p className="text-slate-500 text-sm mt-4">
            This script will install WireGuard, wstunnel, generate your keys, and set up connection scripts.
          </p>
        </div>

        {/* Platform-specific instructions */}
        <div className="space-y-4">
          {/* macOS */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('macos')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Apple className="w-6 h-6 text-slate-300" />
                <span className="text-lg font-medium text-white">macOS</span>
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                  Fully Supported
                </span>
              </div>
              {expandedSection === 'macos' ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>
            {expandedSection === 'macos' && (
              <div className="px-6 pb-6 border-t border-slate-700">
                <ol className="mt-4 space-y-4 text-slate-300">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center text-sm font-medium">1</span>
                    <span>Open Terminal and run the quick install command above</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center text-sm font-medium">2</span>
                    <span>Sign in to your account and register your device</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center text-sm font-medium">3</span>
                    <span>Restart your terminal, then run <code className="text-cyan-400 bg-slate-900 px-2 py-1 rounded">vpn-connect</code></span>
                  </li>
                </ol>
              </div>
            )}
          </div>

          {/* Linux */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('linux')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Monitor className="w-6 h-6 text-slate-300" />
                <span className="text-lg font-medium text-white">Linux</span>
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                  Fully Supported
                </span>
              </div>
              {expandedSection === 'linux' ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>
            {expandedSection === 'linux' && (
              <div className="px-6 pb-6 border-t border-slate-700">
                <ol className="mt-4 space-y-4 text-slate-300">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center text-sm font-medium">1</span>
                    <span>Open a terminal and run the quick install command above</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center text-sm font-medium">2</span>
                    <span>Sign in to your account and register your device</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center text-sm font-medium">3</span>
                    <span>Run <code className="text-cyan-400 bg-slate-900 px-2 py-1 rounded">source ~/.bashrc</code> then <code className="text-cyan-400 bg-slate-900 px-2 py-1 rounded">vpn-connect</code></span>
                  </li>
                </ol>
                <p className="mt-4 text-sm text-slate-500">
                  Supports Ubuntu, Debian, Fedora, Arch, and most other distributions.
                </p>
              </div>
            )}
          </div>

          {/* iOS */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('ios')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Apple className="w-6 h-6 text-slate-300" />
                <span className="text-lg font-medium text-white">iOS / iPadOS</span>
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
                  Limited Support
                </span>
              </div>
              {expandedSection === 'ios' ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>
            {expandedSection === 'ios' && (
              <div className="px-6 pb-6 border-t border-slate-700">
                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-200">
                    <p className="font-medium mb-1">iOS Limitation</p>
                    <p className="text-yellow-200/80">
                      iOS doesn't support the UDP tunneling required for our Cloudflare-protected connection.
                      iOS users need direct UDP access to the VPN server.
                    </p>
                  </div>
                </div>
                <div className="mt-4 text-slate-300">
                  <p className="mb-3">For iOS access, please contact support to get direct connection details.</p>
                  <a
                    href="mailto:support@vpn.z-q.me"
                    className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
                  >
                    Contact Support <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Windows */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('windows')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Monitor className="w-6 h-6 text-slate-300" />
                <span className="text-lg font-medium text-white">Windows</span>
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                  Manual Setup
                </span>
              </div>
              {expandedSection === 'windows' ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>
            {expandedSection === 'windows' && (
              <div className="px-6 pb-6 border-t border-slate-700">
                <ol className="mt-4 space-y-4 text-slate-300">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center text-sm font-medium">1</span>
                    <span>
                      Download and install{' '}
                      <a href="https://www.wireguard.com/install/" target="_blank" rel="noopener" className="text-cyan-400 hover:underline">
                        WireGuard for Windows
                      </a>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center text-sm font-medium">2</span>
                    <span>
                      Download{' '}
                      <a href="https://github.com/erebe/wstunnel/releases" target="_blank" rel="noopener" className="text-cyan-400 hover:underline">
                        wstunnel for Windows
                      </a>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center text-sm font-medium">3</span>
                    <span>Sign in and download your WireGuard config from your dashboard</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center text-sm font-medium">4</span>
                    <div>
                      <span>Run wstunnel in PowerShell:</span>
                      <code className="block mt-2 text-cyan-400 bg-slate-900 p-2 rounded text-sm">
                        wstunnel.exe client -L udp://127.0.0.1:51820:127.0.0.1:51820 wss://us-vpn.z-q.me
                      </code>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center text-sm font-medium">5</span>
                    <span>Import your config into WireGuard and connect</span>
                  </li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-12 text-center">
          <p className="text-slate-400 mb-4">Need help getting connected?</p>
          <div className="flex justify-center gap-4">
            <Link
              href="/help"
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Help Center
            </Link>
            <span className="text-slate-600">•</span>
            <Link
              href="/troubleshooting"
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Troubleshooting
            </Link>
            <span className="text-slate-600">•</span>
            <a
              href="mailto:support@vpn.z-q.me"
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
