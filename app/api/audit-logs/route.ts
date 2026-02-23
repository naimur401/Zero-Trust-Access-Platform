import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { getAuditLogs, getDetailedAuditReport } from '@/lib/auditLog'

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req)
    if (authResult.error) return authResult.response

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const report = searchParams.get('report') === 'true'

    if (report) {
      // Get detailed report
      const startDate = searchParams.get('startDate')
        ? new Date(searchParams.get('startDate')!)
        : undefined
      const endDate = searchParams.get('endDate')
        ? new Date(searchParams.get('endDate')!)
        : undefined

      const result = await getDetailedAuditReport(authResult.userId, startDate, endDate)
      return NextResponse.json(result)
    }

    // Get paginated audit logs
    const result = await getAuditLogs(authResult.userId, limit, offset)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        pagination: result.pagination,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Audit logs error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs', details: error.message },
      { status: 500 }
    )
  }
}
