import { VercelRequest, VercelResponse } from '@vercel/node'
import { SignJWT } from 'jose'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email } = req.body

    if (email !== 'grantdoesmktg@gmail.com') {
      return res.status(403).json({ error: 'Testing bypass only allowed for specific email' })
    }

    console.log('Testing bypass login for:', email)

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          planCode: 'FREE',
          perfUsed: 0,
          buildUsed: 0,
          imageUsed: 0
        }
      })
      console.log('Created new user for testing:', user.id)
    } else {
      console.log('Found existing user:', user.id)
    }

    // Create session token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    const sessionToken = await new SignJWT({
      email,
      userId: user.id,
      plan: user.planCode
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30d')
      .setIssuedAt()
      .sign(secret)

    // Set session cookie
    const isProduction = process.env.NODE_ENV === 'production'
    const cookieName = isProduction ? '_vercel_jwt' : 'session'
    const cookieOptions = [
      `${cookieName}=${sessionToken}`,
      'HttpOnly',
      'Path=/',
      `Max-Age=${30 * 24 * 60 * 60}`,
      'SameSite=Lax'
    ]

    if (isProduction) {
      cookieOptions.push('Secure')
    }

    res.setHeader('Set-Cookie', cookieOptions.join('; '))

    console.log('Testing bypass successful, session cookie set')

    res.status(200).json({
      success: true,
      message: 'Testing login successful'
    })

  } catch (error) {
    console.error('Testing bypass error:', error)
    res.status(500).json({
      error: 'Testing bypass failed'
    })
  }
}