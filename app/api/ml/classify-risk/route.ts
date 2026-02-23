import { classifyRiskML, federatedLearningRiskAssessment, detectBehavioralAnomalies } from '@/lib/zeroTrust'
import { connectDB } from '@/lib/db'
import { MLResult as MLResultModel } from '@/lib/models'
import { predictRiskCnnLstm, getModelInfo } from '@/lib/ml/cnnLstm'
import type { AccessRequest } from '@/lib/zeroTrust'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ClassifyBody = {
  userId?: string
  resourceId?: string
  action?: string
  context?: {
    ipAddress?: string
    deviceId?: string
    location?: string
    userAgent?: string
  }
}

async function readJsonSafe(req: Request): Promise<ClassifyBody | null> {
  const text = await req.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function clamp0to100(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, Math.round(n)))
}

export async function POST(request: Request) {
  const warnings: string[] = []
  let body: ClassifyBody | null = null

  try {
    body = await readJsonSafe(request)
    if (!body) {
      return Response.json(
        { error: 'Invalid or empty JSON body' },
        { status: 400 },
      )
    }

    const userId = String(body.userId || '').trim()
    if (!userId) {
      return Response.json({ error: 'userId is required' }, { status: 400 })
    }

    const accessRequest: AccessRequest = {
      userId,
      resourceId: String(body.resourceId || 'resource-api'),
      action: String(body.action || 'READ'),
      timestamp: Date.now(),
      context: {
        ipAddress: body.context?.ipAddress || '0.0.0.0',
        deviceId: body.context?.deviceId || 'unknown',
        location: body.context?.location || 'Unknown',
        userAgent: body.context?.userAgent || 'unknown',
      },
    }

    // 1) Behavioral + federated (existing logic)
    const behavioralAnomalies = clamp0to100(detectBehavioralAnomalies(accessRequest))
    const federatedRiskScore = clamp0to100(
      federatedLearningRiskAssessment(accessRequest.userId, [accessRequest]),
    )

    // 2) ML score (prefer CNN-LSTM, fallback to heuristic)
    let mlRiskScore: number
    let mlSource: 'cnn-lstm' | 'heuristic' = 'cnn-lstm'
    try {
      mlRiskScore = clamp0to100(await predictRiskCnnLstm(accessRequest))
    } catch (e) {
      mlRiskScore = clamp0to100(classifyRiskML(accessRequest))
      mlSource = 'heuristic'
      warnings.push('CNN-LSTM model unavailable; used heuristic fallback.')
    }

    // 3) Try DB save (non-fatal)
    let saved = false
    let resultId: string | null = null
    try {
      await connectDB()
      const doc = await MLResultModel.create({
        userId: accessRequest.userId,
        resourceId: accessRequest.resourceId,
        mlRiskScore,
        behavioralScore: behavioralAnomalies,
        federatedScore: federatedRiskScore,
        timestamp: Date.now(),
        features: {
          action: accessRequest.action,
          ipAddress: accessRequest.context.ipAddress,
          location: accessRequest.context.location,
          modelSource: mlSource,
        },
      })
      saved = true
      resultId = String(doc._id)
    } catch (e) {
      saved = false
      resultId = null
      warnings.push('Database unavailable; result not persisted.')
    }

    return Response.json({
      mlRiskScore,
      behavioralAnomalies,
      federatedRiskScore,
      analysis: {
        timestamp: new Date().toISOString(),
        userId: accessRequest.userId,
        models: [
          mlSource === 'cnn-lstm' ? 'CNN-LSTM Risk Model (UNSW-NB15)' : 'Heuristic ML Risk Classifier',
          'Behavioral Anomaly Detector',
          'Federated Learning Aggregator',
        ],
        confidence: mlSource === 'cnn-lstm' ? 0.93 : 0.88,
      },
      saved,
      resultId,
      warnings,
      modelSource: mlSource,
    })
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : 'Unexpected error in classify-risk'
    return Response.json(
      { error: msg },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    await connectDB()
    const mlResults = await MLResultModel.find().sort({ timestamp: -1 }).limit(50)
    const count = await MLResultModel.countDocuments()
    const modelInfo = await getModelInfo()
    
    return Response.json({ 
      mlResults, 
      count,
      modelInfo,
    })
  } catch (error: unknown) {
    const modelInfo = await getModelInfo()
    return Response.json(
      { 
        mlResults: [], 
        count: 0, 
        warnings: ['Database unavailable'],
        modelInfo,
      },
      { status: 200 },
    )
  }
}
