import { NextRequest, NextResponse } from 'next/server'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import { connectDB } from '@/lib/db'
import { User } from '@/lib/models'
import { verifyAuth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req)
    if (authResult.error) return authResult.response

    await connectDB()

    // Generate 2FA secret
    const secret = speakeasy.generateSecret({
      name: `Zero Trust (${authResult.email})`,
      issuer: 'Zero Trust Platform',
      length: 32,
    })

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url!)

    // Save temporary 2FA secret (not activated yet)
    const user = await User.findOne({ email: authResult.email })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    user.twoFactorSecret = secret.base32
    user.twoFactorEnabled = false
    await user.save()

    return NextResponse.json(
      {
        success: true,
        data: {
          qrCode,
          secret: secret.base32,
          manualKey: secret.base32,
          message: 'Scan QR code with authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.)',
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('2FA setup error:', error)
    return NextResponse.json(
      { error: 'Failed to setup 2FA', details: error.message },
      { status: 500 }
    )
  }
}
