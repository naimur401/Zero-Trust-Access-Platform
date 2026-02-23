'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, Copy } from 'lucide-react'

interface BlockchainStatus {
  isValid: boolean
  blockCount: number
  currentBlockSize: number
  lastBlockHash: string
  totalEntries: number
}

interface AuditEntry {
  id: string
  timestamp: number
  userId: string
  action: string
  resourceId: string
  decision: 'ALLOW' | 'DENY' | 'REQUIRE_MFA'
  riskScore: number
  hash: string
}

export default function BlockchainExplorer() {
  const [status, setStatus] = useState<BlockchainStatus | null>(null)
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [mining, setMining] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'ALLOW':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
      case 'DENY':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
      case 'REQUIRE_MFA':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'
      default:
        return 'bg-secondary text-foreground'
    }
  }

  const fetchBlockchainData = async () => {
    try {
      setError(null)
      const token = localStorage.getItem('authToken')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch('/api/blockchain', { headers })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      setStatus(data.status || null)
      setAuditLog(Array.isArray(data.auditLog) ? data.auditLog : [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch blockchain data'
      console.error('Error fetching blockchain data:', err)
      setError(message)
      setStatus(null)
      setAuditLog([])
    } finally {
      setLoading(false)
    }
  }

  const mineBlock = async () => {
    setMining(true)
    try {
      setError(null)
      const token = localStorage.getItem('authToken')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch('/api/blockchain', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'mine' }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setStatus(data.status || null)
      }
      fetchBlockchainData()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mine block'
      console.error('Error mining block:', err)
      setError(message)
    } finally {
      setMining(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 2000)
  }

  useEffect(() => {
    fetchBlockchainData()
    const interval = setInterval(fetchBlockchainData, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertDescription>Loading blockchain data...</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert className="border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-800 dark:text-red-100">
            Error: {error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!status) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertDescription>No blockchain data available</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Blockchain Status */}
      <Alert className={`${status?.isValid ? 'bg-green-100 dark:bg-green-950 border-green-300 dark:border-green-700' : 'bg-red-100 dark:bg-red-950 border-red-300 dark:border-red-700'}`}>
        <CheckCircle className={`h-4 w-4 ${status?.isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
        <AlertDescription className={status?.isValid ? 'text-green-800 dark:text-green-100' : 'text-red-800 dark:text-red-100'}>
          {status?.isValid ? 'Blockchain is valid and secure' : 'Warning: Blockchain integrity compromised'}
        </AlertDescription>
      </Alert>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Blocks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{status?.blockCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Including genesis block</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{status?.totalEntries || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Audit log records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Current Block</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{status?.currentBlockSize || 0}/5</div>
            <p className="text-xs text-muted-foreground mt-1">Entries pending mining</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={status?.isValid ? 'bg-green-600 dark:bg-green-600' : 'bg-red-600 dark:bg-red-600'}>
              {status?.isValid ? 'Valid' : 'Invalid'}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">Chain integrity</p>
          </CardContent>
        </Card>
      </div>

      {/* Mining Control */}
      {status && status.currentBlockSize > 0 && (
        <Card className="border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950">
          <CardHeader>
            <CardTitle className="text-amber-900 dark:text-amber-100">Pending Block</CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-200/70">
              {status.currentBlockSize} entries waiting to be mined
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={mineBlock}
              disabled={mining}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              {mining ? 'Mining Block...' : 'Mine Current Block'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Last Block Hash */}
      {status?.lastBlockHash && (
        <Card>
          <CardHeader>
            <CardTitle>Last Block Hash</CardTitle>
            <CardDescription>
              SHA-256 hash of the most recent block
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
              <code className="flex-1 text-xs text-muted-foreground break-all font-mono">
                {status.lastBlockHash}
              </code>
              <button
                onClick={() => copyToClipboard(status.lastBlockHash)}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <Copy className={`w-4 h-4 ${copied === status.lastBlockHash ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle>Immutable Audit Log</CardTitle>
          <CardDescription>
            All access decisions recorded in the blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditLog.length === 0 ? (
            <Alert>
              <AlertDescription>
                No audit entries yet. Submit access requests to populate the blockchain.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {auditLog.map((entry) => (
                <div key={entry.id} className="p-3 bg-secondary rounded-lg hover:bg-muted transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">{entry.userId}</p>
                      <p className="text-muted-foreground text-xs">
                        {new Date(entry.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Badge className={`text-xs ${getDecisionColor(entry.decision)}`}>
                      {entry.decision}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Action</p>
                      <p className="text-foreground">{entry.action}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Resource</p>
                      <p className="text-foreground">{entry.resourceId}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Risk Score</p>
                      <p className="text-foreground">{entry.riskScore}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Entry ID</p>
                      <p className="text-foreground truncate">{entry.id.slice(0, 12)}...</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <code className="flex-1 text-xs text-muted-foreground break-all font-mono">
                      Hash: {entry.hash.slice(0, 32)}...
                    </code>
                    <button
                      onClick={() => copyToClipboard(entry.hash)}
                      className="p-1 hover:bg-muted rounded transition-colors"
                    >
                      <Copy className={`w-3 h-3 ${copied === entry.hash ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Blockchain Concept */}
      <Card>
        <CardHeader>
          <CardTitle>Blockchain Implementation Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-secondary rounded-lg">
            <p className="font-semibold mb-1">Hash Algorithm</p>
            <p className="text-muted-foreground text-xs">SHA-256 cryptographic hashing for immutable record keeping</p>
          </div>

          <div className="p-3 bg-secondary rounded-lg">
            <p className="font-semibold mb-1">Proof of Work</p>
            <p className="text-muted-foreground text-xs">Difficulty: 2 leading zeros. Each block requires computational work.</p>
          </div>

          <div className="p-3 bg-secondary rounded-lg">
            <p className="font-semibold mb-1">Block Structure</p>
            <p className="text-muted-foreground text-xs">
              Index | Timestamp | Audit Entries | Previous Hash | Current Hash | Nonce
            </p>
          </div>

          <div className="p-3 bg-secondary rounded-lg">
            <p className="font-semibold mb-1">Validation</p>
            <p className="text-muted-foreground text-xs">
              Each block validates the hash of the previous block, ensuring tampering detection
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
 