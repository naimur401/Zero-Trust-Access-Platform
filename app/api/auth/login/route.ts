import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/lib/models'
import { generateToken } from '@/lib/auth'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = loginSchema.parse(body)

    // Allow any email/password combination for demo purposes
    // Extract username from email (before @)
    const username = validatedData.email.split('@')[0] || 'user'

    const token = generateToken({
      userId: `user-${Date.now()}`,
      username: username,
      email: validatedData.email,
      role: 'USER',
    })

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        userId: `user-${Date.now()}`,
        username: username,
        email: validatedData.email,
        role: 'USER',
        token,
      },
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed', details: error.message },
      { status: 500 }
    )
  }
}
