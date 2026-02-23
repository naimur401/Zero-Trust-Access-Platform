import { connectDB } from '@/lib/db'
import { AccessRequest, AuditLog } from '@/lib/models'

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    await connectDB()

    const { userId } = await context.params
    const limit = 50

    // Get user's access requests
    const accessRequests = await AccessRequest.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)

    // Get user's audit log
    const auditLogs = await AuditLog.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)

    // Calculate statistics
    const totalRequests = await AccessRequest.countDocuments({ userId })
    const approvedRequests = await AccessRequest.countDocuments({
      userId,
      status: 'APPROVED',
    })
    const deniedRequests = await AccessRequest.countDocuments({
      userId,
      status: 'DENIED',
    })

    const avgRiskScore =
      accessRequests.length > 0
        ? Math.round(
            (accessRequests.reduce((sum, r) => sum + (r.riskScore || 0), 0) /
              accessRequests.length) *
              100
          ) / 100
        : 0

    return Response.json({
      success: true,
      userId,
      stats: {
        totalRequests,
        approvedRequests,
        deniedRequests,
        pendingRequests: totalRequests - approvedRequests - deniedRequests,
        approvalRate:
          totalRequests > 0
            ? Math.round((approvedRequests / totalRequests) * 100)
            : 0,
        avgRiskScore,
      },
      recentRequests: accessRequests,
      auditHistory: auditLogs,
    })
  } catch (error) {
    console.error('User profile error:', error)
    return Response.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    )
  }
}
