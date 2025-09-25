import { VercelRequest, VercelResponse } from '@vercel/node'
import { Resend } from 'resend'
import { SignJWT } from 'jose'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email } = req.body

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' })
    }

    // Create JWT token with 15 minute expiration
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    const token = await new SignJWT({ email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('15m')
      .setIssuedAt()
      .sign(secret)

    // Create magic link
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'
    const magicLink = `${baseUrl}/auth/verify?token=${token}`

    // Send email
    await resend.emails.send({
      from: 'TunedUp <onboarding@resend.dev>',
      to: email,
      subject: 'Your TunedUp sign-in link',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1f2937;">Sign in to TunedUp</h1>
          <p style="color: #4b5563; font-size: 16px;">Click the button below to sign in to your TunedUp account:</p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${magicLink}"
               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Sign In to TunedUp
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px;">This link will expire in 15 minutes for security.</p>
          <p style="color: #6b7280; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `
    })

    // Find or create user record
    await prisma.user.upsert({
      where: { email },
      create: {
        email,
        planCode: 'FREE',
        perfUsed: 0,
        buildUsed: 0,
        imageUsed: 0
      },
      update: {} // Don't update if user exists
    })

    res.status(200).json({
      success: true,
      message: 'Magic link sent to your email'
    })

  } catch (error) {
    console.error('Send link error:', error)
    res.status(500).json({
      error: 'Failed to send magic link'
    })
  }
}