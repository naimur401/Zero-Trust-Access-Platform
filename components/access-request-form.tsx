'use client'

import { useState, FormEvent, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'

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

export default function AccessRequestForm() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const [formData, setFormData] = useState({
    userId: 'user-001',
    resourceId: 'resource-database-prod',
    action: 'READ',
    ipAddress: '192.168.1.100',
    deviceId: 'device-laptop-01',
    location: 'Office',
    userAgent: 'Mozilla/5.0',
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setHasSubmitted(true)
    setError(null)
    setResult(null)
    setLoading(true)

    // Abort previous request if still pending
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const response = await fetch('/api/access-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          userId: formData.userId,
          resourceId: formData.resourceId,
          action: formData.action,
          context: {
            ipAddress: formData.ipAddress,
            deviceId: formData.deviceId,
            location: formData.location,
            userAgent: formData.userAgent,
          },
        }),
      })

      const data = await readJsonSafe(response)

      if (!response.ok) {
        const msg =
          data?.error ||
          data?.message ||
          `Request failed (HTTP ${response.status})`
        throw new Error(msg)
      }

      setResult(data)
    } catch (err: any) {
      if (err?.name === 'AbortError') return
      setError(err?.message || 'Failed to process request. Please try again.')
    } finally {
      if (abortRef.current === controller) {
        setLoading(false)
      }
    }
  }

  const getDecisionColor = (decision: string) => {
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

  const getRiskColor = (risk: number) => {
    if (risk < 30) return 'text-green-400'
    if (risk < 70) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Submit Access Request</CardTitle>
          <CardDescription className="text-slate-400">
            Submit a simulated access request to evaluate Zero Trust policies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">User ID</Label>
                <Input
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="user-001"
                />
              </div>
              <div>
                <Label className="text-slate-300">Resource ID</Label>
                <Input
                  value={formData.resourceId}
                  onChange={(e) => setFormData({ ...formData, resourceId: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="resource-database-prod"
                />
              </div>
              <div>
                <Label className="text-slate-300">Action</Label>
                <Select value={formData.action} onValueChange={(value) => setFormData({ ...formData, action: value })}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="READ">READ</SelectItem>
                    <SelectItem value="WRITE">WRITE</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Device ID</Label>
                <Input
                  value={formData.deviceId}
                  onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="device-laptop-01"
                />
              </div>
              <div>
                <Label className="text-slate-300">Location</Label>
                <Select value={formData.location} onValueChange={(value) => setFormData({ ...formData, location: value })}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="Office">Office</SelectItem>
                    <SelectItem value="Remote">Remote</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">IP Address</Label>
                <Input
                  value={formData.ipAddress}
                  onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="192.168.1.100"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading && <Spinner className="mr-2 h-4 w-4" />}
              {loading ? 'Evaluating...' : 'Submit Access Request'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {hasSubmitted && !loading && !result && !error && (
        <Card className="bg-slate-800 border-slate-700 animate-fade-in-up">
          <CardContent className="py-12 text-center">
            <p className="text-slate-400 text-lg mb-4">No results yet</p>
            <p className="text-slate-500">Submit the form above to see access decision results</p>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="space-y-4 animate-fade-in-up">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <Skeleton className="h-8 w-48 mb-2 bg-slate-700" />
              <Skeleton className="h-4 w-3/4 bg-slate-700" />
            </CardHeader>
            <CardContent className="space-y-6 pt-0">
              <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                <div>
                  <Skeleton className="h-4 w-24 mb-1 bg-slate-700" />
                  <Skeleton className="h-6 w-32 bg-slate-700" />
                </div>
                <Skeleton className="h-10 w-28 rounded-md bg-slate-700" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-20 w-full bg-slate-700" />
                <Skeleton className="h-20 w-full bg-slate-700" />
                <Skeleton className="h-20 w-full bg-slate-700" />
              </div>

              <div>
                <Skeleton className="h-4 w-32 mb-3 bg-slate-700" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-8 w-20 bg-slate-700" />
                  <Skeleton className="h-8 w-24 bg-slate-700" />
                  <Skeleton className="h-8 w-28 bg-slate-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <Alert className="border-red-700 bg-red-950 animate-fade-in-up">
          <AlertDescription className="text-red-200">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {result && !loading && !error && (
        <div className="animate-fade-in-up space-y-4">
          <Card className={`border-2 ${result.error ? 'border-red-700 bg-red-950' : 'border-slate-700 bg-slate-800'}`}>
            <CardHeader>
              <CardTitle className="text-white">Access Decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {result.error ? (
                <div className="text-red-300">{result.error}</div>
              ) : (
                <>
                  {/* Decision Summary */}
                  <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                    <div>
                      <p className="text-slate-400 text-sm">Final Decision</p>
                      <p className="text-white font-semibold">
                        {result.riskProfile?.finalDecision || 'PENDING'}
                      </p>
                    </div>
                    <Badge className={`text-lg px-4 py-2 border ${getDecisionColor(result.riskProfile?.finalDecision)}`}>
                      {result.riskProfile?.finalDecision || 'UNKNOWN'}
                    </Badge>
                  </div>

                  {/* Risk Scores */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-slate-700 rounded-lg">
                      <p className="text-slate-400 text-xs">ML Risk Score</p>
                      <p className={`text-2xl font-bold ${getRiskColor(result.riskProfile?.mlRiskScore)}`}>
                        {result.riskProfile?.mlRiskScore || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-700 rounded-lg">
                      <p className="text-slate-400 text-xs">Behavioral Anomalies</p>
                      <p className={`text-2xl font-bold ${getRiskColor(result.riskProfile?.behavioralAnomalies)}`}>
                        {result.riskProfile?.behavioralAnomalies || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-700 rounded-lg">
                      <p className="text-slate-400 text-xs">Federated Risk</p>
                      <p className={`text-2xl font-bold ${getRiskColor(result.riskProfile?.federatedRiskScore)}`}>
                        {result.riskProfile?.federatedRiskScore || 0}
                      </p>
                    </div>
                  </div>

                  {/* Risk Factors */}
                  <div>
                    <p className="text-slate-400 text-sm mb-2">Contributing Factors</p>
                    <div className="flex flex-wrap gap-2">
                      {result.riskProfile?.factors?.map((factor: string) => (
                        <Badge key={factor} variant="outline" className="text-slate-300 border-slate-600">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Workflow Status */}
                  {result.workflowExecution && (
                    <div>
                      <p className="text-slate-400 text-sm mb-2">Workflow Execution</p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-300">Execution ID</span>
                          <span className="text-slate-400 font-mono text-xs">{result.workflowExecution.id.slice(0, 20)}...</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-300">Status</span>
                          <Badge variant="outline" className="text-green-300 border-green-600">
                            {result.workflowExecution.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-300">Nodes Executed</span>
                          <span className="text-slate-400">{result.workflowExecution.nodeExecutions?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
