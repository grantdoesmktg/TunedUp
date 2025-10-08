import { VercelRequest, VercelResponse } from '@vercel/node'
import { put } from '@vercel/blob'
import { jwtVerify } from 'jose'
import { prisma } from '../lib/prisma'

// Auto-create likes table if it doesn't exist
async function ensureLikesTable() {
  try {
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "community_image_likes" (
        "id" TEXT NOT NULL,
        "imageId" TEXT NOT NULL,
        "userEmail" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "community_image_likes_pkey" PRIMARY KEY ("id")
      );
    `

    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "community_image_likes_imageId_userEmail_key"
      ON "community_image_likes"("imageId", "userEmail");
    `

    // Try to add foreign key constraint (may fail if already exists)
    try {
      await prisma.$executeRaw`
        ALTER TABLE "community_image_likes"
        ADD CONSTRAINT "community_image_likes_imageId_fkey"
        FOREIGN KEY ("imageId") REFERENCES "community_images"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `
    } catch (fkError) {
      // Foreign key constraint probably already exists, ignore
    }
  } catch (error) {
    console.warn('Could not ensure likes table exists:', error)
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('Community API handler called with action:', req.query.action)
    const { action } = req.query

    if (action === 'upload') {
      return handleUpload(req, res)
    } else if (action === 'images') {
      return handleGetImages(req, res)
    } else if (action === 'like') {
      console.log('Calling handleLike...')
      return handleLike(req, res)
    } else {
      return res.status(400).json({ error: 'Invalid action' })
    }
  } catch (error: any) {
    console.error('Handler error:', error)
    return res.status(500).json({
      error: 'Handler failed',
      details: error.message
    })
  }
}

async function handleUpload(req: VercelRequest, res: VercelResponse) {
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
        approved: true // Auto-approve for development
      }
    })

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully! It will appear in the community feed immediately.',
      imageId: communityImage.id
    })

  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({
      error: 'Failed to upload image'
    })
  }
}

async function handleGetImages(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { page = '1', limit = '12' } = req.query
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    // Get approved community images
    const images = await prisma.communityImage.findMany({
      where: {
        approved: true
      },
      include: {
        user: {
          select: {
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limitNum
    })

    // Get total count for pagination
    const totalCount = await prisma.communityImage.count({
      where: {
        approved: true
      }
    })

    const totalPages = Math.ceil(totalCount / limitNum)

    res.status(200).json({
      images: images.map(img => ({
        id: img.id,
        imageUrl: img.imageUrl,
        description: img.description,
        likesCount: img.likesCount,
        createdAt: img.createdAt,
        userEmail: img.user.email.replace(/(.{2}).*@/, '$1***@') // Partially hide email
      })),
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    })

  } catch (error) {
    console.error('Get community images error:', error)
    res.status(500).json({
      error: 'Failed to fetch community images'
    })
  }
}

async function handleLike(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Starting handleLike function')

    // Get image ID from request body first
    const { imageId } = req.body
    console.log('Received imageId:', imageId)

    if (!imageId) {
      return res.status(400).json({ error: 'Image ID is required' })
    }

    // Get user email from session first
    let userEmail = null
    try {
      console.log('Attempting session verification...')
      const sessionCookie = req.headers.cookie
        ?.split(';')
        .find(c => c.trim().startsWith('session=') || c.trim().startsWith('_vercel_jwt='))
        ?.split('=')[1]

      console.log('Session cookie found:', !!sessionCookie)

      if (sessionCookie) {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
        const { payload } = await jwtVerify(sessionCookie.split(',')[0], secret)
        userEmail = payload.email as string
        console.log('Session verified for user:', userEmail)
      }
    } catch (error) {
      // If session verification fails, continue as anonymous user
      console.log('Session verification failed, continuing as anonymous user')
    }

    // Require authentication for likes to prevent spam
    if (!userEmail) {
      console.log('No userEmail found, returning 401')
      return res.status(401).json({ error: 'You must be logged in to like images' })
    }

    // Ensure likes table exists
    console.log('Ensuring likes table exists...')
    await ensureLikesTable()
    console.log('Likes table ensured')

    // Check if image exists
    console.log('Checking if image exists...')
    const image = await prisma.communityImage.findUnique({
      where: { id: imageId }
    })

    if (!image) {
      console.log('Image not found')
      return res.status(404).json({ error: 'Image not found' })
    }
    console.log('Image found:', image.id)

    // Check if user already liked this image (prevent spam)
    try {
      console.log('Checking for existing like:', { imageId, userEmail })

      // Use raw SQL query as fallback if Prisma model doesn't exist
      let existingLike
      try {
        existingLike = await prisma.communityImageLike.findUnique({
          where: {
            imageId_userEmail: {
              imageId: imageId,
              userEmail: userEmail
            }
          }
        })
      } catch (prismaError: any) {
        console.log('Prisma model not available, using raw SQL:', prismaError.message)
        // Use raw SQL as fallback
        const result = await prisma.$queryRaw`
          SELECT * FROM community_image_likes
          WHERE "imageId" = ${imageId} AND "userEmail" = ${userEmail}
          LIMIT 1
        `
        existingLike = Array.isArray(result) && result.length > 0 ? result[0] : null
      }

      if (existingLike) {
        console.log('User already liked this image:', existingLike)
        return res.status(400).json({ error: 'You have already liked this image' })
      }

      console.log('Creating new like record:', { imageId, userEmail })
      // Create like record
      try {
        await prisma.communityImageLike.create({
          data: {
            imageId: imageId,
            userEmail: userEmail
          }
        })
      } catch (prismaError: any) {
        console.log('Prisma create failed, using raw SQL:', prismaError.message)
        // Use raw SQL as fallback
        await prisma.$executeRaw`
          INSERT INTO community_image_likes ("id", "imageId", "userEmail", "createdAt")
          VALUES (${`cuid_${Date.now()}_${Math.random().toString(36).substring(2)}`}, ${imageId}, ${userEmail}, ${new Date()})
        `
      }
      console.log('Like record created successfully')
    } catch (error: any) {
      console.error('Error in like spam prevention:', error)
      return res.status(500).json({ error: 'Failed to process like request' })
    }

    // Increment like count on the image
    const updatedImage = await prisma.communityImage.update({
      where: { id: imageId },
      data: {
        likesCount: { increment: 1 }
      }
    })

    return res.status(200).json({
      success: true,
      likesCount: updatedImage.likesCount
    })

  } catch (error: any) {
    console.error('Like image error:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    res.status(500).json({
      error: 'Failed to process like request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}