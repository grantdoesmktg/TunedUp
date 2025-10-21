import { VercelRequest, VercelResponse } from '@vercel/node'
import { jwtVerify } from 'jose'
import { setCorsHeaders } from '../lib/corsConfig.js'
import { prisma } from './lib/prisma.js'

const MAX_SAVED_IMAGES = 3

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
      // GET: Retrieve saved images
      if (action === 'get' && req.method === 'GET') {
        const savedImages = await prisma.savedImage.findMany({
          where: { userEmail },
          orderBy: { createdAt: 'desc' },
          take: MAX_SAVED_IMAGES
        })

        return res.status(200).json({
          images: savedImages
        })
      }

      // POST: Save image
      if (action === 'save' && req.method === 'POST') {
        const { imageUrl, carSpec, prompt } = req.body

        if (!imageUrl || !carSpec || !prompt) {
          return res.status(400).json({ error: 'imageUrl, carSpec, and prompt are required' })
        }

        // Check current count
        const currentCount = await prisma.savedImage.count({
          where: { userEmail }
        })

        if (currentCount >= MAX_SAVED_IMAGES) {
          return res.status(400).json({
            error: `Maximum of ${MAX_SAVED_IMAGES} saved images reached. Delete one to save a new image.`
          })
        }

        const savedImage = await prisma.savedImage.create({
          data: {
            userEmail,
            imageUrl,
            carSpec,
            prompt
          }
        })

        return res.status(200).json({
          success: true,
          image: savedImage
        })
      }

      // DELETE: Delete saved image
      if (action === 'delete' && req.method === 'DELETE') {
        const { imageId } = req.body

        if (!imageId) {
          return res.status(400).json({ error: 'imageId is required' })
        }

        await prisma.savedImage.delete({
          where: {
            id: imageId,
            userEmail // Ensure user owns this
          }
        })

        return res.status(200).json({ success: true })
      }

      return res.status(400).json({ error: 'Invalid action or method' })

    } catch (error) {
      console.error('Saved images API error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  } catch (authError) {
    console.error('Authentication error:', authError)
    return res.status(401).json({ error: 'Invalid session' })
  }
}
