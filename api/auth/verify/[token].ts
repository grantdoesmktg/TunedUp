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

    console.log('Setting session cookie and redirecting to dashboard')
    console.log('Cookie options:', cookieOptions.join('; '))
    console.log('Is production:', isProduction)
    console.log('Environment:', process.env.NODE_ENV)

    // Use HTML redirect instead of server redirect

    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Login Successful</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: #f9fafb;
              padding: 20px;
              box-sizing: border-box;
            }
            .container {
              text-align: center;
              max-width: 400px;
              width: 100%;
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
            .success-message {
              font-size: 18px;
              color: #374151;
              margin-bottom: 20px;
            }
            .mobile-warning {
              display: none;
              background: #fef3c7;
              border: 2px solid #f59e0b;
              border-radius: 8px;
              padding: 16px;
              margin: 20px 0;
              text-align: left;
            }
            .mobile-warning h3 {
              margin: 0 0 10px 0;
              color: #92400e;
              font-size: 16px;
            }
            .mobile-warning p {
              margin: 0 0 10px 0;
              color: #78350f;
              font-size: 14px;
              line-height: 1.4;
            }
            .open-browser-btn {
              background: #3b82f6;
              color: white;
              padding: 12px 24px;
              border: none;
              border-radius: 6px;
              font-size: 16px;
              font-weight: 500;
              cursor: pointer;
              width: 100%;
              margin-top: 10px;
            }
            .open-browser-btn:hover {
              background: #2563eb;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="spinner" id="spinner"></div>
            <div class="success-message" id="normalMessage">
              Successfully authenticated! Redirecting to dashboard...
            </div>

            <div class="mobile-warning" id="mobileWarning">
              <h3>📱 On a mobile device? Click here to save your account</h3>
              <p>You're currently in an email app browser. To stay logged in:</p>
              <p><strong>1.</strong> Tap the button below to open in your main browser</p>
              <p><strong>2.</strong> You'll stay logged in for future visits</p>
              <button class="open-browser-btn" onclick="openInMainBrowser()">
                Open in Safari/Chrome
              </button>
            </div>
          </div>

          <script>
            // Detect in-app browsers
            function isInAppBrowser() {
              const ua = navigator.userAgent || navigator.vendor || window.opera;

              // Gmail, Outlook, Yahoo Mail, Apple Mail, etc.
              const inAppPatterns = [
                /FBAN/i,      // Facebook
                /FBAV/i,      // Facebook
                /Instagram/i, // Instagram
                /LinkedInApp/i, // LinkedIn
                /GSA/i,       // Google Search App
                /YahooMailApp/i, // Yahoo Mail
                /OutlookMobile/i, // Outlook
                /TwitterAndroid/i, // Twitter
                /DiscordAndroid/i, // Discord
                /SkypeUriPreview/i, // Skype
                /TelegramBot/i,    // Telegram
                /KAKAOTALK/i,      // KakaoTalk
                /NAVER/i,          // Naver
                /Snapchat/i,       // Snapchat
                /TikTok/i,         // TikTok
                /Line/i,           // Line
              ];

              // Check for common in-app browser patterns
              for (let pattern of inAppPatterns) {
                if (pattern.test(ua)) return true;
              }

              // Check for webview indicators
              if (ua.includes('wv') && ua.includes('Version/')) return true; // Android WebView
              if (window.navigator.standalone === false) return true; // iOS WebView

              // Check if it's a mobile device and missing standard browser features
              const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
              if (isMobile) {
                // Check for missing features that indicate webview
                if (!window.chrome && !window.safari) {
                  return true;
                }
              }

              return false;
            }

            function isMobileDevice() {
              return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            }

            function openInMainBrowser() {
              // Try to open in external browser
              const currentUrl = window.location.href.replace('/auth/verify/', '/dashboard');

              // Create a link that forces external opening
              window.open(currentUrl, '_blank');

              // Also try the current window as fallback
              setTimeout(() => {
                window.location.replace('/dashboard');
              }, 1000);
            }

            // Check if we should show mobile warning
            if (isMobileDevice() && isInAppBrowser()) {
              document.getElementById('mobileWarning').style.display = 'block';
              document.getElementById('normalMessage').textContent = 'Authentication successful!';
              document.getElementById('spinner').style.display = 'none';
            } else {
              // Normal redirect flow
              setTimeout(() => {
                window.location.replace('/dashboard');
              }, 1500);
            }
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