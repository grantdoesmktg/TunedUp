import { VercelRequest, VercelResponse } from '@vercel/node'
import { put } from '@vercel/blob'
import { jwtVerify } from 'jose'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Verify authentication
    const sessionCookie = req.headers.cookie
      ?.split(';')
      .find(c => c.trim().startsWith('session=') || c.trim().startsWith('_vercel_jwt='))
      ?.split('=')[1]

    if (!sessionCookie) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    const { payload } = await jwtVerify(sessionCookie.split(',')[0], secret)
    const email = payload.email as string

    if (!email) {
      return res.status(401).json({ error: 'Invalid session' })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Parse form data
    const { image, description } = req.body

    if (!image) {
      return res.status(400).json({ error: 'Image is required' })
    }

    // Convert base64 to buffer if needed
    let imageBuffer: Buffer
    if (image.startsWith('data:')) {
      const base64Data = image.split(',')[1]
      imageBuffer = Buffer.from(base64Data, 'base64')
    } else {
      imageBuffer = Buffer.from(image, 'base64')
    }

    // Upload to Vercel Blob
    const filename = `community/${Date.now()}-${Math.random().toString(36).substring(7)}.png`
    const blob = await put(filename, imageBuffer, {
      access: 'public',
      contentType: 'image/png'
    })

    // Save to database
    const communityImage = await prisma.communityImage.create({
      data: {
        userEmail: email,
        imageUrl: blob.url,
        description: description || null,
        approved: false // Requires admin approval
      }
    })

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully! It will appear in the community feed after approval.',
      imageId: communityImage.id
    })

  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({
      error: 'Failed to upload image'
    })
  }
}