import { VercelRequest, VercelResponse } from '@vercel/node'
import { incrementUsage } from '../../lib/quota'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email required' })
    }

    await incrementUsage(email, 'performance')

    res.status(200).json({ success: true })

  } catch (error) {
    console.error('Increment usage error:', error)
    res.status(500).json({ error: 'Failed to increment usage' })
  }
}