import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { connectDB } from '@/lib/db'
import { User } from '@/lib/models'
import { verifyAuth, unauthorizedResponse } from '@/lib/auth'

/**
 * Generate a random API key
 */
function generateAPIKey(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * GET - List all API keys for the user
 */
async function handleGET(req: NextRequest, decodedToken: any) {
  await connectDB()

  const user = await User.findById(decodedToken.userId).select('apiKeys')
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const apiKeys = user.apiKeys?.map((key: any) => ({
    name: key.name,
    createdAt: key.createdAt,
    expiresAt: key.expiresAt,
    isActive: key.isActive,
    keyPreview: key.key.substring(0, 8) + '...',
  })) || []

  return NextResponse.json({
    success: true,
    data: apiKeys,
  })
}

/**
 * POST - Create a new API key
 */
async function handlePOST(req: NextRequest, decodedToken: any) {
  try {
    const body = await req.json()
    const { name, expiresInDays } = body

    if (!name) {
      return NextResponse.json(
        { error: 'API key name is required' },
        { status: 400 }
      )
    }

    await connectDB()

    const apiKey = generateAPIKey()
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : undefined

    const user = await User.findByIdAndUpdate(
      decodedToken.userId,
      {
        $push: {
          apiKeys: {
            key: apiKey,
            name,
            createdAt: new Date(),
            expiresAt,
            isActive: true,
          },
        },
      },
      { new: true }
    )

    return NextResponse.json(
      {
        success: true,
        message: 'API key created successfully',
        data: {
          name,
          apiKey,
          createdAt: new Date(),
          expiresAt,
          warning: 'Save this key securely. You will not be able to see it again.',
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('API key creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create API key', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Revoke an API key
 */
async function handleDELETE(req: NextRequest, decodedToken: any) {
  try {
    const body = await req.json()
    const { keyName } = body

    if (!keyName) {
      return NextResponse.json(
        { error: 'API key name is required' },
        { status: 400 }
      )
    }

    await connectDB()

    const user = await User.findByIdAndUpdate(
      decodedToken.userId,
      {
        $pull: {
          apiKeys: { name: keyName },
        },
      },
      { new: true }
    )

    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully',
    })
  } catch (error: any) {
    console.error('API key revocation error:', error)
    return NextResponse.json(
      { error: 'Failed to revoke API key', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Main handler
 */
export async function GET(req: NextRequest) {
  const decodedToken = await verifyAuth(req)
  if (!decodedToken) {
    return unauthorizedResponse()
  }
  return handleGET(req, decodedToken)
}

export async function POST(req: NextRequest) {
  const decodedToken = await verifyAuth(req)
  if (!decodedToken) {
    return unauthorizedResponse()
  }
  return handlePOST(req, decodedToken)
}

export async function DELETE(req: NextRequest) {
  const decodedToken = await verifyAuth(req)
  if (!decodedToken) {
    return unauthorizedResponse()
  }
  return handleDELETE(req, decodedToken)
}
