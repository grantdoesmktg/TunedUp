import { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Clear the session cookie
  res.setHeader('Set-Cookie', [
    'session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax'
  ])

  res.status(200).json({ success: true })
}