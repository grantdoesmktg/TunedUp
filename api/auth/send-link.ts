import { VercelRequest, VercelResponse } from '@vercel/node'
import { Resend } from 'resend'
import { prisma } from '../../lib/prisma'
const resend = new Resend(process.env.RESEND_API_KEY)

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email } = req.body

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' })
    }

    // Generate 6-digit verification code
    const code = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Clean up any existing codes for this email
    await prisma.verificationCode.deleteMany({
      where: { email }
    })

    // Store new verification code
    await prisma.verificationCode.create({
      data: {
        email,
        code,
        expiresAt
      }
    })

    console.log('Generated verification code for', email, ':', code)

    // Send email with branded design
    await resend.emails.send({
      from: 'TunedUp <hello@tunedup.dev>',
      to: email,
      subject: '🏁 Your TunedUp Access Code - Ready to Roll!',
      html: `
        <div style="background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%); color: white; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
          <div style="max-width: 500px; margin: 0 auto; text-align: center;">
            <h1 style="font-size: 48px; margin-bottom: 10px; background: linear-gradient(45deg, #07fef7, #d82c83); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-weight: bold;">TunedUp</h1>

            <div style="background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 20px; padding: 30px; margin: 20px 0; border: 1px solid rgba(255,255,255,0.1);">
              <h2 style="color: #07fef7; margin-bottom: 20px;">🔑 Your Access Code</h2>
              <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #07fef7; background: rgba(0,0,0,0.3); padding: 25px; border-radius: 12px; margin: 20px 0; font-family: 'Courier New', monospace;">
                ${code}
              </div>
              <p style="color: #e5e7eb; margin: 15px 0; font-size: 16px;">Enter this code on the TunedUp login page</p>
              <p style="color: #9ca3af; font-size: 14px;">⏱️ Code expires in 15 minutes</p>
            </div>

            <div style="margin-top: 25px;">
              <p style="color: #d82c83; font-size: 18px; font-weight: 600;">🏎️ Ready to tune up your ride?</p>
              <p style="color: #9ca3af; font-size: 13px; margin-top: 15px;">Navigate to TunedUp in Safari or Chrome and enter your code</p>
            </div>
          </div>
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
      message: 'Verification code sent to your email'
    })

  } catch (error) {
    console.error('Send verification code error:', error)
    res.status(500).json({
      error: 'Failed to send verification code'
    })
  }
}