'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function AuthForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [token, setToken] = useState('')

  // Auto redirect to home after successful login
  useEffect(() => {
    if (token) {
      const timer = setTimeout(() => {
        router.push('/')
      }, 1500) // Show success message for 1.5 seconds then redirect
      return () => clearTimeout(timer)
    }
  }, [token, router])

  // Signup state
  const [signupData, setSignupData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
  })

  // Login state
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  })

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || data.details || 'Signup failed')
        console.error('Signup error:', data)
        return
      }

      setSuccess(`Welcome ${data.data.username}! Signup successful!`)
      setToken(data.data.token)
      localStorage.setItem('authToken', data.data.token)
      localStorage.setItem('userId', data.data.userId)
      
      // Reset form
      setSignupData({ username: '', email: '', password: '', fullName: '' })
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup')
      console.error('Signup exception:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || data.details || 'Login failed')
        console.error('Login error:', data)
        return
      }

      setSuccess(`Welcome back ${data.data.username}!`)
      setToken(data.data.token)
      localStorage.setItem('authToken', data.data.token)
      localStorage.setItem('userId', data.data.userId)
      
      // Reset form
      setLoginData({ email: '', password: '' })
    } catch (err: any) {
      setError(err.message || 'An error occurred during login')
      console.error('Login exception:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (token) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Authentication Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              ✓ {success}
            </AlertDescription>
          </Alert>
          <div className="bg-gray-100 p-3 rounded text-sm break-all">
            <p className="font-semibold mb-1">Your JWT Token:</p>
            <p className="font-mono text-xs">{token.substring(0, 50)}...</p>
          </div>
          <Button
            onClick={() => {
              setToken('')
              localStorage.removeItem('authToken')
              localStorage.removeItem('userId')
            }}
            className="w-full"
            variant="outline"
          >
            Logout
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Image 
            src="/zero-trust-logo.svg" 
            alt="Zero Trust Logo" 
            width={100} 
            height={100}
            className="rounded-lg"
          />
        </div>
        <CardTitle>Zero Trust Access Platform</CardTitle>
        <CardDescription>Sign in to your account or create a new one</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              ✗ {error}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </TabsContent>

          {/* Signup Tab */}
          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input
                  type="text"
                  placeholder="johndoe"
                  value={signupData.username}
                  onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                  required
                  minLength={3}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={signupData.fullName}
                  onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={signupData.email}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  required
                  minLength={6}
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500">Minimum 6 characters</p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Sign Up'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
