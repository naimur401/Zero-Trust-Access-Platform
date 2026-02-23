'use client'

import { useState, useRef, FormEvent } from 'react'
import { 
  Alert, 
  AlertDescription,
} from '@/components/ui/alert'
import {
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'

interface MLResult {
  mlRiskScore: number
  behavioralAnomalies: number
  federatedRiskScore: number
  analysis: {
    timestamp: string
    userId: string
    models: string[]
    confidence: number
  }
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

export default function MLModelDashboard() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<MLResult | null>(null)
  const [userId, setUserId] = useState('user-001')
  const [error, setError] = useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const handleClassify = async (e: FormEvent) => {
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
      const response = await fetch('/api/ml/classify-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          userId,
          resourceId: 'resource-api',
          action: 'WRITE',
          context: {
            ipAddress: '192.168.1.1',
            deviceId: 'device-001',
            location: 'Office',
            userAgent: 'Mozilla/5.0',
          },
        }),
      })

      const data = await readJsonSafe(response)

      if (!response.ok) {
        const msg =
          data?.error ||
          data?.message ||
          `Classification failed (HTTP ${response.status})`
        throw new Error(msg)
      }

      setResult(data)
    } catch (err: any) {
      if (err?.name === 'AbortError') return
      setError(err?.message || 'Failed to classify risk. Please try again.')
    } finally {
      if (abortRef.current === controller) {
        setLoading(false)
      }
    }
  }

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-400'
    if (score < 70) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getRiskLevel = (score: number) => {
    if (score < 30) return 'Low Risk'
    if (score < 70) return 'Medium Risk'
    return 'High Risk'
  }

  return (
    <div className="space-y-6">
      {/* ML Classification Form */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Classify Risk Score</CardTitle>
          <CardDescription className="text-slate-400">
            Submit a user profile to get ML-based risk assessment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleClassify} className="space-y-4">
            <div>
              <Label className="text-slate-300">User ID</Label>
              <Input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="user-001"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading && <Spinner className="mr-2 h-4 w-4" />}
              {loading ? 'Classifying...' : hasSubmitted ? 'Re-classify Risk' : 'Classify Risk'}
            </Button>
          </form>

          {/* Empty State */}
          {!hasSubmitted && !loading && !result && !error && (
            <Alert className="bg-slate-800 border-slate-700 animate-fade-in-up">
              <AlertDescription className="text-slate-300">
                Enter a user ID and click "Classify Risk" to view ML + behavioral + federated scores.
              </AlertDescription>
            </Alert>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="mt-6 space-y-4 pt-4 border-t border-slate-700 animate-fade-in-up">
              <div className="grid grid-cols-3 gap-3">
                <Skeleton className="h-24 w-full bg-slate-700" />
                <Skeleton className="h-24 w-full bg-slate-700" />
                <Skeleton className="h-24 w-full bg-slate-700" />
              </div>
              <Skeleton className="h-28 w-full bg-slate-700" />
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <Alert className="border-red-700 bg-red-950 animate-fade-in-up">
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          )}

          {/* Result State */}
          {result && !loading && !error && (
            <div className="animate-fade-in-up mt-6 space-y-4 pt-4 border-t border-slate-700">
              {/* Score Cards */}
              <div className="grid grid-cols-3 gap-3 animate-fade-in-up">
                <div className="p-4 bg-slate-700 rounded-lg text-center">
                  <p className="text-slate-400 text-xs mb-2">ML Model Score</p>
                  <p className={`text-3xl font-bold ${getRiskColor(result.mlRiskScore)}`}>
                    {result.mlRiskScore}
                  </p>
                  <p className="text-slate-400 text-xs mt-1">{getRiskLevel(result.mlRiskScore)}</p>
                </div>

                <div className="p-4 bg-slate-700 rounded-lg text-center">
                  <p className="text-slate-400 text-xs mb-2">Behavioral Anomalies</p>
                  <p className={`text-3xl font-bold ${getRiskColor(result.behavioralAnomalies)}`}>
                    {result.behavioralAnomalies}
                  </p>
                  <p className="text-slate-400 text-xs mt-1">{getRiskLevel(result.behavioralAnomalies)}</p>
                </div>

                <div className="p-4 bg-slate-700 rounded-lg text-center">
                  <p className="text-slate-400 text-xs mb-2">Federated Score</p>
                  <p className={`text-3xl font-bold ${getRiskColor(result.federatedRiskScore)}`}>
                    {result.federatedRiskScore}
                  </p>
                  <p className="text-slate-400 text-xs mt-1">{getRiskLevel(result.federatedRiskScore)}</p>
                </div>
              </div>

              {/* Analysis Info */}
              <div className="bg-slate-700 p-4 rounded-lg space-y-2 animate-fade-in-up">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Evaluation Time</span>
                  <span className="text-slate-200 text-sm">{result.analysis.timestamp}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Confidence Level</span>
                  <span className="text-slate-200 text-sm">{(result.analysis.confidence * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-2">Models Used</p>
                  <div className="flex flex-wrap gap-2">
                    {result.analysis.models.map((model) => (
                      <Badge key={model} variant="outline" className="text-slate-300 border-slate-600">
                        {model}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Model Details */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">ML Model Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="p-3 bg-slate-700 rounded-lg">
              <p className="text-white font-semibold text-sm mb-1">1. ML Risk Classifier</p>
              <p className="text-slate-400 text-xs">
                Analyzes temporal patterns (off-hours access), device changes, and user agent anomalies using
                neural networks. Returns risk score 0-100 based on historical patterns.
              </p>
            </div>

            <div className="p-3 bg-slate-700 rounded-lg">
              <p className="text-white font-semibold text-sm mb-1">2. Behavioral Anomaly Detector</p>
              <p className="text-slate-400 text-xs">
                Detects deviations from established user behavior using statistical methods. Identifies unusual
                time patterns, location changes, resource access anomalies, and rapid request patterns.
              </p>
            </div>

            <div className="p-3 bg-slate-700 rounded-lg">
              <p className="text-white font-semibold text-sm mb-1">3. Federated Learning Aggregator</p>
              <p className="text-slate-400 text-xs">
                Aggregates risk assessments from 3 distributed learning nodes without centralizing raw user data.
                Each node contributes to the final risk score with privacy preservation.
              </p>
            </div>
          </div>

          <div className="bg-blue-950 border border-blue-700 p-3 rounded-lg">
            <p className="text-blue-100 text-sm">
              <strong>Weighted Combination:</strong> Final Risk = (ML Score × 0.40) + (Behavioral × 0.35) +
              (Federated × 0.25)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
