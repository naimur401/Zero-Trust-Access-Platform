/**
 * CNN-LSTM Model Inference for Risk Classification
 * Uses UNSW-NB15 trained model for network intrusion detection
 */

import type { AccessRequest } from '@/lib/zeroTrust'
import path from 'path'
import fs from 'fs'

type TF = typeof import('@tensorflow/tfjs-node')

const SEQ_LEN = 10
const FEATURE_DIM = 16

interface ModelMetadata {
  seq_len: number
  feature_dim: number
  features: string[]
  scaler_mean: number[]
  scaler_scale: number[]
  model_type: string
  dataset: string
}

/**
 * Build feature vector from access request
 * Maps network/security features to numerical values
 */
function buildFeatureVector(req: AccessRequest): number[] {
  const hour = new Date(req.timestamp).getHours()
  const offHours = hour >= 22 || hour <= 6 ? 1 : 0
  const unknownLoc = req.context.location === 'Unknown' ? 1 : 0
  const newDevice = req.context.deviceId.startsWith('new-') ? 1 : 0
  const botUA = req.context.userAgent.toLowerCase().includes('bot') ? 1 : 0

  const action = req.action.toUpperCase()
  const aRead = action === 'READ' ? 1 : 0
  const aWrite = action === 'WRITE' ? 1 : 0
  const aDelete = action === 'DELETE' ? 1 : 0

  // Hash IP/device/resource to numeric buckets (0..1)
  const hash01 = (s: string) => {
    let h = 0
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
    return (h % 1000) / 1000
  }

  const ipHash = hash01(req.context.ipAddress || '')
  const deviceHash = hash01(req.context.deviceId || '')
  const resourceHash = hash01(req.resourceId || '')
  const hourNorm = hour / 23

  // 16 features (must match training)
  return [
    hourNorm,
    offHours,
    unknownLoc,
    newDevice,
    botUA,
    aRead,
    aWrite,
    aDelete,
    ipHash,
    deviceHash,
    resourceHash,
    0, // reserved
    0, // reserved
    0, // reserved
    0, // reserved
    0, // reserved
  ]
}

/**
 * Build sequence tensor for LSTM
 * In production, this would use actual user history from DB
 * For now, we replicate the current request to form a sequence
 */
function buildSequenceTensor(tf: TF, req: AccessRequest, metadata: ModelMetadata) {
  const features = buildFeatureVector(req)

  // Normalize using saved scaler
  const normalized = features.map((f, i) => {
    const mean = metadata.scaler_mean[i] || 0
    const scale = metadata.scaler_scale[i] || 1
    return (f - mean) / (scale + 1e-8)
  })

  // Create sequence: [1, SEQ_LEN, FEATURE_DIM]
  // In production: use last SEQ_LEN events from user history
  const x = Array.from({ length: SEQ_LEN }, () => normalized)
  return tf.tensor3d([x], [1, SEQ_LEN, FEATURE_DIM], 'float32')
}

/**
 * Load TensorFlow.js
 */
async function getTf(): Promise<TF> {
  return await import('@tensorflow/tfjs-node')
}

/**
 * Global model cache (loaded once per process)
 */
declare global {
  // eslint-disable-next-line no-var
  var __cnnLstmModel: {
    model: import('@tensorflow/tfjs-node').LayersModel
    metadata: ModelMetadata
  } | undefined
}

/**
 * Load model and metadata from disk
 */
async function loadModelOnce(tf: TF) {
  if (globalThis.__cnnLstmModel) {
    return globalThis.__cnnLstmModel
  }

  const modelDir = path.join(process.cwd(), 'models', 'cnn-lstm-risk')

  // Check if model exists
  if (!fs.existsSync(modelDir)) {
    throw new Error(
      `CNN-LSTM model not found at ${modelDir}. Run: python scripts/train-cnn-lstm.py`,
    )
  }

  // Load metadata
  const metadataPath = path.join(modelDir, 'metadata.json')
  if (!fs.existsSync(metadataPath)) {
    throw new Error(`Metadata not found at ${metadataPath}`)
  }

  const metadata: ModelMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))

  // Load model (TensorFlow.js format)
  const modelJsonPath = path.join(modelDir, 'model.json')
  const modelUrl = `file://${modelJsonPath}`

  let model: import('@tensorflow/tfjs-node').LayersModel

  try {
    model = await tf.loadLayersModel(modelUrl)
  } catch (e) {
    // Fallback: try H5 format
    const h5Path = path.join(modelDir, 'model.h5')
    if (fs.existsSync(h5Path)) {
      model = await tf.loadLayersModel(`file://${h5Path}`)
    } else {
      throw new Error(`Could not load model from ${modelDir}`)
    }
  }

  globalThis.__cnnLstmModel = { model, metadata }
  return globalThis.__cnnLstmModel
}

/**
 * Predict risk score using CNN-LSTM model
 * Returns 0-100 risk score
 */
export async function predictRiskCnnLstm(req: AccessRequest): Promise<number> {
  try {
    const tf = await getTf()
    const { model, metadata } = await loadModelOnce(tf)

    const input = buildSequenceTensor(tf, req, metadata)

    try {
      const output = model.predict(input) as import('@tensorflow/tfjs-node').Tensor
      const data = await output.data()

      // Model outputs sigmoid (0..1), convert to 0..100
      const probability = Number(data[0] ?? 0)
      const score = Math.round(Math.max(0, Math.min(1, probability)) * 100)

      input.dispose()
      output.dispose()

      return score
    } catch (error) {
      input.dispose()
      throw error
    }
  } catch (error) {
    // If model loading fails, use heuristic
    throw error
  }
}

/**
 * Get model info (for dashboard display)
 */
export async function getModelInfo() {
  try {
    const tf = await getTf()
    const { metadata } = await loadModelOnce(tf)
    return {
      type: metadata.model_type,
      dataset: metadata.dataset,
      features: metadata.features.length,
      sequenceLength: metadata.seq_len,
      available: true,
    }
  } catch {
    return {
      type: 'CNN-LSTM',
      dataset: 'UNSW-NB15',
      features: 16,
      sequenceLength: 10,
      available: false,
    }
  }
}
