import { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { jwtVerify } from 'jose'
import { PrismaClient } from '@prisma/client'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const prisma = new PrismaClient()

const PRICE_IDS = {
  PLUS: process.env.STRIPE_PRICE_PLUS!,
  PRO: process.env.STRIPE_PRICE_PRO!,
  ULTRA: process.env.STRIPE_PRICE_ULTRA!
}

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

    const { plan } = req.body

    if (!plan || !PRICE_IDS[plan as keyof typeof PRICE_IDS]) {
      return res.status(400).json({ error: 'Invalid plan' })
    }

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          planCode: 'FREE'
        }
      })
    }

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: {
          userId: user.id
        }
      })

      customerId = customer.id

      await prisma.user.update({
        where: { email },
        data: { stripeCustomerId: customerId }
      })
    }

    // Create checkout session
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICE_IDS[plan as keyof typeof PRICE_IDS],
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/dashboard?success=true`,
      cancel_url: `${baseUrl}/dashboard?canceled=true`,
      metadata: {
        userId: user.id,
        plan,
      },
    })

    res.status(200).json({
      sessionId: session.id,
      url: session.url
    })

  } catch (error) {
    console.error('Create checkout error:', error)
    res.status(500).json({
      error: 'Failed to create checkout session'
    })
  }
}