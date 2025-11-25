import { VercelRequest, VercelResponse } from '@vercel/node'
import { jwtVerify, SignJWT } from 'jose'
import { Resend } from 'resend'
import { prisma } from './lib/prisma.js'
import { getToken } from './lib/auth.js'

const resend = new Resend(process.env.RESEND_API_KEY)

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action } = req.query

  // Route based on action query parameter
  if (action === 'send-link') {
    return handleSendLink(req, res)
  } else if (action === 'verify') {
    return handleVerify(req, res)
  } else if (action === 'me') {
    return handleMe(req, res)
  } else if (action === 'logout') {
    return handleLogout(req, res)
  } else {
    return res.status(400).json({ error: 'Invalid action' })
  }
}

// /api/auth?action=send-link
async function handleSendLink(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email } = req.body

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' })
    }

    // Demo account bypass - hardcoded verification code for Apple reviewers
    const DEMO_EMAIL = 'reviewer@tunedup.dev'
    const DEMO_CODE = '999999'
    const isDemoAccount = email.toLowerCase() === DEMO_EMAIL.toLowerCase()

    const code = isDemoAccount ? DEMO_CODE : generateVerificationCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await prisma.verificationCode.deleteMany({
      where: { email }
    })

    await prisma.verificationCode.create({
      data: {
        email,
        code,
        expiresAt
      }
    })

    console.log('Generated verification code for', email, ':', code)

    // Skip sending email for demo account
    if (!isDemoAccount) {
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
    }

    // Create or update user - give ULTRA tier to demo account
    await prisma.user.upsert({
      where: { email },
      create: {
        email,
        planCode: isDemoAccount ? 'ULTRA' : 'FREE',
        tokens: isDemoAccount ? 500 : 30 // ULTRA gets 500, FREE gets 30
      },
      update: isDemoAccount ? { planCode: 'ULTRA', tokens: 500 } : {}
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

// /api/auth?action=verify
async function handleVerify(req: VercelRequest, res: VercelResponse) {
  // Handle both GET (magic links with token query param) and POST (verification codes)
  if (req.method === 'GET' && req.query.token) {
    return handleMagicLink(req, res)
  } else if (req.method === 'POST') {
    return handleVerificationCode(req, res)
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}

async function handleMagicLink(req: VercelRequest, res: VercelResponse) {
  try {
    const { token } = req.query

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Invalid token' })
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    const { payload } = await jwtVerify(token, secret)
    const email = payload.email as string

    if (!email) {
      return res.status(400).json({ error: 'Invalid token payload' })
    }

    return await createUserSession(email, res, true)
  } catch (error) {
    console.error('Verify magic link error:', error)
    res.redirect(302, '/login?error=invalid-token')
  }
}

async function handleVerificationCode(req: VercelRequest, res: VercelResponse) {
  try {
    const { email, code } = req.body

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code required' })
    }

    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      }
    })

    if (!verificationCode) {
      return res.status(400).json({ error: 'Invalid or expired code' })
    }

    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { used: true }
    })

    return await createUserSession(email, res, false)
  } catch (error) {
    console.error('Verify code error:', error)
    res.status(500).json({
      error: 'Failed to verify code'
    })
  }
}

async function createUserSession(email: string, res: VercelResponse, sendHtml: boolean) {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      if (sendHtml) {
        return res.redirect(302, '/login?error=user-not-found')
      } else {
        return res.status(404).json({ error: 'User not found' })
      }
    }

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

    if (sendHtml) {
      // Redirect HTML (shortened version)
      res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Login Successful</title>
          <meta http-equiv="refresh" content="0; url=/dashboard">
        </head>
        <body>
          <p>Redirecting to dashboard...</p>
          <script>window.location.replace('/dashboard');</script>
        </body>
      </html>
    `)
    } else {
      // Return full user object with all fields including profile customization
      // IMPORTANT: Return the token for native mobile app (cookies don't work in React Native)
      res.status(200).json({
        success: true,
        message: 'Authentication successful',
        token: sessionToken, // <-- Add token to response for mobile apps
        user: {
          id: user.id,
          email: user.email,
          planCode: user.planCode,
          planRenewsAt: user.planRenewsAt,
          extraCredits: user.extraCredits,
          tokens: user.tokens,
          communityUsed: user.communityUsed,
          resetDate: user.resetDate,
          createdAt: user.createdAt,
          // Profile customization fields
          name: user.name,
          nickname: user.nickname,
          location: user.location,
          instagramHandle: user.instagramHandle,
          profileIcon: user.profileIcon,
          backgroundTheme: user.backgroundTheme
        }
      })
    }

  } catch (error) {
    console.error('Create user session error:', error)
    if (sendHtml) {
      res.redirect(302, '/login?error=session-error')
    } else {
      res.status(500).json({ error: 'Failed to create session' })
    }
  }
}

// /api/auth?action=me
async function handleMe(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Use the getToken helper that supports both Authorization header (mobile) and cookies (web)
    const payload = await getToken(req)

    if (!payload || !payload.email) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const email = payload.email as string

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        planCode: true,
        planRenewsAt: true,
        extraCredits: true,
        tokens: true,
        communityUsed: true,
        resetDate: true,
        createdAt: true,
        // Profile customization fields
        name: true,
        nickname: true,
        location: true,
        instagramHandle: true,
        profileIcon: true,
        backgroundTheme: true
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    console.log('[AUTH ME] User from DB:', JSON.stringify(user, null, 2))

    const now = new Date()
    const daysSinceReset = Math.floor((now.getTime() - user.resetDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSinceReset >= 30) {
      // Calculate new token amount with carryover
      const { calculateMonthlyRefill, PLAN_TOKENS } = await import('../lib/tokens.js')

      // If user.tokens is null/undefined, set to plan default
      const currentTokens = user.tokens ?? PLAN_TOKENS[user.planCode as keyof typeof PLAN_TOKENS] ?? PLAN_TOKENS.FREE
      const newTokens = calculateMonthlyRefill(user.planCode, currentTokens)

      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          tokens: newTokens,
          communityUsed: 0,
          resetDate: now
        },
        select: {
          id: true,
          email: true,
          planCode: true,
          planRenewsAt: true,
          extraCredits: true,
          tokens: true,
          communityUsed: true,
          resetDate: true,
          createdAt: true,
          // Profile customization fields
          name: true,
          nickname: true,
          location: true,
          instagramHandle: true,
          profileIcon: true,
          backgroundTheme: true
        }
      })

      return res.status(200).json({ user: updatedUser })
    }

    // If user has null tokens (legacy user from before token system), set default tokens
    if (user.tokens === null || user.tokens === undefined) {
      const { PLAN_TOKENS } = await import('../lib/tokens.js')
      const defaultTokens = PLAN_TOKENS[user.planCode as keyof typeof PLAN_TOKENS] ?? PLAN_TOKENS.FREE

      const updatedUser = await prisma.user.update({
        where: { email },
        data: { tokens: defaultTokens },
        select: {
          id: true,
          email: true,
          planCode: true,
          planRenewsAt: true,
          extraCredits: true,
          tokens: true,
          communityUsed: true,
          resetDate: true,
          createdAt: true,
          name: true,
          nickname: true,
          location: true,
          instagramHandle: true,
          profileIcon: true,
          backgroundTheme: true
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

// /api/auth?action=logout
async function handleLogout(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  res.setHeader('Set-Cookie', [
    'session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax'
  ])

  res.status(200).json({ success: true })
}
