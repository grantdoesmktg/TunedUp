import { VercelRequest, VercelResponse } from '@vercel/node'
import { jwtVerify, SignJWT } from 'jose'
import { prisma } from '../../lib/prisma'


export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle both GET (magic links) and POST (verification codes)
  if (req.method === 'GET') {
    return handleMagicLink(req, res)
  } else if (req.method === 'POST') {
    return handleVerificationCode(req, res)
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}

async function handleMagicLink(req: VercelRequest, res: VercelResponse) {
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

    return await createUserSession(email, res, true) // true = redirect with HTML
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

    // Find valid verification code
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

    // Mark code as used
    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { used: true }
    })

    return await createUserSession(email, res, false) // false = JSON response
  } catch (error) {
    console.error('Verify code error:', error)
    res.status(500).json({
      error: 'Failed to verify code'
    })
  }
}

async function createUserSession(email: string, res: VercelResponse, sendHtml: boolean) {
  try {
    // Get user data
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

    // Create session token (longer lived)
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

    console.log('User authenticated successfully')
    console.log('Cookie options:', cookieOptions.join('; '))
    console.log('Is production:', isProduction)
    console.log('Environment:', process.env.NODE_ENV)

    if (sendHtml) {
      // HTML redirect for magic links
      res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Login Successful</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
              background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);
              color: white;
              min-height: 100vh;
              display: flex;
              justify-content: center;
              align-items: center;
              padding: 20px;
              position: relative;
              overflow: hidden;
            }

            /* Animated background elements */
            .bg-decoration {
              position: absolute;
              opacity: 0.1;
              pointer-events: none;
            }
            .bg-car1 {
              top: 10%;
              left: -10%;
              font-size: 120px;
              animation: float 6s ease-in-out infinite;
            }
            .bg-car2 {
              bottom: 10%;
              right: -10%;
              font-size: 80px;
              animation: float 8s ease-in-out infinite reverse;
            }
            @keyframes float {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-20px) rotate(5deg); }
            }

            .container {
              text-align: center;
              max-width: 450px;
              width: 100%;
              background: rgba(255, 255, 255, 0.05);
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 20px;
              padding: 40px 30px;
              box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
              position: relative;
              z-index: 1;
            }

            .logo {
              font-size: 48px;
              margin-bottom: 10px;
              background: linear-gradient(45deg, #07fef7, #d82c83);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              font-weight: bold;
            }

            .spinner {
              width: 50px;
              height: 50px;
              margin: 20px auto;
              border: 4px solid rgba(255, 255, 255, 0.2);
              border-top: 4px solid #07fef7;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }

            .success-message {
              font-size: 20px;
              color: #e5e7eb;
              margin: 20px 0;
              font-weight: 500;
            }

            .mobile-warning {
              display: none;
              background: linear-gradient(135deg, rgba(7, 254, 247, 0.1), rgba(216, 44, 131, 0.1));
              border: 2px solid rgba(7, 254, 247, 0.3);
              border-radius: 16px;
              padding: 30px 25px;
              margin: 25px 0;
              text-align: left;
              position: relative;
              overflow: hidden;
            }

            .mobile-warning::before {
              content: '';
              position: absolute;
              top: -50%;
              left: -50%;
              width: 200%;
              height: 200%;
              background: linear-gradient(45deg, transparent, rgba(7, 254, 247, 0.05), transparent);
              animation: shimmer 3s ease-in-out infinite;
            }
            @keyframes shimmer {
              0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
              100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
            }

            .mobile-warning h3 {
              margin: 0 0 15px 0;
              color: #07fef7;
              font-size: 24px;
              font-weight: 700;
              position: relative;
              z-index: 1;
            }

            .mobile-warning p {
              margin: 0 0 12px 0;
              color: #d1d5db;
              font-size: 16px;
              line-height: 1.5;
              position: relative;
              z-index: 1;
            }

            .mobile-warning .highlight {
              color: #07fef7;
              font-weight: 600;
            }

            .open-browser-btn {
              background: linear-gradient(45deg, #07fef7, #d82c83);
              color: white;
              padding: 16px 32px;
              border: none;
              border-radius: 12px;
              font-size: 18px;
              font-weight: 600;
              cursor: pointer;
              width: 100%;
              margin-top: 20px;
              position: relative;
              overflow: hidden;
              transition: all 0.3s ease;
              text-transform: uppercase;
              letter-spacing: 1px;
              z-index: 1;
            }

            .open-browser-btn::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
              transition: left 0.5s;
            }

            .open-browser-btn:hover::before {
              left: 100%;
            }

            .open-browser-btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 10px 25px rgba(7, 254, 247, 0.3);
            }

            .alternative-text {
              margin-top: 20px;
              font-size: 13px;
              color: #9ca3af;
              background: rgba(255, 255, 255, 0.05);
              padding: 15px;
              border-radius: 10px;
              border: 1px solid rgba(255, 255, 255, 0.1);
              position: relative;
              z-index: 1;
            }

            .alternative-text strong {
              color: #d82c83;
            }

            #dashboardUrl {
              word-break: break-all;
              color: #07fef7;
              font-family: monospace;
              background: rgba(0, 0, 0, 0.3);
              padding: 8px;
              border-radius: 6px;
              display: inline-block;
              margin-top: 8px;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <!-- Animated background cars -->
          <div class="bg-decoration bg-car1">🏎️</div>
          <div class="bg-decoration bg-car2">🚗</div>

          <div class="container">
            <div class="logo">TunedUp</div>
            <div class="spinner" id="spinner"></div>
            <div class="success-message" id="normalMessage">
              🏁 You're in! Firing up your dashboard...
            </div>

            <div class="mobile-warning" id="mobileWarning">
              <h3>🏎️ Ready to hit the road?</h3>
              <p>Looks like you're browsing from your <span class="highlight">email app's garage</span> - let's get you into the <span class="highlight">main showroom</span> so your session stays tuned up!</p>
              <p><strong>🔧 Quick pit stop:</strong> Tap the button below to open TunedUp in your main browser</p>
              <p><strong>🏆 Why?</strong> You'll stay logged in and ready to roll every time you visit!</p>
              <button class="open-browser-btn" onclick="openInMainBrowser()">
                🚀 Open in Main Browser
              </button>
              <div class="alternative-text">
                <strong>🛠️ Manual Override:</strong> Copy this URL and paste it in Safari/Chrome for the full TunedUp experience:<br>
                <span id="dashboardUrl"></span>
              </div>
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
              // Get the base URL and construct dashboard URL
              const baseUrl = window.location.origin;
              const dashboardUrl = baseUrl + '/dashboard';

              // First, try to open in external browser
              const opened = window.open(dashboardUrl, '_blank');

              // If popup was blocked or failed, provide instructions
              if (!opened || opened.closed || typeof opened.closed == 'undefined') {
                alert('Please manually open your browser and go to: ' + dashboardUrl);
              }

              // Also redirect current window after a delay to give session time to set
              setTimeout(() => {
                window.location.replace('/dashboard');
              }, 2000);
            }

            // Check if we should show mobile warning
            if (isMobileDevice() && isInAppBrowser()) {
              document.getElementById('mobileWarning').style.display = 'block';
              document.getElementById('normalMessage').textContent = 'Authentication successful!';
              document.getElementById('spinner').style.display = 'none';

              // Show the dashboard URL for manual copying
              const dashboardUrl = window.location.origin + '/dashboard';
              document.getElementById('dashboardUrl').textContent = dashboardUrl;
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
    } else {
      // JSON response for verification codes
      res.status(200).json({
        success: true,
        message: 'Authentication successful',
        user: {
          email: user.email,
          planCode: user.planCode
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