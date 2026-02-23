import { NextRequest, NextResponse } from 'next/server'
import speakeasy from 'speakeasy'
import { connectDB } from '@/lib/db'
import { User } from '@/lib/models'
import { verifyAuth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req)
    if (authResult.error) return authResult.response

    const { code } = await req.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Verification code is required' },
        { status: 400 }
      )
    }

    await connectDB()

    const user = await User.findOne({ email: authResult.email })
    if (!user || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: '2FA not setup' },
        { status: 400 }
      )
    }

    // Verify the code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2, // Allow 2 time windows
    })

    if (!verified) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 401 }
      )
    }

    // Enable 2FA
    user.twoFactorEnabled = true
    user.twoFactorBackupCodes = generateBackupCodes()
    await user.save()

    return NextResponse.json(
      {
        success: true,
        message: '2FA enabled successfully',
        data: {
          backupCodes: user.twoFactorBackupCodes,
          message: 'Save these backup codes in a safe place. You can use them to login if you lose access to your authenticator.',
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('2FA verify error:', error)
    return NextResponse.json(
      { error: 'Failed to verify 2FA', details: error.message },
      { status: 500 }
    )
  }
}

function generateBackupCodes(count = 10): string[] {
  const codes = []
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase()
    codes.push(code)
  }
  return codes
}
