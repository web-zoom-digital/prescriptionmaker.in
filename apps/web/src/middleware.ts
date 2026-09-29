import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth/jwt'

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/editor']

// Routes that should redirect to dashboard if already logged in
const AUTH_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route))

  const accessToken = request.cookies.get('access_token')?.value
  const refreshToken = request.cookies.get('refresh_token')?.value

  // Verify access token
  let isAuthenticated = false
  if (accessToken) {
    const payload = await verifyJWT(accessToken, 'access')
    isAuthenticated = !!payload
  }

  // If access token expired but refresh token exists, try to refresh
  if (!isAuthenticated && refreshToken) {
    const refreshPayload = await verifyJWT(refreshToken, 'refresh')
    if (refreshPayload) {
      // Redirect to refresh endpoint which will set new cookies and redirect back
      const refreshUrl = new URL('/api/auth/refresh', request.url)
      refreshUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(refreshUrl)
    }
  }

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from auth routes
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon, robots, sitemap, api (allow all API routes to handle their own auth)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon|robots|sitemap|api|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|woff|woff2)).*)',
  ],
}
