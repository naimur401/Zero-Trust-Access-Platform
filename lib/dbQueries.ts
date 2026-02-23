// Database utilities and reusable queries
import { AccessRequest, AuditLog, MLResult, Workflow } from './models'
import { connectDB } from './db'

export async function getAccessRequestStats(userId?: string) {
  await connectDB()
  
  const query = userId ? { userId } : {}
  const total = await AccessRequest.countDocuments(query)
  const approved = await AccessRequest.countDocuments({ ...query, status: 'APPROVED' })
  const denied = await AccessRequest.countDocuments({ ...query, status: 'DENIED' })

  return {
    total,
    approved,
    denied,
    approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
  }
}

export async function getAuditLogStats(timeRange: 'day' | 'week' | 'month' = 'week') {
  await connectDB()

  const now = Date.now()
  const timeMs = {
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
  }

  const startTime = now - timeMs[timeRange]
  const logs = await AuditLog.find({
    timestamp: { $gte: startTime },
  }).sort({ timestamp: -1 })

  const byDecision = {
    ALLOW: logs.filter((l) => l.decision === 'ALLOW').length,
    DENY: logs.filter((l) => l.decision === 'DENY').length,
    REQUIRE_MFA: logs.filter((l) => l.decision === 'REQUIRE_MFA').length,
  }

  const avgRiskScore =
    logs.length > 0
      ? logs.reduce((sum, l) => sum + (l.riskScore || 0), 0) / logs.length
      : 0

  return {
    totalEvents: logs.length,
    timeRange,
    byDecision,
    avgRiskScore: Math.round(avgRiskScore * 100) / 100,
  }
}

export async function getHighRiskUsers(threshold = 70) {
  await connectDB()

  const highRiskRequests = await AccessRequest.find({
    riskScore: { $gte: threshold },
  })
    .sort({ riskScore: -1 })
    .limit(10)

  const userRisks = new Map<string, number[]>()

  highRiskRequests.forEach((req) => {
    const scores = userRisks.get(req.userId) || []
    scores.push(req.riskScore || 0)
    userRisks.set(req.userId, scores)
  })

  return Array.from(userRisks.entries()).map(([userId, scores]) => ({
    userId,
    count: scores.length,
    avgRisk: Math.round((scores.reduce((a, b) => a + b) / scores.length) * 100) / 100,
    maxRisk: Math.max(...scores),
  }))
}

export async function getMLInsights() {
  await connectDB()

  const mlResults = await MLResult.find().sort({ timestamp: -1 }).limit(100)

  const avgScores = {
    mlRisk: mlResults.length
      ? mlResults.reduce((sum, r) => sum + r.mlRiskScore, 0) / mlResults.length
      : 0,
    behavioral: mlResults.length
      ? mlResults.reduce((sum, r) => sum + (r.behavioralScore || 0), 0) / mlResults.length
      : 0,
    federated: mlResults.length
      ? mlResults.reduce((sum, r) => sum + (r.federatedScore || 0), 0) / mlResults.length
      : 0,
  }
  
  return {
    totalAnalyzed: mlResults.length,
    averageScores: {
      mlRisk: Math.round(avgScores.mlRisk * 100) / 100,
      behavioral: Math.round(avgScores.behavioral * 100) / 100,
      federated: Math.round(avgScores.federated * 100) / 100,
    },
  }
}
