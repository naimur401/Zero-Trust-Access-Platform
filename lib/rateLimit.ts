import { NextRequest, NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>()

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000')
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')

/**
 * Get client IP address
 */
export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'unknown'
  return ip
}

/**
 * Check if request exceeds rate limit
 */
export function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  if (!entry || now > entry.resetTime) {
    // New window
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + WINDOW_MS,
    }
    rateLimitStore.set(identifier, newEntry)
    return {
      allowed: true,
      remaining: MAX_REQUESTS - 1,
      resetTime: newEntry.resetTime,
    }
  }

  if (entry.count < MAX_REQUESTS) {
    entry.count++
    return {
      allowed: true,
      remaining: MAX_REQUESTS - entry.count,
      resetTime: entry.resetTime,
    }
  }

  return {
    allowed: false,
    remaining: 0,
    resetTime: entry.resetTime,
  }
}

/**
 * Rate limit middleware
 */
export function rateLimitMiddleware(req: NextRequest) {
  const identifier = getClientIP(req)
  const result = checkRateLimit(identifier)

  if (!result.allowed) {
    const resetDate = new Date(result.resetTime).toISOString()
    return NextResponse.json(
      {
        error: 'Too many requests',
        details: `Rate limit exceeded. Try again at ${resetDate}`,
        resetTime: result.resetTime,
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.resetTime.toString(),
        },
      }
    )
  }

  // Add rate limit info to response headers
  return {
    headers: {
      'X-RateLimit-Limit': MAX_REQUESTS.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.resetTime.toString(),
    },
  }
}

/**
 * Clean up old entries (call periodically)
 */
export function cleanupRateLimit() {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Cleanup every 5 minutes
setInterval(cleanupRateLimit, 5 * 60 * 1000)
