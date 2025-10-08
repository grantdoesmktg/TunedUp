import { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { jwtVerify } from 'jose'
import { prisma } from '../../lib/prisma.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get session from cookie - check both production and development cookie names
    const cookies = req.headers.cookie?.split(';') || []
    const sessionCookie = cookies
      .find(c => c.trim().startsWith('_vercel_jwt=') || c.trim().startsWith('session='))
      ?.split('=')[1]

    if (!sessionCookie) {
      console.log('No session cookie found. Available cookies:', req.headers.cookie)
      return res.status(401).json({ error: 'Not authenticated' })
    }

    // Verify session token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    const { payload } = await jwtVerify(sessionCookie, secret)
    const email = payload.email as string

    if (!email) {
      return res.status(401).json({ error: 'Invalid session' })
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || !user.stripeCustomerId) {
      return res.status(400).json({ error: 'No subscription found' })
    }

    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://www.tunedup.dev'
      : 'http://localhost:3000'

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/dashboard`,
    })

    res.status(200).json({
      url: portalSession.url
    })

  } catch (error) {
    console.error('Create portal error:', error)
    res.status(500).json({
      error: 'Failed to create portal session'
    })
  }
}