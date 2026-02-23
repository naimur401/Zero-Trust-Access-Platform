import { NextRequest } from 'next/server'
import { AuditLog } from '@/lib/models'
import { connectDB } from '@/lib/db'

export interface AuditLogData {
  userId: string
  userEmail?: string
  action: string
  resourceId?: string
  decision?: 'ALLOW' | 'DENY' | 'REQUIRE_MFA'
  riskScore?: number
  status: 'SUCCESS' | 'FAILURE'
  errorMessage?: string
  actionDetails?: Record<string, any>
  previousValue?: Record<string, any>
  newValue?: Record<string, any>
}

export async function logAuditEvent(
  req: NextRequest,
  data: AuditLogData
): Promise<void> {
  try {
    await connectDB()

    const ipAddress = getClientIP(req)
    const userAgent = req.headers.get('user-agent') || 'Unknown'

    const auditLog = new AuditLog({
      timestamp: Date.now(),
      userId: data.userId,
      userEmail: data.userEmail,
      action: data.action,
      resourceId: data.resourceId,
      decision: data.decision,
      riskScore: data.riskScore,
      ipAddress,
      userAgent,
      status: data.status,
      errorMessage: data.errorMessage,
      actionDetails: data.actionDetails,
      previousValue: data.previousValue,
      newValue: data.newValue,
    })

    await auditLog.save()
  } catch (error) {
    console.error('Failed to log audit event:', error)
  }
}

export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const clientIP = req.headers.get('x-real-ip')
  return clientIP || 'Unknown'
}

export async function getAuditLogs(
  userId: string,
  limit: number = 100,
  offset: number = 0
) {
  try {
    await connectDB()

    const logs = await AuditLog.find({ userId })
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .lean()

    const total = await AuditLog.countDocuments({ userId })

    return {
      success: true,
      data: logs,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit),
      },
    }
  } catch (error) {
    console.error('Failed to fetch audit logs:', error)
    return {
      success: false,
      error: 'Failed to fetch audit logs',
    }
  }
}

export async function getDetailedAuditReport(
  userId: string,
  startDate?: Date,
  endDate?: Date
) {
  try {
    await connectDB()

    const query: Record<string, any> = { userId }

    if (startDate || endDate) {
      query.timestamp = {}
      if (startDate) query.timestamp.$gte = startDate.getTime()
      if (endDate) query.timestamp.$lte = endDate.getTime()
    }

    const logs = await AuditLog.find(query).lean()

    // Aggregate stats
    const stats = {
      totalActions: logs.length,
      successfulActions: logs.filter((l) => l.status === 'SUCCESS').length,
      failedActions: logs.filter((l) => l.status === 'FAILURE').length,
      allowedDecisions: logs.filter((l) => l.decision === 'ALLOW').length,
      deniedDecisions: logs.filter((l) => l.decision === 'DENY').length,
      mfaRequired: logs.filter((l) => l.decision === 'REQUIRE_MFA').length,
      uniqueIPs: new Set(logs.map((l) => l.ipAddress)).size,
      actionBreakdown: {} as Record<string, number>,
    }

    // Action breakdown
    logs.forEach((log) => {
      stats.actionBreakdown[log.action] = (stats.actionBreakdown[log.action] || 0) + 1
    })

    return {
      success: true,
      data: {
        stats,
        logs: logs.slice(0, 50), // Last 50 logs
      },
    }
  } catch (error) {
    console.error('Failed to generate audit report:', error)
    return {
      success: false,
      error: 'Failed to generate audit report',
    }
  }
}
