'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Workflow {
  id: string
  name: string
  description: string
  enabled: boolean
  nodes: any[]
  executions: any[]
}

export default function WorkflowVisualizer() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows')
      const data = await response.json()
      setWorkflows(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching workflows:', error)
    } finally {
      setLoading(false)
    }
  }

  const executeWorkflow = async () => {
    setExecuting(true)
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          workflowId: 'zero-trust-flow',
          input: {
            userId: 'user-demo',
            resourceId: 'resource-test',
            action: 'READ',
            timestamp: Date.now(),
            context: {
              ipAddress: '192.168.1.1',
              deviceId: 'device-test',
              location: 'Office',
              userAgent: 'Mozilla/5.0',
            },
          },
        }),
      })

      const data = await response.json()
      if (data) {
        fetchWorkflows()
      }
    } catch (error) {
      console.error('Error executing workflow:', error)
    } finally {
      setExecuting(false)
    }
  }

  useEffect(() => {
    fetchWorkflows()
  }, [])

  return (
    <div className="space-y-6">
      {/* Workflow Engine Status */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">n8n Workflow Automation Engine</CardTitle>
          <CardDescription className="text-slate-400">
            Orchestrates access control, ML evaluation, federated learning, and blockchain audit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
              <span className="text-white">Workflow Engine Status</span>
              <Badge className="bg-green-600 text-white">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
              <span className="text-white">Connected Workflows</span>
              <Badge variant="outline" className="text-blue-300 border-blue-500">
                {workflows.length}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
              <span className="text-white">Total Executions</span>
              <Badge variant="outline" className="text-purple-300 border-purple-500">
                {workflows.reduce((sum, w) => sum + (w.executions?.length || 0), 0)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow List */}
      {loading ? (
        <Alert className="bg-slate-700 border-slate-600">
          <AlertDescription className="text-slate-300">Loading workflows...</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-white">{workflow.name}</CardTitle>
                    <CardDescription className="text-slate-400">{workflow.description}</CardDescription>
                  </div>
                  <Badge className={workflow.enabled ? 'bg-green-600' : 'bg-gray-600'}>
                    {workflow.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Workflow Nodes */}
                <div>
                  <p className="text-slate-300 font-semibold text-sm mb-3">Workflow Steps ({workflow.nodes?.length || 0})</p>
                  <div className="space-y-2">
                    {workflow.nodes?.map((node, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">{node.name}</p>
                          <p className="text-slate-400 text-xs">Type: {node.type}</p>
                        </div>
                        <Badge variant="outline" className="text-slate-300 border-slate-600">
                          {node.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Workflow Execution Info */}
                <div>
                  <p className="text-slate-300 font-semibold text-sm mb-3">
                    Execution History ({workflow.executions?.length || 0})
                  </p>
                  {workflow.executions && workflow.executions.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {workflow.executions.slice(0, 5).map((exec, idx) => (
                        <div key={idx} className="p-3 bg-slate-700 rounded-lg text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-300">Execution {idx + 1}</span>
                            <Badge
                              variant="outline"
                              className={
                                exec.status === 'completed'
                                  ? 'text-green-300 border-green-600'
                                  : 'text-yellow-300 border-yellow-600'
                              }
                            >
                              {exec.status}
                            </Badge>
                          </div>
                          <p className="text-slate-400 text-xs mt-1">
                            Nodes executed: {exec.nodeExecutions?.length || 0}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm p-3 bg-slate-700 rounded-lg">No executions yet</p>
                  )}
                </div>

                <Button
                  onClick={executeWorkflow}
                  disabled={executing}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {executing ? 'Executing...' : 'Test Workflow Execution'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Workflow Architecture */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Workflow Architecture</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center text-white text-xs">
                📥
              </div>
              <div>
                <p className="text-white font-medium">Trigger: Access Request Received</p>
                <p className="text-slate-400 text-xs">HTTP POST /api/access-request</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">
                ✓
              </div>
              <div>
                <p className="text-white font-medium">Validate & Extract Context</p>
                <p className="text-slate-400 text-xs">Request format validation and field extraction</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white text-xs">
                ⚙
              </div>
              <div>
                <p className="text-white font-medium">Evaluate Zero Trust Policy</p>
                <p className="text-slate-400 text-xs">ML risk, behavioral, federated learning assessment</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 rounded-full bg-yellow-600 flex items-center justify-center text-white text-xs">
                🔀
              </div>
              <div>
                <p className="text-white font-medium">Decision Logic</p>
                <p className="text-slate-400 text-xs">Route based on risk score (Allow/MFA/Deny)</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs">
                🔐
              </div>
              <div>
                <p className="text-white font-medium">Blockchain Audit Log</p>
                <p className="text-slate-400 text-xs">Record immutably in blockchain</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 rounded-full bg-pink-600 flex items-center justify-center text-white text-xs">
                ✔
              </div>
              <div>
                <p className="text-white font-medium">Return Decision</p>
                <p className="text-slate-400 text-xs">Response with access decision and audit trail</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
