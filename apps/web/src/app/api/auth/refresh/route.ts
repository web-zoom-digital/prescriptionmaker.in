import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT, signJWT } from '@/lib/auth/jwt'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const redirect = searchParams.get('redirect') ?? '/dashboard'

  const refreshToken = request.cookies.get('refresh_token')?.value

  if (!refreshToken) {
    return NextResponse.redirect(new URL('/login?error=Session expired', request.url))
  }

  try {
    const payload = await verifyJWT(refreshToken, 'refresh')
    
    if (!payload || !payload.sub) {
      throw new Error('Invalid refresh token')
    }

    // Fetch user profile from Supabase to get latest role and email
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role')
      .eq('id', payload.sub)
      .single()

    if (!profile) {
      throw new Error('User not found')
    }

    // Issue new Custom JWTs
    const newAccessToken = await signJWT(
      { sub: profile.id, email: profile.email, role: profile.role },
      '15m'
    )
    const newRefreshToken = await signJWT({ sub: profile.id, type: 'refresh' }, '7d')

    // Redirect to the original protected route
    const response = NextResponse.redirect(new URL(redirect, request.url))

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    }

    response.cookies.set('access_token', newAccessToken, {
      ...cookieOptions,
      maxAge: 60 * 15,
    })

    response.cookies.set('refresh_token', newRefreshToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (err) {
    console.error('Refresh token error:', err)
    // Clear invalid cookies
    const response = NextResponse.redirect(new URL('/login?error=Session expired', request.url))
    response.cookies.delete('access_token')
    response.cookies.delete('refresh_token')
    return response
  }
}
