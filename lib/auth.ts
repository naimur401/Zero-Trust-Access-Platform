import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRY = '7d'

export interface DecodedToken {
  userId: string
  username: string
  email: string
  role: string
  iat: number
  exp: number
}

/**
 * Generate JWT token
 */
export function generateToken(payload: {
  userId: string
  username: string
  email: string
  role: string
}): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY })
}

/**
 * Verify JWT token and return decoded data
 */
export function verifyToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7) // Remove "Bearer " prefix
}

/**
 * Middleware to verify JWT token
 */
export async function verifyAuth(req: NextRequest): Promise<DecodedToken | null> {
  const token = extractToken(req)
  if (!token) {
    return null
  }
  return verifyToken(token)
}

/**
 * Unauthorized response
 */
export function unauthorizedResponse() {
  return NextResponse.json(
    { error: 'Unauthorized', details: 'Invalid or missing authentication token' },
    { status: 401 }
  )
}

/**
 * Forbidden response
 */
export function forbiddenResponse() {
  return NextResponse.json(
    { error: 'Forbidden', details: 'Insufficient permissions' },
    { status: 403 }
  )
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole)
}
