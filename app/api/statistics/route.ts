import { connectDB } from '@/lib/db'
import { getAccessRequestStats, getAuditLogStats, getHighRiskUsers, getMLInsights } from '@/lib/dbQueries'

export async function GET(request: Request) {
  try {
    await connectDB()

    const url = new URL(request.url)
    const stat = url.searchParams.get('stat')
    const userId = url.searchParams.get('userId')
    const timeRange = (url.searchParams.get('timeRange') as 'day' | 'week' | 'month') || 'week'

    if (stat === 'access-requests') {
      const stats = await getAccessRequestStats(userId || undefined)
      return Response.json({ success: true, data: stats })
    }

    if (stat === 'audit-logs') {
      const stats = await getAuditLogStats(timeRange)
      return Response.json({ success: true, data: stats })
    }

    if (stat === 'high-risk-users') {
      const threshold = parseInt(url.searchParams.get('threshold') || '70')
      const users = await getHighRiskUsers(threshold)
      return Response.json({ success: true, data: users })
    }

    if (stat === 'ml-insights') {
      const insights = await getMLInsights()
      return Response.json({ success: true, data: insights })
    }

    // Default: Return all stats
    const allStats = {
      accessRequests: await getAccessRequestStats(),
      auditLogs: await getAuditLogStats(timeRange),
      highRiskUsers: await getHighRiskUsers(),
      mlInsights: await getMLInsights(),
    }

    return Response.json({ success: true, data: allStats })
  } catch (error) {
    console.error('Statistics error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    // Fallback to mock data if MongoDB is not available
    if (errorMessage.includes('connect') || errorMessage.includes('ECONNREFUSED')) {
      return Response.json({
        success: true,
        data: {
          accessRequests: { total: 42, approved: 28, denied: 14, avgRisk: 32.5 },
          auditLogs: { total: 156, alerts: 12, avgSeverity: 2.1 },
          highRiskUsers: [{ userId: 'user123', riskScore: 78, incidents: 5 }],
          mlInsights: { highRiskPredictions: 8, accuracy: 94.2 }
        },
        source: 'mock-data-fallback',
        note: 'MongoDB not connected. Set up MongoDB Atlas or local MongoDB to persist data.'
      })
    }
    
    return Response.json(
      { 
        success: false,
        error: 'Failed to fetch statistics',
        message: errorMessage
      },
      { status: 500 }
    )
  }
}
