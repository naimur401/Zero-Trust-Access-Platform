import { connectDB } from '@/lib/db'
import { User, AccessRequest, AuditLog, MLResult, Workflow } from '@/lib/models'
import bcrypt from 'bcryptjs'

export async function GET(request: Request) {
  try {
    await connectDB()

    // Clear existing data (optional - comment out to keep old data)
    // await User.deleteMany({})
    // await AccessRequest.deleteMany({})
    // await AuditLog.deleteMany({})
    // await MLResult.deleteMany({})
    // await Workflow.deleteMany({})

    // Create demo users
    const demoUsers = [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123456',
        fullName: 'Admin User',
        role: 'ADMIN',
      },
      {
        username: 'demo_user',
        email: 'demo@example.com',
        password: 'demo123456',
        fullName: 'Demo User',
        role: 'USER',
      },
      {
        username: 'john_doe',
        email: 'john@example.com',
        password: 'john123456',
        fullName: 'John Doe',
        role: 'USER',
      },
    ]

    // Hash passwords and create users
    for (const userData of demoUsers) {
      const existingUser = await User.findOne({ email: userData.email })
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userData.password, 10)
        await User.create({
          ...userData,
          password: hashedPassword,
          isActive: true,
        })
      }
    }

    const testUsers = ['john_doe', 'jane_smith', 'mike_wilson', 'sarah_johnson', 'alex_davis']
    const testResources = ['database_prod', 'api_gateway', 'file_server', 'admin_panel', 'cache_redis']
    const testActions = ['READ', 'WRITE', 'DELETE', 'ADMIN']
    const testLocations = ['New York', 'London', 'Tokyo', 'Singapore', 'São Paulo']

    // Create test access requests
    const accessRequests = []
    for (let i = 0; i < 50; i++) {
      const userId = testUsers[Math.floor(Math.random() * testUsers.length)]
      const resourceId = testResources[Math.floor(Math.random() * testResources.length)]
      const action = testActions[Math.floor(Math.random() * testActions.length)]
      const riskScore = Math.floor(Math.random() * 100)
      const status = riskScore > 70 ? 'DENIED' : riskScore > 40 ? 'PENDING' : 'APPROVED'

      accessRequests.push({
        userId,
        resourceId,
        action,
        timestamp: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000, // Last 7 days
        status,
        context: {
          ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          deviceId: `device-${Math.floor(Math.random() * 1000)}`,
          location: testLocations[Math.floor(Math.random() * testLocations.length)],
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        riskScore,
        decision: status === 'APPROVED' ? 'ALLOW' : status === 'DENIED' ? 'DENY' : 'REQUIRE_MFA',
      })
    }

    const createdRequests = await AccessRequest.insertMany(accessRequests)

    // Create audit logs
    const auditLogs = createdRequests.map((req) => ({
      timestamp: req.timestamp,
      userId: req.userId,
      action: req.action,
      resourceId: req.resourceId,
      decision: req.decision,
      riskScore: req.riskScore,
      blockHash: `hash_${Math.random().toString(36).substring(7)}`,
    }))

    await AuditLog.insertMany(auditLogs)

    // Create ML results
    const mlResults = []
    for (let i = 0; i < 30; i++) {
      const userId = testUsers[Math.floor(Math.random() * testUsers.length)]
      mlResults.push({
        userId,
        resourceId: testResources[Math.floor(Math.random() * testResources.length)],
        mlRiskScore: Math.floor(Math.random() * 100),
        behavioralScore: Math.floor(Math.random() * 100),
        federatedScore: Math.floor(Math.random() * 100),
        timestamp: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
        features: {
          action: testActions[Math.floor(Math.random() * testActions.length)],
          ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          location: testLocations[Math.floor(Math.random() * testLocations.length)],
        },
      })
    }

    await MLResult.insertMany(mlResults)

    // Create workflows
    const workflows = []
    for (let i = 0; i < 10; i++) {
      workflows.push({
        workflowId: `workflow-${i}`,
        status: ['COMPLETED', 'IN_PROGRESS', 'PENDING', 'FAILED'][Math.floor(Math.random() * 4)],
        steps: [
          {
            stepId: 'validate',
            name: 'Validate Request',
            status: 'COMPLETED',
            timestamp: Date.now() - 60000,
          },
          {
            stepId: 'check-risk',
            name: 'Check Risk Score',
            status: 'COMPLETED',
            timestamp: Date.now() - 30000,
          },
          {
            stepId: 'approve',
            name: 'Approve Request',
            status: 'COMPLETED',
            timestamp: Date.now(),
          },
        ],
        result: {
          decision: 'APPROVED',
          score: Math.floor(Math.random() * 100),
        },
        timestamp: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
      })
    }

    await Workflow.insertMany(workflows)

    return Response.json({
      success: true,
      message: 'Test data created successfully!',
      data: {
        users: demoUsers.map(u => ({ email: u.email, password: u.password, role: u.role })),
        accessRequests: createdRequests.length,
        auditLogs: auditLogs.length,
        mlResults: mlResults.length,
        workflows: workflows.length,
      },
      testUsers,
      testResources,
    })
  } catch (error) {
    console.error('Seeding error:', error)
    return Response.json(
      { error: 'Failed to seed data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
