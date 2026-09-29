import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { signupSchema } from '@prescriptionmaker/validation'
import { signJWT } from '@/lib/auth/jwt'
import { rateLimit } from '@/lib/auth/rate-limit'

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
)

const supabaseAdmin = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!
)

export async function POST(request: NextRequest) {
  // Rate limiting: 5 signups per hour per IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rateLimitResult = await rateLimit(`signup:${ip}`, 5, 3600)

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many signup attempts. Please try again later.',
        },
      },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Invalid request body.' } },
      { status: 400 }
    )
  }

  const parsed = signupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please fix the errors below.',
          details: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    )
  }

  const { name, email, password } = parsed.data

  // Create user with Supabase Auth (Anon client triggers the confirmation email)
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    }
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EMAIL_TAKEN',
            message: 'An account with this email already exists.',
          },
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: { code: 'SIGNUP_FAILED', message: 'Account creation failed. Please try again.' },
      },
      { status: 500 }
    )
  }

  // Create user profile in database
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users')
    .insert({
      id: authData.user!.id,
      email,
      name,
      role: 'doctor',
      plan: 'free',
      status: 'pending', // Pending email verification
    })
    .select('id, name, email, role, plan, status')
    .single()

  if (profileError || !profile) {
    // Cleanup: delete auth user if profile creation fails
    await supabaseAdmin.auth.admin.deleteUser(authData.user!.id)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'PROFILE_CREATION_FAILED', message: 'Account setup failed. Please try again.' },
      },
      { status: 500 }
    )
  }

  if (!authData.session) {
    // Email verification is required
    return NextResponse.json(
      {
        success: true,
        data: { user: profile, requiresEmailVerification: true },
        message: 'Please check your email to verify your account.',
      },
      { status: 201 }
    )
  }

  // If email confirmation is disabled in Supabase, we get a session immediately
  // Create Custom JWT tokens
  const accessToken = await signJWT(
    { sub: profile.id, email: profile.email, role: profile.role },
    '15m'
  )
  const refreshToken = await signJWT({ sub: profile.id, type: 'refresh' }, '7d')

  const response = NextResponse.json(
    {
      success: true,
      data: { user: profile, requiresEmailVerification: false },
      message: 'Account created successfully',
    },
    { status: 201 }
  )

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  }

  response.cookies.set('access_token', accessToken, {
    ...cookieOptions,
    maxAge: 60 * 15,
  })

  response.cookies.set('refresh_token', refreshToken, {
    ...cookieOptions,
    maxAge: 60 * 60 * 24 * 7,
  })

  // We should also set the Supabase session cookie for Next.js SSR
  response.cookies.set('sb-access-token', authData.session.access_token, {
    ...cookieOptions,
    maxAge: authData.session.expires_in,
  })
  response.cookies.set('sb-refresh-token', authData.session.refresh_token, {
    ...cookieOptions,
    maxAge: 60 * 60 * 24 * 7,
  })

  return response
}
