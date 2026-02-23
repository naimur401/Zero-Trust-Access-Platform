'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import AccessRequestForm from './access-request-form'
import RiskAnalysisDashboard from './risk-analysis'
import WorkflowVisualizer from './workflow-visualizer'
import BlockchainExplorer from './blockchain-explorer'
import MLModelDashboard from './ml-dashboard'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Zero Trust Access Control Platform</h1>
          <p className="text-slate-400">AI-Powered Risk Assessment with Blockchain Audit Logs</p>
        </div>

        {/* Alert Banner */}
        <Alert className="mb-6 bg-blue-950 border-blue-700">
          <AlertDescription className="text-blue-100">
            This platform demonstrates a comprehensive Zero Trust security model with ML risk classification,
            federated learning, blockchain audit trails, and workflow automation.
          </AlertDescription>
        </Alert>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-slate-800 border border-slate-700">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="access">Access Control</TabsTrigger>
            <TabsTrigger value="ml">ML & Risk</TabsTrigger>
            <TabsTrigger value="workflow">Workflows</TabsTrigger>
            <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-sm font-medium">System Components</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-400">6</div>
                  <p className="text-xs text-slate-400 mt-1">Core modules integrated</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-sm font-medium">Risk Models</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-400">3</div>
                  <p className="text-xs text-slate-400 mt-1">ML, Behavioral, Federated</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-sm font-medium">Workflow Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">Active</div>
                  <p className="text-xs text-slate-400 mt-1">Ready for requests</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-sm font-medium">Blockchain</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-400">Immutable</div>
                  <p className="text-xs text-slate-400 mt-1">Audit log secured</p>
                </CardContent>
              </Card>
            </div>

            {/* Architecture Overview */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Architecture Overview</CardTitle>
                <CardDescription className="text-slate-400">System components and their interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                    <span className="text-white">1. Access Request Handler</span>
                    <Badge variant="outline" className="text-blue-300 border-blue-500">
                      Entry Point
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                    <span className="text-white">2. Zero Trust Policy Engine</span>
                    <Badge variant="outline" className="text-green-300 border-green-500">
                      Core Logic
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                    <span className="text-white">3. ML Risk Classification</span>
                    <Badge variant="outline" className="text-amber-300 border-amber-500">
                      ML Models
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                    <span className="text-white">4. Federated Learning Aggregator</span>
                    <Badge variant="outline" className="text-purple-300 border-purple-500">
                      Distributed
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                    <span className="text-white">5. Workflow Orchestration (n8n)</span>
                    <Badge variant="outline" className="text-cyan-300 border-cyan-500">
                      Automation
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                    <span className="text-white">6. Blockchain Audit Trail</span>
                    <Badge variant="outline" className="text-pink-300 border-pink-500">
                      Immutable
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Access Control Tab */}
          <TabsContent value="access" className="space-y-6">
            <AccessRequestForm />
            <RiskAnalysisDashboard />
          </TabsContent>

          {/* ML & Risk Tab */}
          <TabsContent value="ml" className="space-y-6">
            <MLModelDashboard />
          </TabsContent>

          {/* Workflow Tab */}
          <TabsContent value="workflow" className="space-y-6">
            <WorkflowVisualizer />
          </TabsContent>

          {/* Blockchain Tab */}
          <TabsContent value="blockchain" className="space-y-6">
            <BlockchainExplorer />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
