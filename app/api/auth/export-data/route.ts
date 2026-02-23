import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { AccessRequest, AuditLog, MLResult, Workflow } from '@/lib/models'
import { verifyAuth, unauthorizedResponse } from '@/lib/auth'

/**
 * Convert JSON to CSV format
 */
function jsonToCSV(data: any[]): string {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0])
  const csvHeaders = headers.join(',')
  
  const csvRows = data.map(item =>
    headers.map(header => {
      const value = item[header]
      if (value === null || value === undefined) return ''
      if (typeof value === 'object') return `"${JSON.stringify(value)}"`
      return `"${String(value).replace(/"/g, '""')}"`
    }).join(',')
  )

  return [csvHeaders, ...csvRows].join('\n')
}

export async function POST(req: NextRequest) {
  try {
    const decodedToken = await verifyAuth(req)
    if (!decodedToken) {
      return unauthorizedResponse()
    }

    const body = await req.json()
    const { format = 'json', dataTypes = ['accessRequests', 'auditLogs'] } = body

    if (!['json', 'csv'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Use "json" or "csv"' },
        { status: 400 }
      )
    }

    await connectDB()

    const userId = decodedToken.userId
    const exportData: any = {}

    // Fetch requested data types
    if (dataTypes.includes('accessRequests')) {
      exportData.accessRequests = await AccessRequest.find({ userId }).lean()
    }

    if (dataTypes.includes('auditLogs')) {
      exportData.auditLogs = await AuditLog.find({ userId }).lean()
    }

    if (dataTypes.includes('mlResults')) {
      exportData.mlResults = await MLResult.find({ userId }).lean()
    }

    if (dataTypes.includes('workflows')) {
      exportData.workflows = await Workflow.find({}).lean() // Workflows are global
    }

    if (format === 'json') {
      return NextResponse.json(
        {
          success: true,
          exportDate: new Date().toISOString(),
          data: exportData,
        },
        {
          headers: {
            'Content-Disposition': `attachment; filename="zero-trust-export-${Date.now()}.json"`,
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // CSV format
    const csvContent: Record<string, string> = {}
    for (const [key, values] of Object.entries(exportData)) {
      if (Array.isArray(values) && values.length > 0) {
        csvContent[key] = jsonToCSV(values)
      }
    }

    const csvData = Object.entries(csvContent)
      .map(([key, csv]) => `\n\n=== ${key} ===\n${csv}`)
      .join('\n')

    return new NextResponse(csvData, {
      headers: {
        'Content-Disposition': `attachment; filename="zero-trust-export-${Date.now()}.csv"`,
        'Content-Type': 'text/csv; charset=utf-8',
      },
    })
  } catch (error: any) {
    console.error('Data export error:', error)
    return NextResponse.json(
      { error: 'Failed to export data', details: error.message },
      { status: 500 }
    )
  }
}
