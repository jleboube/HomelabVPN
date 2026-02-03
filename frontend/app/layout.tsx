import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HomelabVPN - Military-Grade Privacy',
  description: 'Secure, fast, and private WireGuard VPN. No logs. No tracking. Pure privacy.',
  keywords: ['VPN', 'WireGuard', 'Privacy', 'Security', 'No Logs'],
  authors: [{ name: 'HomelabVPN' }],
  openGraph: {
    title: 'HomelabVPN - Military-Grade Privacy',
    description: 'Secure, fast, and private WireGuard VPN. No logs. No tracking.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} antialiased`}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900">
          {children}
        </div>
      </body>
    </html>
  )
}
