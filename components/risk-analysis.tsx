'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

interface RiskEntry {
  timestamp: number
  userId: string
  decision: 'ALLOW' | 'DENY' | 'REQUIRE_MFA'
  riskScore: number
}

// Safe JSON parser for non-JSON responses
async function readJsonSafe(res: Response) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export default function RiskAnalysisDashboard() {
  const [entries, setEntries] = useState<RiskEntry[]>([])
  const [stats, setStats] = useState({ allow: 0, deny: 0, mfa: 0, avgRisk: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAuditLog = useCallback(async (signal?: AbortSignal) => {
    try {
      setError(null)
      const response = await fetch('/api/access-request', { signal })
      const data = await readJsonSafe(response)

      if (!response.ok) {
        throw new Error(data?.error || data?.message || `Failed to load audit log (HTTP ${response.status})`)
      }

      if (data?.auditLog) {
        setEntries(data.auditLog)

        // Calculate stats
        const allow = data.auditLog.filter((e: RiskEntry) => e.decision === 'ALLOW').length
        const deny = data.auditLog.filter((e: RiskEntry) => e.decision === 'DENY').length
        const mfa = data.auditLog.filter((e: RiskEntry) => e.decision === 'REQUIRE_MFA').length
        const avgRisk = data.auditLog.length > 0
          ? Math.round(
              data.auditLog.reduce((sum: number, e: RiskEntry) => sum + e.riskScore, 0) / data.auditLog.length
            )
          : 0

        setStats({ allow, deny, mfa, avgRisk })
      } else {
        setEntries([])
        setStats({ allow: 0, deny: 0, mfa: 0, avgRisk: 0 })
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return
      setError(err?.message || 'Failed to fetch audit log.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchAuditLog(controller.signal)

    const interval = setInterval(() => {
      fetchAuditLog()
    }, 5000)

    return () => {
      controller.abort()
      clearInterval(interval)
    }
  }, [fetchAuditLog])

  const getDecisionBadgeClass = (decision: string) => {
    switch (decision) {
      case 'ALLOW':
        return 'bg-green-900 text-green-100 border-green-700'
      case 'DENY':
        return 'bg-red-900 text-red-100 border-red-700'
      case 'REQUIRE_MFA':
        return 'bg-yellow-900 text-yellow-100 border-yellow-700'
      default:
        return 'bg-slate-700 text-slate-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <Alert className="border-red-700 bg-red-950 animate-fade-in-up">
          <AlertDescription className="text-red-200">{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading Skeleton */}
      {loading && entries.length === 0 ? (
        <div className="space-y-6">
          {/* Skeleton Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-up">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <Skeleton className="h-24 w-full bg-slate-700" />
                </CardContent>
              </Card>
            ))}
          </div>
          {/* Skeleton Table */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <Skeleton className="h-8 w-64 mb-2 bg-slate-700" />
              <Skeleton className="h-4 w-48 bg-slate-700" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full bg-slate-700" />
              ))}
            </CardContent>
          </Card>
        </div>
      ) : !loading && entries.length === 0 ? (
        /* Empty State */
        <Alert className="bg-slate-800 border-slate-700 animate-fade-in-up">
          <AlertDescription className="text-slate-300">
            No access decisions yet. Submit an access request to see risk analysis here.
          </AlertDescription>
        </Alert>
      ) : (
        /* Content */
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-up">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm font-medium">Allowed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-400">{stats.allow}</div>
                <p className="text-xs text-slate-400 mt-1">Access granted</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm font-medium">Denied</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-400">{stats.deny}</div>
                <p className="text-xs text-slate-400 mt-1">Access blocked</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm font-medium">MFA Required</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-400">{stats.mfa}</div>
                <p className="text-xs text-slate-400 mt-1">Additional verification</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm font-medium">Avg Risk Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-400">{stats.avgRisk}</div>
                <p className="text-xs text-slate-400 mt-1">Overall threat level</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Decisions */}
          <Card className="bg-slate-800 border-slate-700 animate-fade-in-up">
            <CardHeader>
              <CardTitle className="text-white">Recent Access Decisions</CardTitle>
              <CardDescription className="text-slate-400">
                Last {entries.length} evaluated requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {entries.length === 0 ? (
                <Alert className="bg-slate-700 border-slate-600">
                  <AlertDescription className="text-slate-300">
                    Submit an access request to see decisions here
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {entries.map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg hover:bg-slate-650 transition-colors duration-200 animate-fade-in-up">
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{entry.userId}</p>
                        <p className="text-slate-400 text-xs">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-slate-300 text-sm">Risk: {entry.riskScore}</p>
                        </div>
                        <Badge className={`border ${getDecisionBadgeClass(entry.decision)}`}>
                          {entry.decision}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Risk Distribution */}
          <Card className="bg-slate-800 border-slate-700 animate-fade-in-up">
            <CardHeader>
              <CardTitle className="text-white">Risk Assessment Summary</CardTitle>
              <CardDescription className="text-slate-400">
                Access request evaluation metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-300 text-sm">Approval Rate</span>
                    <span className="text-slate-400 text-sm">
                      {entries.length > 0
                        ? ((stats.allow / entries.length) * 100).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: entries.length > 0 ? (stats.allow / entries.length) * 100 : 0 + '%' }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-300 text-sm">Denial Rate</span>
                    <span className="text-slate-400 text-sm">
                      {entries.length > 0
                        ? ((stats.deny / entries.length) * 100).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: entries.length > 0 ? (stats.deny / entries.length) * 100 : 0 + '%' }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-300 text-sm">MFA Requirement Rate</span>
                    <span className="text-slate-400 text-sm">
                      {entries.length > 0
                        ? ((stats.mfa / entries.length) * 100).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{ width: entries.length > 0 ? (stats.mfa / entries.length) * 100 : 0 + '%' }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
