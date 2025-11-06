import { VercelRequest, VercelResponse } from '@vercel/node'
import { put } from '@vercel/blob'
import { jwtVerify } from 'jose'
import { prisma } from './lib/prisma.js'
import { checkQuota, incrementUsage } from '../lib/quota.js'
import { moderateContent, getModerationErrorMessage } from './lib/moderation.js'

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
    } else if (action === 'random') {
      return handleGetRandom(req, res)
    } else if (action === 'like') {
      console.log('Calling handleLike...')
      return handleLike(req, res)
    } else if (action === 'public-profile') {
      return handleGetPublicProfile(req, res)
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

    // Check community quota
    const quotaCheck = await checkQuota(email, 'community')

    if (!quotaCheck.allowed) {
      return res.status(429).json({
        error: 'QUOTA_EXCEEDED',
        ...quotaCheck
      })
    }

    // Parse form data
    const { image, description } = req.body

    if (!image) {
      return res.status(400).json({ error: 'Image is required' })
    }

    // Moderate description if provided
    if (description && description.trim().length > 0) {
      console.log('🛡️ Moderating community post description...')
      const moderationResult = await moderateContent(description)

      if (moderationResult.flagged) {
        const errorMessage = getModerationErrorMessage(moderationResult)
        console.log('❌ Content flagged by moderation:', errorMessage)
        return res.status(400).json({
          error: 'CONTENT_MODERATION_FAILED',
          message: errorMessage
        })
      }
      console.log('✅ Content passed moderation')
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

    // Increment community usage
    await incrementUsage(email, 'community')

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

    // DEBUG: Log all users in database
    const allUsers = await prisma.user.findMany({ select: { email: true } })
    console.log('📊 DEBUG - Total users in DB:', allUsers.length)
    console.log('📧 DEBUG - All user emails:', allUsers.map(u => u.email).join(', '))

    // Get approved community images
    const images = await prisma.communityImage.findMany({
      where: {
        approved: true
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            planCode: true,
            name: true,
            nickname: true,
            profileIcon: true
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
        userId: img.user.id,
        userName: img.user.name,
        userNickname: img.user.nickname,
        profileIcon: img.user.profileIcon,
        userEmail: img.user.email.replace(/(.{2}).*@/, '$1***@'), // Partially hide email
        planCode: img.user.planCode
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

async function handleGetRandom(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { count = '3' } = req.query
    const countNum = parseInt(count as string)

    // Get all approved community images first
    const allImages = await prisma.communityImage.findMany({
      where: {
        approved: true
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            planCode: true,
            name: true,
            nickname: true,
            profileIcon: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Shuffle and take random subset
    const shuffled = allImages.sort(() => Math.random() - 0.5)
    const images = shuffled.slice(0, countNum)

    res.status(200).json({
      images: images.map(img => ({
        id: img.id,
        imageUrl: img.imageUrl,
        description: img.description,
        likesCount: img.likesCount,
        createdAt: img.createdAt,
        userId: img.user.id,
        userName: img.user.name,
        userNickname: img.user.nickname,
        profileIcon: img.user.profileIcon,
        userEmail: img.user.email.replace(/(.{2}).*@/, '$1***@'), // Partially hide email
        planCode: img.user.planCode
      }))
    })

  } catch (error) {
    console.error('Get random community images error:', error)
    res.status(500).json({
      error: 'Failed to fetch random community images'
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

async function handleGetPublicProfile(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId } = req.query
    console.log('🔍 handleGetPublicProfile called with userId:', userId)

    if (!userId || typeof userId !== 'string') {
      console.error('❌ Invalid userId:', userId)
      return res.status(400).json({ error: 'User ID is required' })
    }

    // Get user public profile data including email for images query
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        location: true,
        instagramHandle: true,
        profileIcon: true,
        backgroundTheme: true,
        planCode: true,
        createdAt: true,
      }
    })

    if (!user) {
      console.error('❌ User not found for userId:', userId)
      return res.status(404).json({ error: 'User not found' })
    }

    console.log('✅ User found:', { id: user.id, email: user.email })

    // Get user's community images using the email we already have
    const images = await prisma.communityImage.findMany({
      where: {
        userEmail: user.email,
        approved: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    })

    console.log('✅ Found', images.length, 'images for user')

    // Get user's saved performance calculation (if any)
    const savedPerformance = await prisma.saved_performance.findUnique({
      where: {
        userEmail: user.email
      }
    })

    console.log('✅ Saved performance:', savedPerformance ? 'Found' : 'None')

    // Prepare savedPerformance data - only include if it has valid data
    let savedPerformanceData = null
    if (savedPerformance && savedPerformance.carInput && savedPerformance.results) {
      savedPerformanceData = {
        carInput: savedPerformance.carInput,
        results: savedPerformance.results
      }
    }

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name || null,
        nickname: user.nickname || null,
        displayName: user.nickname || user.name || 'TunedUp User',
        location: user.location || null,
        instagramHandle: user.instagramHandle || null,
        profileIcon: user.profileIcon || '👤',
        backgroundTheme: user.backgroundTheme || 'midnight',
        planCode: user.planCode || 'FREE',
        memberSince: user.createdAt
      },
      images: images.map(img => ({
        id: img.id,
        imageUrl: img.imageUrl,
        description: img.description || null,
        likesCount: img.likesCount || 0,
        createdAt: img.createdAt
      })),
      savedPerformance: savedPerformanceData,
      stats: {
        totalImages: images.length,
        totalLikes: images.reduce((sum, img) => sum + (img.likesCount || 0), 0)
      }
    })

  } catch (error: any) {
    console.error('❌ Get public profile error:', error)
    console.error('Error message:', error?.message)
    console.error('Error stack:', error?.stack)
    res.status(500).json({
      error: 'Failed to fetch public profile',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}