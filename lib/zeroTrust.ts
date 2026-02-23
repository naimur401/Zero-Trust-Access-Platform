// Zero Trust Policy Engine - Risk-based access control system

export interface AccessRequest {
  userId: string
  resourceId: string
  action: string
  timestamp: number
  context: {
    ipAddress: string
    deviceId: string
    location: string
    userAgent: string
  }
}

export interface RiskProfile {
  userId: string
  baseRiskScore: number
  behavioralAnomalies: number
  mlRiskScore: number
  federatedRiskScore: number
  finalDecision: 'ALLOW' | 'DENY' | 'REQUIRE_MFA'
  confidence: number
  factors: string[]
}

export interface Policy {
  id: string
  name: string
  conditions: PolicyCondition[]
  action: 'ALLOW' | 'DENY' | 'MFA_REQUIRED'
}

export interface PolicyCondition {
  field: string
  operator: 'eq' | 'gt' | 'lt' | 'in' | 'contains'
  value: any
}

// In-memory policy store
const policies: Map<string, Policy> = new Map()

// Initialize default policies
function initializeDefaultPolicies() {
  policies.set('low-risk-access', {
    id: 'low-risk-access',
    name: 'Allow Low Risk Access',
    conditions: [{ field: 'riskScore', operator: 'lt', value: 30 }],
    action: 'ALLOW',
  })

  policies.set('medium-risk-mfa', {
    id: 'medium-risk-mfa',
    name: 'Require MFA for Medium Risk',
    conditions: [
      { field: 'riskScore', operator: 'gt', value: 30 },
      { field: 'riskScore', operator: 'lt', value: 70 },
    ],
    action: 'MFA_REQUIRED',
  })

  policies.set('high-risk-deny', {
    id: 'high-risk-deny',
    name: 'Deny High Risk Access',
    conditions: [{ field: 'riskScore', operator: 'gt', value: 70 }],
    action: 'DENY',
  })
}

initializeDefaultPolicies()

// Simple ML Risk Classification (simulated)
export function classifyRiskML(request: AccessRequest): number {
  let risk = 0

  // Time-based anomaly detection
  const hour = new Date(request.timestamp).getHours()
  if (hour >= 22 || hour <= 6) risk += 15 // Off-hours access

  // Location anomaly (simulated)
  if (request.context.location === 'Unknown') risk += 20

  // Device changes
  if (request.context.deviceId.startsWith('new-')) risk += 25

  // User agent changes
  if (request.context.userAgent.includes('bot')) risk += 30

  return Math.min(risk, 100)
}

// Federated Learning simulation - distributed risk assessment
export function federatedLearningRiskAssessment(userId: string, requests: AccessRequest[]): number {
  // Simulate federated nodes analyzing patterns
  const nodes = 3
  let aggregatedRisk = 0

  for (let i = 0; i < nodes; i++) {
    // Each node contributes to risk assessment based on different patterns
    const nodeRisk = (Math.random() * 40 + (requests.length * 5)) % 100
    aggregatedRisk += nodeRisk
  }

  return Math.round(aggregatedRisk / nodes)
}

// Behavioral anomaly detection
export function detectBehavioralAnomalies(request: AccessRequest): number {
  let anomalyScore = 0

  // Simulate behavioral patterns
  const patterns = {
    unusualTime: Math.random() > 0.7 ? 15 : 0,
    unusualLocation: Math.random() > 0.8 ? 20 : 0,
    unusualResource: Math.random() > 0.75 ? 18 : 0,
    rapidRequests: Math.random() > 0.9 ? 25 : 0,
  }

  anomalyScore = Object.values(patterns).reduce((a, b) => a + b, 0)
  return Math.min(anomalyScore, 100)
}

// Main evaluation engine
export function evaluateAccessRequest(request: AccessRequest): RiskProfile {
  const mlRiskScore = classifyRiskML(request)
  const behavioralAnomalies = detectBehavioralAnomalies(request)
  const federatedRiskScore = federatedLearningRiskAssessment(request.userId, [request])

  // Weighted combination
  const finalRiskScore = Math.round(mlRiskScore * 0.4 + behavioralAnomalies * 0.35 + federatedRiskScore * 0.25)

  // Policy evaluation
  let decision: 'ALLOW' | 'DENY' | 'REQUIRE_MFA' = 'ALLOW'
  let confidence = 0.95

  for (const policy of policies.values()) {
    const policyMatches = evaluatePolicy(policy, { riskScore: finalRiskScore })
    if (policyMatches) {
      decision = policy.action
      confidence = 0.92
      break
    }
  }

  return {
    userId: request.userId,
    baseRiskScore: finalRiskScore,
    behavioralAnomalies,
    mlRiskScore,
    federatedRiskScore,
    finalDecision: decision,
    confidence,
    factors: gatherRiskFactors(request, mlRiskScore, behavioralAnomalies),
  }
}

function evaluatePolicy(policy: Policy, context: any): boolean {
  return policy.conditions.every((condition) => {
    const fieldValue = context[condition.field]
    switch (condition.operator) {
      case 'eq':
        return fieldValue === condition.value
      case 'gt':
        return fieldValue > condition.value
      case 'lt':
        return fieldValue < condition.value
      case 'in':
        return condition.value.includes(fieldValue)
      case 'contains':
        return String(fieldValue).includes(condition.value)
      default:
        return false
    }
  })
}

function gatherRiskFactors(request: AccessRequest, mlScore: number, anomalyScore: number): string[] {
  const factors: string[] = []

  if (mlScore > 30) factors.push('High ML Risk Score')
  if (anomalyScore > 30) factors.push('Behavioral Anomalies Detected')
  if (request.context.location === 'Unknown') factors.push('Unknown Location')
  if (request.context.deviceId.startsWith('new-')) factors.push('New Device')
  if (!request.context.ipAddress) factors.push('Missing IP Information')

  return factors.length > 0 ? factors : ['Clean Access Profile']
}

export function getAllPolicies(): Policy[] {
  return Array.from(policies.values())
}

export function addPolicy(policy: Policy): void {
  policies.set(policy.id, policy)
}

export function updatePolicy(id: string, updates: Partial<Policy>): void {
  const policy = policies.get(id)
  if (policy) {
    policies.set(id, { ...policy, ...updates })
  }
}
