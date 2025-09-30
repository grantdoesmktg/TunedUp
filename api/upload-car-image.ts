import { VercelRequest, VercelResponse } from '@vercel/node'
import { put } from '@vercel/blob'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-email')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const userEmail = req.headers['x-user-email'] as string

  if (!userEmail) {
    return res.status(401).json({ error: 'User email required' })
  }

  try {
    // Get the file from the request body (base64 encoded)
    const { file, filename } = req.body

    if (!file) {
      return res.status(400).json({ error: 'No file provided' })
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(file, 'base64')

    // Upload to Vercel Blob
    const blobFilename = `car-images/${userEmail}/${Date.now()}-${filename || 'car-image.jpg'}`
    const blob = await put(blobFilename, buffer, {
      access: 'public'
    })

    // Update the active car with the new image URL
    const updatedCar = await prisma.savedCar.updateMany({
      where: {
        userEmail,
        isActive: true
      },
      data: {
        imageUrl: blob.url
      }
    })

    if (updatedCar.count === 0) {
      return res.status(404).json({ error: 'No active car found to update' })
    }

    return res.status(200).json({
      success: true,
      imageUrl: blob.url,
      message: 'Image uploaded successfully'
    })

  } catch (error) {
    console.error('Image upload error:', error)
    return res.status(500).json({ error: 'Failed to upload image' })
  }
}