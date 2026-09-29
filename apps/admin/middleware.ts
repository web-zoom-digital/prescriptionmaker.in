import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes — no auth required
  if (pathname === '/login') {
    return NextResponse.next()
  }

  // All other routes require admin_token cookie
  const adminToken = request.cookies.get('admin_token')?.value

  if (!adminToken) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg).*)',
  ],
}
