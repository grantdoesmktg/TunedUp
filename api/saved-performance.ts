import { VercelRequest, VercelResponse } from '@vercel/node'
import { jwtVerify } from 'jose'
import { setCorsHeaders } from '../lib/corsConfig.js'
import { prisma } from './lib/prisma.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS with restrictions
  setCorsHeaders(req, res)

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Verify JWT authentication
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    const token = authHeader.split(' ')[1]
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    const { payload } = await jwtVerify(token, secret)
    const userEmail = payload.email as string

    if (!userEmail) {
      return res.status(401).json({ error: 'Invalid session' })
    }

    const { action } = req.query

    try {
      // GET: Retrieve saved performance calculation
      if (action === 'get' && req.method === 'GET') {
        const savedPerformance = await prisma.savedPerformance.findUnique({
          where: { userEmail }
        })

        return res.status(200).json({
          performance: savedPerformance
        })
      }

      // POST: Save performance calculation (replaces existing)
      if (action === 'save' && req.method === 'POST') {
        const { carInput, results } = req.body

        if (!carInput || !results) {
          return res.status(400).json({ error: 'carInput and results are required' })
        }

        const savedPerformance = await prisma.savedPerformance.upsert({
          where: { userEmail },
          update: {
            carInput,
            results,
            updatedAt: new Date()
          },
          create: {
            userEmail,
            carInput,
            results
          }
        })

        return res.status(200).json({
          success: true,
          performance: savedPerformance
        })
      }

      // DELETE: Delete saved performance calculation
      if (action === 'delete' && req.method === 'DELETE') {
        const { perfId } = req.body

        await prisma.savedPerformance.delete({
          where: {
            id: perfId,
            userEmail // Ensure user owns this
          }
        })

        return res.status(200).json({ success: true })
      }

      return res.status(400).json({ error: 'Invalid action or method' })

    } catch (error) {
      console.error('Saved performance API error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  } catch (authError) {
    console.error('Authentication error:', authError)
    return res.status(401).json({ error: 'Invalid session' })
  }
}
