import { VercelRequest, VercelResponse } from '@vercel/node'
import { PrismaClient } from '@prisma/client'
import { put } from '@vercel/blob'

const prisma = new PrismaClient()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-email')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const userEmail = req.headers['x-user-email'] as string

  if (!userEmail) {
    return res.status(401).json({ error: 'User email required' })
  }

  try {
    if (req.method === 'GET') {
      // Get user's saved cars
      const savedCars = await prisma.savedCar.findMany({
        where: { userEmail },
        orderBy: [
          { isActive: 'desc' }, // Active car first
          { updatedAt: 'desc' }
        ]
      })

      return res.status(200).json(savedCars)
    }

    if (req.method === 'POST') {
      // Check if this is an image upload request
      const { action } = req.query

      if (action === 'upload-image') {
        // Handle image upload
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
      }
      // Create or update saved car
      const {
        name,
        make,
        model,
        year,
        trim,
        imageUrl,
        performanceData,
        buildPlanData,
        setAsActive = false
      } = req.body

      if (!name || !make || !model || !year) {
        return res.status(400).json({ error: 'Name, make, model, and year are required' })
      }

      // If setting as active, deactivate all others first
      if (setAsActive) {
        await prisma.savedCar.updateMany({
          where: { userEmail },
          data: { isActive: false }
        })
      }

      const savedCar = await prisma.savedCar.create({
        data: {
          userEmail,
          name,
          make,
          model,
          year,
          trim,
          imageUrl,
          performanceData,
          buildPlanData,
          isActive: setAsActive
        }
      })

      return res.status(201).json(savedCar)
    }

    if (req.method === 'PUT') {
      // Update existing saved car
      const { id, ...updateData } = req.body

      if (!id) {
        return res.status(400).json({ error: 'Car ID required' })
      }

      // If setting as active, deactivate all others first
      if (updateData.setAsActive) {
        await prisma.savedCar.updateMany({
          where: { userEmail },
          data: { isActive: false }
        })
        updateData.isActive = true
        delete updateData.setAsActive
      }

      const savedCar = await prisma.savedCar.update({
        where: {
          id,
          userEmail // Ensure user owns this car
        },
        data: updateData
      })

      return res.status(200).json(savedCar)
    }

    if (req.method === 'DELETE') {
      // Delete saved car
      const { id } = req.body

      if (!id) {
        return res.status(400).json({ error: 'Car ID required' })
      }

      await prisma.savedCar.delete({
        where: {
          id,
          userEmail // Ensure user owns this car
        }
      })

      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })

  } catch (error) {
    console.error('Saved cars API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}