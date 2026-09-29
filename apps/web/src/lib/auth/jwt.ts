import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env['JWT_SECRET'] ?? 'fallback-secret-change-in-production'
)

const JWT_REFRESH_SECRET = new TextEncoder().encode(
  process.env['JWT_REFRESH_SECRET'] ?? 'fallback-refresh-secret-change-in-production'
)

export interface JWTPayload {
  sub: string
  email?: string
  role?: string
  type?: string
  iat?: number
  exp?: number
}

export async function signJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>, expiry: string): Promise<string> {
  const secret = payload.type === 'refresh' ? JWT_REFRESH_SECRET : JWT_SECRET

  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiry)
    .setIssuer('prescriptionmaker.in')
    .setAudience('prescriptionmaker.in')
    .sign(secret)
}

export async function verifyJWT(token: string, type: 'access' | 'refresh' = 'access'): Promise<JWTPayload | null> {
  try {
    const secret = type === 'refresh' ? JWT_REFRESH_SECRET : JWT_SECRET
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'prescriptionmaker.in',
      audience: 'prescriptionmaker.in',
    })
    return payload as JWTPayload
  } catch {
    return null
  }
}
