'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import DashboardEnhanced from '@/components/dashboard-enhanced'
import { Button } from '@/components/ui/button'

export default function Page() {
  const [token, setToken] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedToken = localStorage.getItem('authToken')
    setToken(savedToken)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userId')
    setToken(null)
  }

  if (!mounted) return null

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔐</span>
            <h1 className="text-xl font-bold text-white">Zero Trust Platform</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {token ? (
              <>
                <span className="text-sm text-gray-300">Authenticated ✓</span>
                <Button 
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                >
                  Logout
                </Button>
              </>
            ) : (
              <Link href="/auth">
                <Button variant="default" size="sm">
                  Sign In / Sign Up
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {token ? (
          <DashboardEnhanced />
        ) : (
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="text-center max-w-md">
              <h2 className="text-4xl font-bold text-white mb-4">Welcome</h2>
              <p className="text-gray-300 mb-8">
                Sign in to access your Zero Trust Access Control Platform dashboard
              </p>
              <Link href="/auth">
                <Button size="lg" className="w-full">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
