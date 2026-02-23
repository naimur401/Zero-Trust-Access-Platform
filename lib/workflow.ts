// n8n-inspired Workflow Automation Engine
// Orchestrates Zero Trust, ML, Federated Learning, and Blockchain components

export interface WorkflowNode {
  id: string
  type: 'trigger' | 'action' | 'decision' | 'transform'
  name: string
  config: Record<string, any>
  inputs: string[] // node IDs
  outputs: string[] // node IDs
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  startTime: number
  endTime?: number
  status: 'running' | 'completed' | 'failed'
  nodeExecutions: {
    nodeId: string
    startTime: number
    endTime: number
    status: 'success' | 'failed'
    output: any
    error?: string
  }[]
  result: any
}

export type WorkflowTriggerType = 'access_request' | 'schedule' | 'webhook'

export interface Workflow {
  id: string
  name: string
  description: string
  trigger: WorkflowTriggerType
  enabled: boolean
  nodes: WorkflowNode[]
  executions: WorkflowExecution[]
}

// In-memory workflow store
const workflows: Map<string, Workflow> = new Map()
const executions: Map<string, WorkflowExecution> = new Map()

// Initialize default workflows
function initializeDefaultWorkflows() {
  const defaultWorkflow: Workflow = {
    id: 'zero-trust-flow',
    name: 'Zero Trust Access Control Flow',
    description: 'Complete flow for access control with ML, federated learning, and blockchain audit',
    trigger: 'access_request',
    enabled: true,
    nodes: [
      {
        id: 'trigger-access-request',
        type: 'trigger',
        name: 'Access Request Received',
        config: { triggerType: 'access_request' },
        inputs: [],
        outputs: ['validate-request'],
      },
      {
        id: 'validate-request',
        type: 'action',
        name: 'Validate Request Format',
        config: { validateSchema: true },
        inputs: ['trigger-access-request'],
        outputs: ['extract-context'],
      },
      {
        id: 'extract-context',
        type: 'transform',
        name: 'Extract Request Context',
        config: { extractFields: ['userId', 'resourceId', 'context'] },
        inputs: ['validate-request'],
        outputs: ['evaluate-zero-trust'],
      },
      {
        id: 'evaluate-zero-trust',
        type: 'action',
        name: 'Evaluate Zero Trust Policy',
        config: { engine: 'zeroTrust' },
        inputs: ['extract-context'],
        outputs: ['decision-point'],
      },
      {
        id: 'decision-point',
        type: 'decision',
        name: 'Check Risk Level',
        config: { decisions: [{ condition: 'riskScore < 30', next: 'allow-access' }] },
        inputs: ['evaluate-zero-trust'],
        outputs: ['allow-access', 'require-mfa', 'deny-access'],
      },
      {
        id: 'allow-access',
        type: 'action',
        name: 'Allow Access',
        config: { response: { status: 'ALLOW' } },
        inputs: ['decision-point'],
        outputs: ['audit-log'],
      },
      {
        id: 'require-mfa',
        type: 'action',
        name: 'Require MFA',
        config: { response: { status: 'REQUIRE_MFA' } },
        inputs: ['decision-point'],
        outputs: ['audit-log'],
      },
      {
        id: 'deny-access',
        type: 'action',
        name: 'Deny Access',
        config: { response: { status: 'DENY' } },
        inputs: ['decision-point'],
        outputs: ['audit-log'],
      },
      {
        id: 'audit-log',
        type: 'action',
        name: 'Record to Blockchain',
        config: { engine: 'blockchain' },
        inputs: ['allow-access', 'require-mfa', 'deny-access'],
        outputs: ['complete'],
      },
      {
        id: 'complete',
        type: 'action',
        name: 'Workflow Complete',
        config: { final: true },
        inputs: ['audit-log'],
        outputs: [],
      },
    ],
    executions: [],
  }

  workflows.set(defaultWorkflow.id, defaultWorkflow)
}

initializeDefaultWorkflows()

export function createWorkflow(workflow: Omit<Workflow, 'executions'>): Workflow {
  const newWorkflow: Workflow = {
    ...workflow,
    executions: [],
  }
  workflows.set(workflow.id, newWorkflow)
  return newWorkflow
}

export function getWorkflow(id: string): Workflow | undefined {
  return workflows.get(id)
}

export function getAllWorkflows(): Workflow[] {
  return Array.from(workflows.values())
}

export function updateWorkflow(id: string, updates: Partial<Workflow>): Workflow | undefined {
  const workflow = workflows.get(id)
  if (!workflow) return undefined

  const updated = { ...workflow, ...updates }
  workflows.set(id, updated)
  return updated
}

export async function executeWorkflow(workflowId: string, input: any): Promise<WorkflowExecution> {
  const workflow = workflows.get(workflowId)
  if (!workflow) throw new Error(`Workflow ${workflowId} not found`)

  const execution: WorkflowExecution = {
    id: `exec-${Date.now()}-${Math.random()}`,
    workflowId,
    startTime: Date.now(),
    status: 'running',
    nodeExecutions: [],
    result: null,
  }

  try {
    // Simulate workflow execution
    let currentData = input
    const executedNodes = new Set<string>()

    // Find the trigger node
    const triggerNode = workflow.nodes.find((n) => n.type === 'trigger')
    if (!triggerNode) throw new Error('No trigger node found')

    // Execute nodes in order
    const nodesToExecute = getNodeExecutionOrder(workflow.nodes, triggerNode.id)

    for (const nodeId of nodesToExecute) {
      const node = workflow.nodes.find((n) => n.id === nodeId)
      if (!node) continue

      const nodeStartTime = Date.now()
      try {
        currentData = simulateNodeExecution(node, currentData)
        execution.nodeExecutions.push({
          nodeId,
          startTime: nodeStartTime,
          endTime: Date.now(),
          status: 'success',
          output: currentData,
        })
        executedNodes.add(nodeId)
      } catch (error) {
        execution.nodeExecutions.push({
          nodeId,
          startTime: nodeStartTime,
          endTime: Date.now(),
          status: 'failed',
          output: null,
          error: String(error),
        })
        throw error
      }
    }

    execution.endTime = Date.now()
    execution.status = 'completed'
    execution.result = currentData
  } catch (error) {
    execution.endTime = Date.now()
    execution.status = 'failed'
    execution.result = { error: String(error) }
  }

  workflow.executions.push(execution)
  executions.set(execution.id, execution)

  return execution
}

function getNodeExecutionOrder(nodes: WorkflowNode[], startNodeId: string): string[] {
  const order: string[] = []
  const visited = new Set<string>()

  function traverse(nodeId: string) {
    if (visited.has(nodeId)) return
    visited.add(nodeId)

    order.push(nodeId)
    const node = nodes.find((n) => n.id === nodeId)
    if (node) {
      for (const outputId of node.outputs) {
        const nextNode = nodes.find((n) => n.inputs.includes(outputId))
        if (nextNode) traverse(nextNode.id)
      }
    }
  }

  traverse(startNodeId)
  return order
}

function simulateNodeExecution(node: WorkflowNode, input: any): any {
  switch (node.type) {
    case 'trigger':
      return input
    case 'action':
      return { ...input, actionApplied: node.name, timestamp: Date.now() }
    case 'decision':
      return { ...input, decision: node.config.decisions?.[0]?.next || 'default' }
    case 'transform':
      return { ...input, transformed: true, fields: node.config.extractFields }
    default:
      return input
  }
}

export function getExecution(id: string): WorkflowExecution | undefined {
  return executions.get(id)
}

export function getWorkflowExecutions(workflowId: string): WorkflowExecution[] {
  const workflow = workflows.get(workflowId)
  return workflow?.executions || []
}
