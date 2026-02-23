import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/lib/models'
import { generateToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const signupSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = signupSchema.parse(body)

    await connectDB()

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: validatedData.email }, { username: validatedData.username }],
    }).lean()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email or username' },
        { status: 409 }
      )
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(validatedData.password, salt)

    // Create new user
    const user = new User({
      username: validatedData.username,
      email: validatedData.email,
      password: hashedPassword,
      fullName: validatedData.fullName || '',
      role: 'USER',
    })

    await user.save()

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'User created successfully',
        data: {
          userId: user._id,
          username: user.username,
          email: user.email,
          token,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Signup error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create user', details: error.message || String(error) },
      { status: 500 }
    )
  }
}
