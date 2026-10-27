import { NextResponse } from 'next/server'

export const dynamic = 'force-static'

export async function GET() {
  return new NextResponse('b4f8a3c1e2d547898012f45c9a7e3d16', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
