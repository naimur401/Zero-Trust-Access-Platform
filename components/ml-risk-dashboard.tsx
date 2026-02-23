'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { AlertTriangle, Brain, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react'

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
  saved: boolean
  resultId: string | null
  warnings?: string[]
  modelSource?: 'cnn-lstm' | 'heuristic'
}

interface ModelInfo {
  type: string
  dataset: string
  features: number
  sequenceLength: number
  available: boolean
}

export function MLRiskDashboard() {
  const [result, setResult] = useState<MLResult | null>(null)
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<MLResult[]>([])

  // Fetch model info on mount
  useEffect(() => {
    fetchModelInfo()
    fetchHistory()
  }, [])

  const fetchModelInfo = async () => {
    try {
      const res = await fetch('/api/ml/classify-risk')
      const data = await res.json()
      setModelInfo(data.modelInfo)
    } catch (err) {
      console.error('Failed to fetch model info:', err)
    }
  }

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/ml/classify-risk')
      const data = await res.json()
      if (data.mlResults) {
        setHistory(data.mlResults.slice(0, 10))
      }
    } catch (err) {
      console.error('Failed to fetch history:', err)
    }
  }

  const analyzeRisk = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ml/classify-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo_user_' + Math.random().toString(36).substr(2, 9),
          resourceId: 'database_prod',
          action: 'READ',
          context: {
            ipAddress: '192.168.' + Math.floor(Math.random() * 256) + '.' + Math.floor(Math.random() * 256),
            deviceId: 'device-' + Math.random().toString(36).substr(2, 5),
            location: Math.random() > 0.7 ? 'Unknown' : 'Office',
            userAgent: 'Mozilla/5.0',
          },
        }),
      })

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`)
      }

      const data = await res.json()
      setResult(data)
      
      // Add to history
      setHistory(prev => [data, ...prev].slice(0, 10))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze risk')
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-500'
    if (score < 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getRiskBg = (score: number) => {
    if (score < 30) return 'bg-green-500/10'
    if (score < 60) return 'bg-yellow-500/10'
    return 'bg-red-500/10'
  }

  const getRiskLabel = (score: number) => {
    if (score < 30) return 'Low Risk'
    if (score < 60) return 'Medium Risk'
    return 'High Risk'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="w-8 h-8 text-blue-500" />
            ML Risk Analysis
          </h2>
          <p className="text-gray-400 mt-1">CNN-LSTM Deep Learning Model (UNSW-NB15)</p>
        </div>
        <Button onClick={analyzeRisk} disabled={loading} size="lg">
          {loading ? (
            <>
              <Spinner className="w-4 h-4 mr-2" />
              Analyzing...
            </>
          ) : (
            'Analyze Risk'
          )}
        </Button>
      </div>

      {/* Model Info */}
      {modelInfo && (
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-sm">Model Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-400">Type</p>
                <p className="font-semibold">{modelInfo.type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Dataset</p>
                <p className="font-semibold">{modelInfo.dataset}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Features</p>
                <p className="font-semibold">{modelInfo.features}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Sequence Length</p>
                <p className="font-semibold">{modelInfo.sequenceLength}</p>
              </div>
            </div>
            {modelInfo.available ? (
              <Badge className="mt-4 bg-green-500/20 text-green-400 border-green-500/50">
                ✓ Model Available
              </Badge>
            ) : (
              <Badge className="mt-4 bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                ⚠ Using Heuristic Fallback
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert className="bg-red-950 border-red-700">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-200">{error}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* ML Risk Score */}
          <Card className={`border-2 ${getRiskBg(result.mlRiskScore)}`}>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="w-4 h-4" />
                CNN-LSTM Risk Score
              </CardTitle>
              <CardDescription>Deep Learning Model</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-2">
                <span className={getRiskColor(result.mlRiskScore)}>
                  {result.mlRiskScore}
                </span>
                <span className="text-lg text-gray-400">/100</span>
              </div>
              <Badge className={`${getRiskBg(result.mlRiskScore)} text-white border-0`}>
                {getRiskLabel(result.mlRiskScore)}
              </Badge>
              {result.modelSource === 'cnn-lstm' && (
                <p className="text-xs text-green-400 mt-2">✓ UNSW-NB15 Trained</p>
              )}
            </CardContent>
          </Card>

          {/* Behavioral Anomalies */}
          <Card className={`border-2 ${getRiskBg(result.behavioralAnomalies)}`}>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Behavioral Anomalies
              </CardTitle>
              <CardDescription>Anomaly Detection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-2">
                <span className={getRiskColor(result.behavioralAnomalies)}>
                  {result.behavioralAnomalies}
                </span>
                <span className="text-lg text-gray-400">/100</span>
              </div>
              <Badge className={`${getRiskBg(result.behavioralAnomalies)} text-white border-0`}>
                {getRiskLabel(result.behavioralAnomalies)}
              </Badge>
            </CardContent>
          </Card>

          {/* Federated Risk Score */}
          <Card className={`border-2 ${getRiskBg(result.federatedRiskScore)}`}>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Federated Learning
              </CardTitle>
              <CardDescription>Aggregated Score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-2">
                <span className={getRiskColor(result.federatedRiskScore)}>
                  {result.federatedRiskScore}
                </span>
                <span className="text-lg text-gray-400">/100</span>
              </div>
              <Badge className={`${getRiskBg(result.federatedRiskScore)} text-white border-0`}>
                {getRiskLabel(result.federatedRiskScore)}
              </Badge>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analysis Details */}
      {result && (
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle>Analysis Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400">User ID</p>
                <p className="font-mono text-sm">{result.analysis.userId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Timestamp</p>
                <p className="text-sm">{new Date(result.analysis.timestamp).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Model Confidence</p>
                <p className="text-sm font-semibold">{(result.analysis.confidence * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Database Status</p>
                <p className="text-sm">
                  {result.saved ? (
                    <span className="text-green-400">✓ Saved</span>
                  ) : (
                    <span className="text-yellow-400">⚠ Not Persisted</span>
                  )}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-2">Models Used</p>
              <div className="flex flex-wrap gap-2">
                {result.analysis.models.map((model, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {model}
                  </Badge>
                ))}
              </div>
            </div>

            {result.warnings && result.warnings.length > 0 && (
              <Alert className="bg-yellow-950 border-yellow-700">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-yellow-200">
                  {result.warnings.join(' | ')}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* History */}
      {history.length > 0 && (
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle>Recent Analysis History</CardTitle>
            <CardDescription>Last 10 predictions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {history.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-800 rounded border border-slate-700">
                  <div className="flex-1">
                    <p className="text-sm font-mono">{item.analysis.userId}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(item.analysis.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-lg font-bold ${getRiskColor(item.mlRiskScore)}`}>
                        {item.mlRiskScore}
                      </p>
                      <p className="text-xs text-gray-400">ML Score</p>
                    </div>
                    <Badge className={`${getRiskBg(item.mlRiskScore)} text-white border-0`}>
                      {getRiskLabel(item.mlRiskScore)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {!result && (
        <Card className="bg-blue-950 border-blue-700">
          <CardHeader>
            <CardTitle className="text-blue-300">Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-200 space-y-2 text-sm">
            <p>1. Click "Analyze Risk" to run the CNN-LSTM model on a sample access request</p>
            <p>2. The model analyzes network features using UNSW-NB15 trained weights</p>
            <p>3. Results include ML risk score, behavioral anomalies, and federated learning insights</p>
            <p>4. To train with your own data: <code className="bg-blue-900 px-2 py-1 rounded">python scripts/train-cnn-lstm.py</code></p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
