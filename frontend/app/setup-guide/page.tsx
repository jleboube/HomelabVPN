'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { motion } from 'framer-motion'
import {
  Monitor,
  Smartphone,
  Download,
  Settings,
  CheckCircle,
  Terminal,
  Copy,
  ExternalLink,
  Apple,
  Server
} from 'lucide-react'
import { useState } from 'react'

const platforms = [
  { id: 'macos', label: 'macOS', icon: Apple },
  { id: 'ios', label: 'iOS', icon: Smartphone },
  { id: 'windows', label: 'Windows', icon: Monitor },
  { id: 'linux', label: 'Linux', icon: Terminal },
]

export default function SetupGuide() {
  const [selectedPlatform, setSelectedPlatform] = useState('macos')
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCommand(id)
    setTimeout(() => setCopiedCommand(null), 2000)
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Setup Guide
              </h1>
              <p className="text-xl text-slate-400">
                Get connected to HomelabVPN in minutes.
              </p>
            </motion.div>
          </div>

          {/* Quick Start */}
          <section id="quick-start" className="mb-16">
            <h2 className="text-2xl font-semibold text-white mb-6">Quick Start</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { step: 1, title: 'Create Account', description: 'Sign up and choose a subscription plan', href: '#create-account' },
                { step: 2, title: 'Download Config', description: 'Get your WireGuard configuration file', href: '#download' },
                { step: 3, title: 'Connect', description: 'Import config and connect to VPN', href: '#connect' },
              ].map((item) => (
                <a
                  key={item.step}
                  href={item.href}
                  className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-4">
                    <span className="text-white font-bold">{item.step}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-slate-400 text-sm">{item.description}</p>
                </a>
              ))}
            </div>
          </section>

          {/* Create Account */}
          <section id="create-account" className="mb-16">
            <h2 className="text-2xl font-semibold text-white mb-6">1. Create Your Account</h2>
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <ol className="space-y-4 text-slate-300">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span>Visit the <a href="/#pricing" className="text-cyan-400 hover:text-cyan-300">pricing page</a> and select your preferred plan (Basic or Pro).</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span>Choose your billing cycle: daily ($2-4), monthly ($10-15), or yearly ($80-120).</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span>Enter your email address and complete the secure Stripe checkout.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span>Check your email for a confirmation with your account details.</span>
                </li>
              </ol>
            </div>
          </section>

          {/* Download Config */}
          <section id="download" className="mb-16">
            <h2 className="text-2xl font-semibold text-white mb-6">2. Download Your Configuration</h2>
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <ol className="space-y-4 text-slate-300">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span>Log in to your <a href="/dashboard" className="text-cyan-400 hover:text-cyan-300">dashboard</a>.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span>Select your preferred server location from the map or list.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span>Click &quot;Download Config&quot; to get your <code className="px-2 py-0.5 rounded bg-white/10 text-cyan-400">.conf</code> file.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span>Save the file somewhere accessible. You&apos;ll import it into WireGuard next.</span>
                </li>
              </ol>

              <div className="mt-6 p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <p className="text-slate-300 text-sm">
                  <strong className="text-cyan-400">Tip:</strong> Each configuration is unique to your account. Never share it with others, as it would allow them to use your VPN quota.
                </p>
              </div>
            </div>
          </section>

          {/* Platform Selection */}
          <section id="connect" className="mb-16">
            <h2 className="text-2xl font-semibold text-white mb-6">3. Connect to VPN</h2>

            {/* Platform tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => setSelectedPlatform(platform.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedPlatform === platform.id
                      ? 'bg-cyan-500 text-white'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <platform.icon className="w-4 h-4" />
                  {platform.label}
                </button>
              ))}
            </div>

            {/* macOS Instructions */}
            {selectedPlatform === 'macos' && (
              <div id="macos" className="p-6 rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">macOS Setup</h3>
                <ol className="space-y-4 text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white flex-shrink-0">1</span>
                    <div>
                      <p>Download WireGuard from the Mac App Store:</p>
                      <a
                        href="https://apps.apple.com/us/app/wireguard/id1451685025"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-lg bg-white/10 text-cyan-400 hover:bg-white/15 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download WireGuard
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white flex-shrink-0">2</span>
                    <span>Open WireGuard and click &quot;Import tunnel(s) from file...&quot;</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white flex-shrink-0">3</span>
                    <span>Select the <code className="px-2 py-0.5 rounded bg-white/10 text-cyan-400">.conf</code> file you downloaded.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white flex-shrink-0">4</span>
                    <span>Click &quot;Activate&quot; to connect. You should see the status change to &quot;Active&quot;.</span>
                  </li>
                </ol>
              </div>
            )}

            {/* iOS Instructions */}
            {selectedPlatform === 'ios' && (
              <div id="ios" className="p-6 rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">iOS Setup</h3>
                <ol className="space-y-4 text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white flex-shrink-0">1</span>
                    <div>
                      <p>Download WireGuard from the App Store:</p>
                      <a
                        href="https://apps.apple.com/us/app/wireguard/id1441195209"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-lg bg-white/10 text-cyan-400 hover:bg-white/15 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download WireGuard
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white flex-shrink-0">2</span>
                    <span>Download your config file on your iPhone (or transfer from computer via AirDrop).</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white flex-shrink-0">3</span>
                    <span>Open the file. It will prompt to open in WireGuard.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white flex-shrink-0">4</span>
                    <span>Tap &quot;Allow&quot; to add the VPN configuration to your device.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white flex-shrink-0">5</span>
                    <span>Toggle the switch to connect. You&apos;ll see a VPN icon in your status bar when connected.</span>
                  </li>
                </ol>
              </div>
            )}

            {/* Windows Instructions */}
            {selectedPlatform === 'windows' && (
              <div id="windows" className="p-6 rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Windows Setup</h3>
                <ol className="space-y-4 text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white flex-shrink-0">1</span>
                    <div>
                      <p>Download WireGuard for Windows:</p>
                      <a
                        href="https://www.wireguard.com/install/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-lg bg-white/10 text-cyan-400 hover:bg-white/15 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download WireGuard
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white flex-shrink-0">2</span>
                    <span>Run the installer and follow the prompts.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white flex-shrink-0">3</span>
                    <span>Open WireGuard and click &quot;Import tunnel(s) from file&quot;.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white flex-shrink-0">4</span>
                    <span>Select your downloaded <code className="px-2 py-0.5 rounded bg-white/10 text-cyan-400">.conf</code> file.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white flex-shrink-0">5</span>
                    <span>Click &quot;Activate&quot; to connect.</span>
                  </li>
                </ol>
              </div>
            )}

            {/* Linux Instructions */}
            {selectedPlatform === 'linux' && (
              <div id="linux" className="p-6 rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Linux Setup</h3>
                <ol className="space-y-4 text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white flex-shrink-0">1</span>
                    <div className="flex-1">
                      <p className="mb-2">Install WireGuard:</p>
                      <div className="relative">
                        <pre className="p-4 rounded-lg bg-slate-900 text-slate-300 text-sm overflow-x-auto">
                          <code>sudo apt install wireguard</code>
                        </pre>
                        <button
                          onClick={() => copyToClipboard('sudo apt install wireguard', 'install')}
                          className="absolute top-2 right-2 p-2 rounded bg-white/10 hover:bg-white/20 transition-colors"
                        >
                          {copiedCommand === 'install' ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white flex-shrink-0">2</span>
                    <div className="flex-1">
                      <p className="mb-2">Copy your config file to WireGuard directory:</p>
                      <div className="relative">
                        <pre className="p-4 rounded-lg bg-slate-900 text-slate-300 text-sm overflow-x-auto">
                          <code>sudo cp ~/Downloads/homelabvpn.conf /etc/wireguard/wg0.conf</code>
                        </pre>
                        <button
                          onClick={() => copyToClipboard('sudo cp ~/Downloads/homelabvpn.conf /etc/wireguard/wg0.conf', 'copy')}
                          className="absolute top-2 right-2 p-2 rounded bg-white/10 hover:bg-white/20 transition-colors"
                        >
                          {copiedCommand === 'copy' ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white flex-shrink-0">3</span>
                    <div className="flex-1">
                      <p className="mb-2">Start the VPN connection:</p>
                      <div className="relative">
                        <pre className="p-4 rounded-lg bg-slate-900 text-slate-300 text-sm overflow-x-auto">
                          <code>sudo wg-quick up wg0</code>
                        </pre>
                        <button
                          onClick={() => copyToClipboard('sudo wg-quick up wg0', 'up')}
                          className="absolute top-2 right-2 p-2 rounded bg-white/10 hover:bg-white/20 transition-colors"
                        >
                          {copiedCommand === 'up' ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white flex-shrink-0">4</span>
                    <div className="flex-1">
                      <p className="mb-2">To disconnect:</p>
                      <div className="relative">
                        <pre className="p-4 rounded-lg bg-slate-900 text-slate-300 text-sm overflow-x-auto">
                          <code>sudo wg-quick down wg0</code>
                        </pre>
                        <button
                          onClick={() => copyToClipboard('sudo wg-quick down wg0', 'down')}
                          className="absolute top-2 right-2 p-2 rounded bg-white/10 hover:bg-white/20 transition-colors"
                        >
                          {copiedCommand === 'down' ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </li>
                </ol>
              </div>
            )}
          </section>

          {/* Server Selection */}
          <section id="server-selection" className="mb-16">
            <h2 className="text-2xl font-semibold text-white mb-6">Choosing a Server Location</h2>
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-start gap-4 mb-6">
                <Server className="w-6 h-6 text-cyan-400 mt-1 flex-shrink-0" />
                <div className="text-slate-300">
                  <p className="mb-4">
                    Choose a server location based on your needs:
                  </p>
                  <ul className="space-y-3">
                    <li><strong className="text-white">For fastest speeds:</strong> Choose the server closest to your physical location.</li>
                    <li><strong className="text-white">For accessing geo-restricted content:</strong> Choose a server in the country whose content you want to access.</li>
                    <li><strong className="text-white">For privacy:</strong> Any server provides the same level of privacy protection.</li>
                  </ul>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <p className="text-slate-300 text-sm">
                  <strong className="text-cyan-400">Pro tip:</strong> Check the server load percentage on your dashboard. Servers with lower load typically provide faster speeds.
                </p>
              </div>
            </div>
          </section>

          {/* Verify Connection */}
          <section id="verify-connection" className="mb-16">
            <h2 className="text-2xl font-semibold text-white mb-6">Verify Your Connection</h2>
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <p className="text-slate-300 mb-4">
                After connecting, verify your VPN is working correctly:
              </p>
              <ol className="space-y-3 text-slate-300">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span>Visit <a href="https://whatismyipaddress.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">whatismyipaddress.com</a> - your IP should show the VPN server location, not your real location.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span>Check for DNS leaks at <a href="https://dnsleaktest.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">dnsleaktest.com</a> - only VPN DNS servers should appear.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span>In your dashboard, check that your connection status shows as &quot;Connected&quot;.</span>
                </li>
              </ol>
            </div>
          </section>

          {/* Need Help */}
          <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20">
            <h3 className="text-xl font-semibold text-white mb-3">
              Need More Help?
            </h3>
            <p className="text-slate-400 mb-6">
              Check our troubleshooting guide or contact support if you&apos;re having issues.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/troubleshooting"
                className="px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/15 transition-colors"
              >
                Troubleshooting
              </a>
              <a
                href="/contact"
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
