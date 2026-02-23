import { getBlockchainStatus, getBlockchain, mineCurrentBlock } from '@/lib/blockchain'
import { connectDB } from '@/lib/db'
import { AuditLog as AuditLogModel } from '@/lib/models'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    if (action === 'status') {
      const status = getBlockchainStatus()
      return Response.json({ status })
    }

    if (action === 'chain') {
      const chain = getBlockchain()
      return Response.json({ chain })
    }

    // Try to connect to DB, but don't fail if it doesn't work
    let auditLogs: any[] = []
    try {
      await connectDB()
      
      if (action === 'audit-log') {
        auditLogs = await AuditLogModel.find().sort({ timestamp: -1 }).limit(100)
        return Response.json({ 
          auditLog: auditLogs,
          count: await AuditLogModel.countDocuments()
        })
      }

      auditLogs = await AuditLogModel.find().sort({ timestamp: -1 }).limit(50)
    } catch (dbError) {
      console.warn('Database connection failed, using empty audit log:', dbError)
      auditLogs = []
    }

    const status = getBlockchainStatus()
    
    return Response.json({ 
      auditLog: auditLogs,
      status: status,
      count: auditLogs.length
    })
  } catch (error) {
    console.error('Blockchain GET error:', error)
    return Response.json(
      { error: 'Failed to fetch blockchain data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (body.action === 'mine') {
      try {
        const block = mineCurrentBlock()
        const status = getBlockchainStatus()
        
        // Try to save to DB, but don't fail if it doesn't work
        try {
          await connectDB()
        } catch (dbError) {
          console.warn('Database connection failed, blockchain still works in-memory:', dbError)
        }
        
        return Response.json({
          success: true,
          block,
          status: status,
        })
      } catch (mineError) {
        console.error('Mining error:', mineError)
        return Response.json(
          { error: 'Failed to mine block', details: mineError instanceof Error ? mineError.message : 'Unknown error' },
          { status: 500 }
        )
      }
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Blockchain POST error:', error)
    return Response.json(
      { error: 'Failed to process blockchain action', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
