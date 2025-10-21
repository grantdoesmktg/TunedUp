import { jwtVerify } from 'jose'

export interface AuthInfo {
  email: string | null
}

export async function getEmailFromAuthorizationHeader(authorizationHeader?: string | string[] | null): Promise<string | null> {
  if (!authorizationHeader) return null
  const header = Array.isArray(authorizationHeader) ? authorizationHeader[0] : authorizationHeader
  if (!header) return null
  const parts = header.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null
  const token = parts[1]
  if (!token) return null

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    const { payload } = await jwtVerify(token, secret)
    const email = (payload as any)?.email as string | undefined
    return email || null
  } catch {
    return null
  }
}

export async function getEmailFromRequestHeaders(headers: Record<string, unknown>): Promise<string | null> {
  const authHeader = (headers['authorization'] || headers['Authorization']) as string | undefined
  const emailFromBearer = await getEmailFromAuthorizationHeader(authHeader)
  if (emailFromBearer) return emailFromBearer
  // Legacy fallback: allow x-user-email only if bearer is not provided
  const legacyHeader = headers['x-user-email'] as string | undefined
  return legacyHeader || null
}


