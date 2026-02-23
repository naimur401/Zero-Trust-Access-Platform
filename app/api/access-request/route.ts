import { evaluateAccessRequest, type AccessRequest } from '@/lib/zeroTrust'
import { addAuditEntry, getAuditLog, getBlockchainStatus } from '@/lib/blockchain'
import { executeWorkflow } from '@/lib/workflow'
import { connectDB } from '@/lib/db'
import { AccessRequest as AccessRequestModel, AuditLog as AuditLogModel } from '@/lib/models'

export async function POST(request: Request) {
  try {
    await connectDB()

    const body = await request.json()

    const accessRequest: AccessRequest = {
      userId: body.userId,
      resourceId: body.resourceId,
      action: body.action,
      timestamp: Date.now(),
      context: {
        ipAddress: body.context?.ipAddress || '0.0.0.0',
        deviceId: body.context?.deviceId || `device-${Math.random()}`,
        location: body.context?.location || 'Unknown',
        userAgent: body.context?.userAgent || 'unknown',
      },
    }

    // Execute the workflow
    const workflowExecution = await executeWorkflow('zero-trust-flow', accessRequest)

    // Evaluate using Zero Trust
    const riskProfile = evaluateAccessRequest(accessRequest)

    // Save to MongoDB
    const savedAccessRequest = await AccessRequestModel.create({
      ...accessRequest,
      riskScore: riskProfile.baseRiskScore,
      decision: riskProfile.finalDecision,
      status: riskProfile.finalDecision === 'ALLOW' ? 'APPROVED' : 'DENIED',
    })

    // Add to blockchain audit log
    const auditEntry = addAuditEntry({
      timestamp: Date.now(),
      userId: accessRequest.userId,
      action: accessRequest.action,
      resourceId: accessRequest.resourceId,
      decision: riskProfile.finalDecision,
      riskScore: riskProfile.baseRiskScore,
    })

    // Save audit log to MongoDB
    await AuditLogModel.create({
      timestamp: Date.now(),
      userId: accessRequest.userId,
      action: accessRequest.action,
      resourceId: accessRequest.resourceId,
      decision: riskProfile.finalDecision,
      riskScore: riskProfile.baseRiskScore,
      blockHash: auditEntry.hash,
    })

    return Response.json({
      success: true,
      accessRequest: savedAccessRequest,
      riskProfile,
      auditEntry,
      workflowExecution,
    })
  } catch (error) {
    console.error('Access request error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    // Fallback to mock data if MongoDB is not available
    if (errorMessage.includes('connect') || errorMessage.includes('ECONNREFUSED')) {
      return Response.json({
        success: true,
        accessRequest: {
          _id: 'mock_' + Date.now(),
          userId: body?.userId || 'demo_user',
          resourceId: body?.resourceId || 'demo_resource',
          action: body?.action || 'READ',
          status: 'APPROVED',
          riskScore: 25,
          decision: 'ALLOW',
          timestamp: Date.now()
        },
        riskProfile: {
          finalDecision: 'ALLOW',
          baseRiskScore: 25,
          factors: ['low risk IP', 'trusted device']
        },
        auditEntry: {
          hash: '0xmockhash' + Date.now(),
          blockHeight: 42,
          timestamp: Date.now()
        },
        workflowExecution: { status: 'completed', steps: 5 },
        source: 'mock-data-fallback',
        note: 'MongoDB not connected. Set up MongoDB Atlas or local MongoDB to persist data.'
      })
    }
    
    return Response.json(
      { 
        success: false,
        error: 'Failed to process access request',
        message: errorMessage
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    await connectDB()

    const auditLogs = await AuditLogModel.find().sort({ timestamp: -1 }).limit(100)
    const blockchainStatus = getBlockchainStatus()
    const accessRequests = await AccessRequestModel.find().sort({ timestamp: -1 }).limit(50)

    return Response.json({
      auditLogs,
      accessRequests,
      blockchainStatus,
      totalRequests: await AccessRequestModel.countDocuments(),
      totalAuditLogs: await AuditLogModel.countDocuments(),
    })
  } catch (error) {
    console.error('Error fetching access requests:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    // Fallback to mock data if MongoDB is not available
    if (errorMessage.includes('connect') || errorMessage.includes('ECONNREFUSED')) {
      return Response.json({
        auditLogs: [
          {
            _id: 'mock_log_1',
            timestamp: Date.now() - 3600000,
            userId: 'user1',
            action: 'READ',
            resourceId: 'db_prod',
            decision: 'ALLOW',
            riskScore: 15
          },
          {
            _id: 'mock_log_2',
            timestamp: Date.now() - 7200000,
            userId: 'user2',
            action: 'WRITE',
            resourceId: 'api_keys',
            decision: 'DENY',
            riskScore: 85
          }
        ],
        accessRequests: [
          {
            _id: 'mock_req_1',
            userId: 'user1',
            resourceId: 'db_prod',
            action: 'READ',
            status: 'APPROVED',
            riskScore: 15,
            timestamp: Date.now() - 3600000
          }
        ],
        blockchainStatus: {
          blocks: 42,
          latestHash: '0xlatestmockhash',
          isMining: false
        },
        totalRequests: 42,
        totalAuditLogs: 156,
        source: 'mock-data-fallback',
        note: 'MongoDB not connected. Set up MongoDB Atlas or local MongoDB to persist data.'
      })
    }
    
    return Response.json(
      { 
        success: false,
        error: 'Failed to fetch access requests',
        message: errorMessage
      },
      { status: 500 }
    )
  }
}
