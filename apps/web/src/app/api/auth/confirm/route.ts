import { type EmailOtpType } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { signJWT } from '@/lib/auth/jwt'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'

  if (token_hash && type) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error && data.session) {
      // User is verified and logged in.
      // We must update the `users` table status to 'active'
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data: profile } = await supabaseAdmin
        .from('users')
        .update({ status: 'active' })
        .eq('id', data.session.user.id)
        .select()
        .single()

      if (profile) {
        // Issue Custom JWTs to maintain compatibility with our existing auth flow
        const accessToken = await signJWT(
          { sub: profile.id, email: profile.email, role: profile.role },
          '15m'
        )
        const refreshToken = await signJWT({ sub: profile.id, type: 'refresh' }, '7d')

        const response = NextResponse.redirect(new URL(next, request.url))

        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax' as const,
          path: '/',
        }

        // Set Custom JWTs
        response.cookies.set('access_token', accessToken, {
          ...cookieOptions,
          maxAge: 60 * 15,
        })
        response.cookies.set('refresh_token', refreshToken, {
          ...cookieOptions,
          maxAge: 60 * 60 * 24 * 7,
        })

        // Set Supabase native session cookies for SSR
        response.cookies.set('sb-access-token', data.session.access_token, {
          ...cookieOptions,
          maxAge: data.session.expires_in,
        })
        response.cookies.set('sb-refresh-token', data.session.refresh_token, {
          ...cookieOptions,
          maxAge: 60 * 60 * 24 * 7,
        })

        return response
      }
    }
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(new URL('/login?error=Verification failed or link expired', request.url))
}
