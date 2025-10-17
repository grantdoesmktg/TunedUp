import { VercelRequest } from '@vercel/node'
import { jwtVerify } from 'jose'

export async function getToken(req: VercelRequest) {
  try {
    // Try Authorization header first (for mobile apps)
    const authHeader = req.headers.authorization
    let token: string | undefined

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else {
      // Fall back to cookies (for web)
      const cookies = req.headers.cookie?.split(';') || []
      const sessionCookie = cookies
        .find(c => c.trim().startsWith('_vercel_jwt=') || c.trim().startsWith('session='))
        ?.split('=')[1]

      token = sessionCookie
    }

    if (!token) {
      return null
    }

    // Verify JWT
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    const { payload } = await jwtVerify(token, secret)

    return payload
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}
