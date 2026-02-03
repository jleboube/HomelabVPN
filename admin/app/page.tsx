'use client'

import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem('admin_token')
    if (token) {
      window.location.href = '/dashboard'
    } else {
      window.location.href = '/login'
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
    </div>
  )
}
