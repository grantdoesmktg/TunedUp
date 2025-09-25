import { VercelRequest, VercelResponse } from '@vercel/node'
import { jwtVerify, SignJWT } from 'jose'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { token } = req.query

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Invalid token' })
    }

    // Verify the JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    const { payload } = await jwtVerify(token, secret)
    const email = payload.email as string

    if (!email) {
      return res.status(400).json({ error: 'Invalid token payload' })
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Create session token (longer lived)
    const sessionToken = await new SignJWT({
      email,
      userId: user.id,
      plan: user.planCode
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30d')
      .setIssuedAt()
      .sign(secret)

    // Set session cookie and redirect to dashboard
    res.setHeader('Set-Cookie', [
      `session=${sessionToken}; HttpOnly; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
    ])

    // Redirect to dashboard
    res.redirect(302, '/dashboard')

  } catch (error) {
    console.error('Verify token error:', error)

    // Redirect to login with error
    res.redirect(302, '/login?error=invalid-token')
  }
}