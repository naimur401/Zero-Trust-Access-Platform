import { getAllWorkflows, getWorkflow, createWorkflow, executeWorkflow } from '@/lib/workflow'
import { connectDB } from '@/lib/db'
import { Workflow as WorkflowModel } from '@/lib/models'

export async function GET(request: Request) {
  try {
    await connectDB()

    const url = new URL(request.url)
    const workflowId = url.searchParams.get('id')

    if (workflowId) {
      try {
        const workflow = await WorkflowModel.findById(workflowId)
        if (!workflow) {
          // Fallback to in-memory workflow
          const memWorkflow = getWorkflow(workflowId)
          if (!memWorkflow) {
            return Response.json({ error: 'Workflow not found' }, { status: 404 })
          }
          return Response.json(memWorkflow)
        }
        return Response.json(workflow)
      } catch {
        const memWorkflow = getWorkflow(workflowId)
        if (!memWorkflow) {
          return Response.json({ error: 'Workflow not found' }, { status: 404 })
        }
        return Response.json(memWorkflow)
      }
    }

    const dbWorkflows = await WorkflowModel.find().sort({ timestamp: -1 })
    const memWorkflows = getAllWorkflows()

    return Response.json({
      workflows: [...dbWorkflows, ...memWorkflows],
      count: dbWorkflows.length + memWorkflows.length,
    })
  } catch (error) {
    console.error('Workflows GET error:', error)
    // Fallback to in-memory workflows
    const workflows = getAllWorkflows()
    return Response.json(workflows)
  }
}

export async function POST(request: Request) {
  try {
    await connectDB()

    const body = await request.json()
    const { action, workflowId, input, ...workflowData } = body

    if (action === 'execute' && workflowId) {
      const execution = await executeWorkflow(workflowId, input)

      // Save execution to MongoDB
      await WorkflowModel.create({
        workflowId,
        status: 'COMPLETED',
        steps: execution.steps,
        result: execution,
        timestamp: Date.now(),
      })

      return Response.json(execution)
    }

    const workflow = createWorkflow(workflowData)

    // Save new workflow to MongoDB
    await WorkflowModel.create({
      workflowId: workflow.id,
      status: 'PENDING',
      steps: [],
      result: workflow,
      timestamp: Date.now(),
    })

    return Response.json(workflow, { status: 201 })
  } catch (error) {
    console.error('Workflows POST error:', error)
    return Response.json(
      { error: 'Failed to process workflow' },
      { status: 500 }
    )
  }
}
