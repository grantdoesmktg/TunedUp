import { VercelRequest, VercelResponse } from '@vercel/node'

const ALLOWED_ORIGINS = [
  'https://www.tunedup.dev',
  'https://tunedup.dev',
  'https://tuned-up.vercel.app',
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:5173', 'http://localhost:5174'] : [])
]

export function setCorsHeaders(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin

  // Check if origin is allowed
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else if (process.env.NODE_ENV === 'development') {
    // In development, allow all origins for testing
    res.setHeader('Access-Control-Allow-Origin', '*')
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, x-user-email')
}
