import { VercelRequest, VercelResponse } from '@vercel/node'
import { jwtVerify } from 'jose'
import { prisma } from '../lib/prisma'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Auth check - Headers:', req.headers.cookie)
    console.log('Auth check - User Agent:', req.headers['user-agent'])
    console.log('Auth check - Origin:', req.headers.origin)
    console.log('Auth check - Referer:', req.headers.referer)

    // Get session from cookie - handle both 'session' and '_vercel_jwt' names
    console.log('All cookies:', req.headers.cookie)

    let sessionCookie = req.headers.cookie
      ?.split(';')
      .find(c => c.trim().startsWith('session='))
      ?.split('=')[1]

    // Fallback to _vercel_jwt if session cookie not found
    if (!sessionCookie) {
      const vercelJwtCookie = req.headers.cookie
        ?.split(';')
        .find(c => c.trim().startsWith('_vercel_jwt='))
        ?.split('=')[1]

      // Handle multiple JWT tokens separated by commas - take the first one (ours)
      if (vercelJwtCookie) {
        sessionCookie = vercelJwtCookie.split(',')[0]
      }
    }

    console.log('Extracted session cookie:', sessionCookie ? 'Found' : 'Not found')

    // Debug: List all cookies
    if (req.headers.cookie) {
      const allCookies = req.headers.cookie.split(';').map(c => c.trim())
      console.log('All cookie names:', allCookies.map(c => c.split('=')[0]))
    }

    if (!sessionCookie) {
      console.log('No session cookie found')
      return res.status(401).json({ error: 'Not authenticated' })
    }

    // Verify session token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    const { payload } = await jwtVerify(sessionCookie, secret)
    const email = payload.email as string

    if (!email) {
      return res.status(401).json({ error: 'Invalid session' })
    }

    // Get fresh user data
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        planCode: true,
        planRenewsAt: true,
        extraCredits: true,
        perfUsed: true,
        buildUsed: true,
        imageUsed: true,
        communityUsed: true,
        resetDate: true,
        createdAt: true
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Check if usage needs to be reset
    const now = new Date()
    const daysSinceReset = Math.floor((now.getTime() - user.resetDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSinceReset >= 30) {
      // Reset usage for new month
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          perfUsed: 0,
          buildUsed: 0,
          imageUsed: 0,
          communityUsed: 0,
          resetDate: now
        },
        select: {
          id: true,
          email: true,
          planCode: true,
          planRenewsAt: true,
          extraCredits: true,
          perfUsed: true,
          buildUsed: true,
          imageUsed: true,
          communityUsed: true,
          resetDate: true,
          createdAt: true
        }
      })

      return res.status(200).json({ user: updatedUser })
    }

    res.status(200).json({ user })

  } catch (error) {
    console.error('Get user error:', error)
    res.status(401).json({ error: 'Invalid session' })
  }
}