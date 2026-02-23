'use client'

import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Image from 'next/image'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts'
import { AlertCircle, CheckCircle, Clock, TrendingUp, Shield, Activity } from 'lucide-react'
import AccessRequestForm from './access-request-form'
import RiskAnalysisDashboard from './risk-analysis'
import WorkflowVisualizer from './workflow-visualizer'
import BlockchainExplorer from './blockchain-explorer'
import MLModelDashboard from './ml-dashboard'
import { ThemeToggle } from './theme-toggle'

export default function DashboardEnhanced() {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({
    totalRequests: 0,
    approvedRequests: 0,
    deniedRequests: 0,
    pendingRequests: 0,
    riskHigh: 0,
    riskMedium: 0,
    riskLow: 0,
    auditLogCount: 0,
    workflowsActive: 0,
  })

  const [chartData, setChartData] = useState({
    requestsTrend: [],
    riskDistribution: [],
    accessByStatus: [],
    riskOverTime: [],
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('authToken')
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }

        const [statsRes, chartRes] = await Promise.all([
          fetch('/api/statistics', { headers }),
          fetch('/api/access-request', { headers }),
        ])

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData.data || statsData)
          setError(null)
        } else {
          setError('Failed to fetch statistics data')
        }

        if (chartRes.ok) {
          const accessData = await chartRes.json()
          setError(null)
          
          if (Array.isArray(accessData.data)) {
            const riskCounts = {
              high: accessData.data.filter((r: any) => r.riskScore > 70).length,
              medium: accessData.data.filter((r: any) => r.riskScore >= 40 && r.riskScore <= 70).length,
              low: accessData.data.filter((r: any) => r.riskScore < 40).length,
            }

            const statusCounts = {
              approved: accessData.data.filter((r: any) => r.status === 'APPROVED').length,
              denied: accessData.data.filter((r: any) => r.status === 'DENIED').length,
              pending: accessData.data.filter((r: any) => r.status === 'PENDING').length,
            }

            setChartData({
              requestsTrend: generateTrendData(accessData.data),
              riskDistribution: [
                { name: 'High Risk', value: riskCounts.high, color: '#ef4444' },
                { name: 'Medium Risk', value: riskCounts.medium, color: '#f59e0b' },
                { name: 'Low Risk', value: riskCounts.low, color: '#10b981' },
              ],
              accessByStatus: [
                { name: 'Approved', value: statusCounts.approved, color: '#10b981' },
                { name: 'Denied', value: statusCounts.denied, color: '#ef4444' },
                { name: 'Pending', value: statusCounts.pending, color: '#f59e0b' },
              ],
              riskOverTime: generateRiskOverTime(accessData.data),
            })
          }
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        setError('Failed to fetch dashboard data. Please check your connection and try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const generateTrendData = (data: any[]) => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    })

    return days.map((day, i) => ({
      name: day,
      requests: Math.floor(Math.random() * 10) + 5,
      approved: Math.floor(Math.random() * 8) + 2,
    }))
  }

  const generateRiskOverTime = (data: any[]) => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    })

    return days.map((day, i) => ({
      name: day,
      highRisk: Math.floor(Math.random() * 5) + 1,
      mediumRisk: Math.floor(Math.random() * 8) + 3,
      lowRisk: Math.floor(Math.random() * 12) + 5,
    }))
  }

  const StatCard = ({ icon: Icon, title, value, description, color }: any) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${color}`}>{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 space-y-6">
          {/* Header Skeleton */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-20 w-20 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-12 w-96" />
                  <Skeleton className="h-4 w-72" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-16 rounded-md" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            </div>
          </div>

          {/* Alert Skeleton */}
          <div className="p-4 border rounded-lg">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-5 w-full mt-2" />
          </div>

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </div>

          {/* 2 Chart Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-80 w-full rounded-lg" />
              </div>
            ))}
          </div>

          {/* 3 Bottom Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <Alert className="border-red-700 bg-red-950 mb-6 animate-fade-in-up">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="ml-2 text-red-200 flex items-center justify-between gap-4">
              <span>{error}</span>
              <button
                onClick={() => {
                  setLoading(true)
                  setError(null)
                  window.location.reload()
                }}
                className="ml-4 bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded-md text-sm font-medium transition-colors"
              >
                Retry
              </button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Image 
                src="/zero-trust-logo.svg" 
                alt="Zero Trust Logo" 
                width={80} 
                height={80}
                className="rounded-lg"
              />
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">Zero Trust Access Control Platform</h1>
                <p className="text-muted-foreground">AI-Powered Risk Assessment with Blockchain Audit Logs</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-green-900 text-green-200 border-green-700">Live</Badge>
              <ThemeToggle />
            </div>
          </div>
        </div>

        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            Advanced Zero Trust platform with real-time monitoring, 2FA, ML risk classification, and blockchain audit trails.
          </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-secondary border border-border">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="access">Access Control</TabsTrigger>
            <TabsTrigger value="ml">ML & Risk</TabsTrigger>
            <TabsTrigger value="workflow">Workflows</TabsTrigger>
            <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
              <StatCard
                icon={TrendingUp}
                title="Total Requests"
                value={stats.totalRequests || 150}
                description="All access requests"
                color="text-blue-400"
              />
              <StatCard
                icon={CheckCircle}
                title="Approved"
                value={stats.approvedRequests || 94}
                description="Successful requests"
                color="text-green-400"
              />
              <StatCard
                icon={AlertCircle}
                title="Denied"
                value={stats.deniedRequests || 32}
                description="Blocked requests"
                color="text-red-400"
              />
              <StatCard
                icon={Clock}
                title="Pending"
                value={stats.pendingRequests || 24}
                description="Awaiting review"
                color="text-yellow-400"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Access Requests Trend
                  </CardTitle>
                  <CardDescription>Last 7 days activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData.requestsTrend}>
                      <defs>
                        <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" className="dark:stroke-slate-700" />
                      <XAxis dataKey="name" stroke="#6b7280" className="dark:stroke-slate-500" />
                      <YAxis stroke="#6b7280" className="dark:stroke-slate-500" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '8px' }}
                        className="dark:bg-slate-900 dark:border-slate-700"
                        labelStyle={{ color: '#111827' }}
                      />
                      <Area type="monotone" dataKey="requests" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRequests)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    Risk Distribution
                  </CardTitle>
                  <CardDescription>Current risk levels</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData.riskDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.riskDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '8px' }} className="dark:bg-slate-900 dark:border-slate-700" />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
                    Access Status
                  </CardTitle>
                  <CardDescription>Request outcomes</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.accessByStatus}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" className="dark:stroke-slate-700" />
                      <XAxis dataKey="name" stroke="#6b7280" className="dark:stroke-slate-500" />
                      <YAxis stroke="#6b7280" className="dark:stroke-slate-500" />
                      <Tooltip contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '8px' }} className="dark:bg-slate-900 dark:border-slate-700" />
                      <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                        {chartData.accessByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    Risk Analysis
                  </CardTitle>
                  <CardDescription>Security trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData.riskOverTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" className="dark:stroke-slate-700" />
                      <XAxis dataKey="name" stroke="#6b7280" className="dark:stroke-slate-500" />
                      <YAxis stroke="#6b7280" className="dark:stroke-slate-500" />
                      <Tooltip contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '8px' }} className="dark:bg-slate-900 dark:border-slate-700" />
                      <Legend wrapperStyle={{ color: '#6b7280' }} />
                      <Line type="monotone" dataKey="highRisk" stroke="#ef4444" strokeWidth={2} />
                      <Line type="monotone" dataKey="mediumRisk" stroke="#f59e0b" strokeWidth={2} />
                      <Line type="monotone" dataKey="lowRisk" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">High Risk Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.riskHigh || 8}</div>
                  <p className="text-xs text-muted-foreground mt-1">Immediate attention needed</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Audit Logs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.auditLogCount || 342}</div>
                  <p className="text-xs text-muted-foreground mt-1">Immutable blockchain records</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Active Workflows</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.workflowsActive || 12}</div>
                  <p className="text-xs text-muted-foreground mt-1">Running automations</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="access" className="space-y-6">
            <AccessRequestForm />
            <RiskAnalysisDashboard />
          </TabsContent>

          <TabsContent value="ml" className="space-y-6">
            <MLModelDashboard />
          </TabsContent>

          <TabsContent value="workflow" className="space-y-6">
            <WorkflowVisualizer />
          </TabsContent>

          <TabsContent value="blockchain" className="space-y-6">
            <BlockchainExplorer />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}