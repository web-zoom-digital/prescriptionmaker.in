import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loginSchema } from '@prescriptionmaker/validation'
import { signJWT } from '@/lib/auth/jwt'
import { rateLimit } from '@/lib/auth/rate-limit'

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!
)

export async function POST(request: NextRequest) {
  // Rate limiting: 10 attempts per 15 minutes per IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rateLimitResult = await rateLimit(`login:${ip}`, 10, 900)

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many login attempts. Please wait 15 minutes and try again.',
        },
      },
      { status: 429 }
    )
  }

  // Parse and validate body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Invalid request body.' } },
      { status: 400 }
    )
  }

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid credentials format.',
          details: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    )
  }

  const { email, password } = parsed.data

  // Authenticate with Supabase
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !authData.user) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          // Generic message — don't reveal whether email or password is wrong
          message: 'Invalid email or password.',
        },
      },
      { status: 401 }
    )
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('users')
    .select('id, name, email, role, plan, status')
    .eq('id', authData.user.id)
    .single()

  if (!profile || profile.status === 'suspended') {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Your account is inactive. Please contact support.',
        },
      },
      { status: 403 }
    )
  }

  // Create JWT tokens
  const accessToken = await signJWT(
    { sub: profile.id, email: profile.email, role: profile.role },
    '15m'
  )
  const refreshToken = await signJWT({ sub: profile.id, type: 'refresh' }, '7d')

  const response = NextResponse.json({
    success: true,
    data: {
      user: profile,
    },
    message: 'Login successful',
  })

  // Set secure HTTP-only cookies
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  }

  response.cookies.set('access_token', accessToken, {
    ...cookieOptions,
    maxAge: 60 * 15, // 15 minutes
  })

  response.cookies.set('refresh_token', refreshToken, {
    ...cookieOptions,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  return response
}
