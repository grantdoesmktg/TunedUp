import { VercelRequest, VercelResponse } from '@vercel/node'
import { jwtVerify, SignJWT } from 'jose'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Request query:', req.query)
    const { token } = req.query

    if (!token || typeof token !== 'string') {
      console.log('Invalid token provided:', token)
      console.log('Token type:', typeof token)
      return res.status(400).json({ error: 'Invalid token' })
    }

    console.log('Verifying token for magic link authentication')
    console.log('Token length:', token.length)
    console.log('Token starts with:', token.substring(0, 20))

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

    console.log('Setting session cookie and redirecting to dashboard')

    // Use HTML redirect instead of server redirect
    const dashboardUrl = '/dashboard'

    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Redirecting...</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: #f9fafb;
            }
            .spinner {
              border: 4px solid #f3f4f6;
              border-top: 4px solid #3b82f6;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 2s linear infinite;
              margin: 0 auto 20px;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div style="text-align: center;">
            <div class="spinner"></div>
            <p>Successfully authenticated! Redirecting to dashboard...</p>
          </div>
          <script>
            setTimeout(() => {
              window.location.href = '${dashboardUrl}';
            }, 1000);
          </script>
        </body>
      </html>
    `)

  } catch (error) {
    console.error('Verify token error:', error)

    // Redirect to login with error
    res.redirect(302, '/login?error=invalid-token')
  }
}