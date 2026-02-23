import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/lib/models'
import { verifyAuth, unauthorizedResponse } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const decodedToken = await verifyAuth(req)
    if (!decodedToken) {
      return unauthorizedResponse()
    }

    await connectDB()

    // Get user data
    const user = await User.findById(decodedToken.userId).select('-password')

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        apiKeysCount: user.apiKeys?.length || 0,
      },
    })
  } catch (error: any) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile', details: error.message },
      { status: 500 }
    )
  }
}
