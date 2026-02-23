import { connectDB } from '@/lib/db'
import { AccessRequest, AuditLog } from '@/lib/models'

export async function GET(request: Request) {
  try {
    await connectDB()

    const url = new URL(request.url)
    const resourceId = url.searchParams.get('resourceId')

    if (!resourceId) {
      // Get all resources
      const requests = await AccessRequest.find().select('resourceId').distinct('resourceId')
      
      const resourceStats = await Promise.all(
        requests.map(async (resId) => {
          const total = await AccessRequest.countDocuments({ resourceId: resId })
          const approved = await AccessRequest.countDocuments({
            resourceId: resId,
            status: 'APPROVED',
          })
          const denied = await AccessRequest.countDocuments({
            resourceId: resId,
            status: 'DENIED',
          })
          const avgRisk = await AccessRequest.aggregate([
            { $match: { resourceId: resId } },
            { $group: { _id: null, avgRisk: { $avg: '$riskScore' } } },
          ])

          return {
            resourceId: resId,
            totalRequests: total,
            approved,
            denied,
            avgRiskScore:
              avgRisk.length > 0 ? Math.round(avgRisk[0].avgRisk * 100) / 100 : 0,
          }
        })
      )

      return Response.json({
        success: true,
        resources: resourceStats,
      })
    }

    // Get specific resource stats
    const requests = await AccessRequest.find({ resourceId })
      .sort({ timestamp: -1 })
      .limit(100)

    const total = await AccessRequest.countDocuments({ resourceId })
    const approved = await AccessRequest.countDocuments({
      resourceId,
      status: 'APPROVED',
    })
    const denied = await AccessRequest.countDocuments({
      resourceId,
      status: 'DENIED',
    })

    const accessByUser = requests.reduce(
      (acc, req) => {
        const existing = acc.find((a) => a.userId === req.userId)
        if (existing) {
          existing.count++
        } else {
          acc.push({ userId: req.userId, count: 1 })
        }
        return acc
      },
      [] as Array<{ userId: string; count: number }>
    )

    return Response.json({
      success: true,
      resourceId,
      stats: {
        totalRequests: total,
        approved,
        denied,
        pending: total - approved - denied,
        approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
      },
      recentRequests: requests,
      accessByUser: accessByUser.sort((a, b) => b.count - a.count),
    })
  } catch (error) {
    console.error('Resource monitoring error:', error)
    return Response.json(
      { error: 'Failed to fetch resource monitoring data' },
      { status: 500 }
    )
  }
}
